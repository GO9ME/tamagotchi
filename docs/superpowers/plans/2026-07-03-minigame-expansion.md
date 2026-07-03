# 미니게임 5종 신규 추가 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "놀이" 탭 미니게임을 슬롯머신·행운뽑기 2종에서 룰렛·낚시·다트(럭 기반) + 가위바위보·타이밍 챌린지(스킬 기반) 5종을 더해 7종으로 늘린다.

**Architecture:** 기존 `playSlots(c, rand)` / `playGacha(c, rand, rand2)`와 동일한 순수함수 패턴을 유지한다. 럭 기반 3종은 `rand: number` 하나만 받고 `luckBonus(c)`로 확률을 보정한다. 가위바위보는 유저 선택(`RpsChoice`) + CPU 패를 결정하는 `rand`를 받는다. 타이밍 챌린지는 UI가 계산한 정확도(`accuracy: number`, 0~1)를 받는다 — `Date.now()`/타이머는 `MinigamePanel.tsx` 컴포넌트에만 존재하고, 게임 로직 함수 자체는 여전히 순수함수라 테스트가 결정적이다. 스토어의 `playMinigame` 액션이 `kind`별로 대응 함수에 분기하도록 확장하고, UI는 가위바위보/타이밍 챌린지만 인라인 선택 UI를 추가로 노출한다.

**Tech Stack:** TypeScript, Vitest, Zustand, Next.js/React

**참고 스펙:** [docs/superpowers/specs/2026-07-03-play-gacha-expansion-design.md](../specs/2026-07-03-play-gacha-expansion-design.md) 섹션 A

---

### Task 1: 타입 확장 — `MinigameKind`, `RpsChoice`

**Files:**
- Modify: `lib/game/minigame.ts:23`

- [ ] **Step 1: `MinigameKind`에 5개 추가 + `RpsChoice` 타입 신규**

`lib/game/minigame.ts`에서 아래 줄을 찾는다:

```ts
export type MinigameKind = "slots" | "gacha";
```

다음으로 교체한다:

```ts
export type MinigameKind =
  | "slots"
  | "gacha"
  | "roulette"
  | "fishing"
  | "darts"
  | "rps"
  | "timing";

export type RpsChoice = "rock" | "paper" | "scissors";
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음(아직 `MinigamePanel.tsx`의 `GAMES` 배열이 새 kind를 안 쓰므로 통과)

- [ ] **Step 3: Commit**

```bash
git add lib/game/minigame.ts
git commit -m "feat: MinigameKind에 5종 추가, RpsChoice 타입 신규"
```

---

### Task 2: 럭 기반 미니게임 3종 — 룰렛·낚시·다트

**Files:**
- Modify: `lib/game/minigame.ts`
- Test: `lib/game/__tests__/minigame.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/game/__tests__/minigame.test.ts` 상단 import 블록을 찾는다:

```ts
import {
  canPlayMinigame,
  LUCK_CAP,
  LUCK_PER_PLAY,
  luckBonus,
  MINIGAME_ENERGY_COST,
  MINIGAME_MIN_AGE,
  playGacha,
  playSlots,
} from "../minigame";
```

다음으로 교체한다:

```ts
import {
  canPlayMinigame,
  LUCK_CAP,
  LUCK_PER_PLAY,
  luckBonus,
  MINIGAME_ENERGY_COST,
  MINIGAME_MIN_AGE,
  playDarts,
  playFishing,
  playGacha,
  playRoulette,
  playSlots,
} from "../minigame";
```

파일 맨 끝(마지막 `});` 다음)에 아래 테스트를 추가한다:

```ts

describe("룰렛", () => {
  it("rand 낮으면 대박(+80만원), 높으면 꽝 — 둘 다 체력 소모", () => {
    const c = make();
    const jackpot = playRoulette(c, 0);
    expect(jackpot.fx?.tier).toBe("jackpot");
    expect(jackpot.savingsDelta).toBe(80);
    const miss = playRoulette(c, 0.999);
    expect(miss.fx).toBeNull();
    expect(miss.savingsDelta).toBe(0);
    for (const r of [jackpot, miss]) {
      expect(r.effect.status?.energy).toBe(-MINIGAME_ENERGY_COST);
    }
  });
});

describe("낚시", () => {
  it("rand 낮으면 월척(+60만원), 높으면 헛탕", () => {
    const c = make();
    const big = playFishing(c, 0);
    expect(big.fx?.tier).toBe("great");
    expect(big.savingsDelta).toBe(60);
    const miss = playFishing(c, 0.999);
    expect(miss.fx).toBeNull();
    expect(miss.savingsDelta).toBe(0);
  });
});

describe("다트", () => {
  it("rand 낮으면 불스아이(스탯 포인트 +1), 높으면 완전히 빗나감", () => {
    const c = make();
    const bullseye = playDarts(c, 0);
    expect(bullseye.statPointsDelta).toBe(1);
    expect(bullseye.fx?.tier).toBe("great");
    const miss = playDarts(c, 0.999);
    expect(miss.statPointsDelta).toBe(0);
    expect(miss.effect.status?.stress).toBe(3);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npm test -- minigame.test`
Expected: FAIL — `playDarts`/`playFishing`/`playRoulette`를 `../minigame`에서 찾을 수 없다는 임포트 에러

- [ ] **Step 3: 세 함수 구현**

`lib/game/minigame.ts`에서 `playGacha` 함수 전체가 끝나는 지점(파일 맨 끝) 뒤에 아래 3개 함수를 추가한다:

```ts

/** 룰렛 — 저축금 + 스트레스 해소. 슬롯보다 칸이 많아 변동폭이 크다 */
export function playRoulette(c: Character, rand: number): MinigameResult {
  const b = luckBonus(c);
  const r = rand * 100;
  const jackpotP = 2 + b * 0.2;
  const bigP = jackpotP + 10 + b * 0.5;
  const smallP = bigP + 28 + b;

  if (r < jackpotP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 15, stress: -20 },
        stats: gainStats(c),
        exp: 15,
        message: "🎡 대박 칸! 스트레스가 확 풀려요 (+80만원)",
      },
      savingsDelta: 80,
      statPointsDelta: 0,
      fx: { tier: "jackpot", label: "🎡 대박!" },
    };
  }
  if (r < bigP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 8, stress: -12 },
        stats: gainStats(c),
        exp: 8,
        message: "🎡 좋은 칸! (+15만원)",
      },
      savingsDelta: 15,
      statPointsDelta: 0,
      fx: { tier: "great", label: "🎡 좋은 칸!" },
    };
  }
  if (r < smallP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 3, stress: -6 },
        stats: gainStats(c),
        exp: 4,
        message: "🎡 소소한 칸 — 기분은 조금 나아졌어요",
      },
      savingsDelta: 0,
      statPointsDelta: 0,
      fx: null,
    };
  }
  return {
    effect: {
      status: { ...baseStatus, mood: -2, stress: 2 },
      stats: gainStats(c),
      exp: 2,
      message: "🎡 꽝… 그래도 한 바퀴 돌아서 상쾌해요",
    },
    savingsDelta: 0,
    statPointsDelta: 0,
    fx: null,
  };
}

/** 낚시 — 저축금 + exp, "월척"이 최상위 등급 */
export function playFishing(c: Character, rand: number): MinigameResult {
  const b = luckBonus(c);
  const r = rand * 100;
  const bigCatchP = 3 + b * 0.3;
  const midCatchP = bigCatchP + 15 + b * 0.6;
  const smallCatchP = midCatchP + 35 + b;

  if (r < bigCatchP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 10 },
        stats: gainStats(c),
        exp: 20,
        message: "🎣 월척이다! 잉어 반, 사람 반 소동",
      },
      savingsDelta: 60,
      statPointsDelta: 0,
      fx: { tier: "great", label: "🎣 월척!" },
    };
  }
  if (r < midCatchP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 5 },
        stats: gainStats(c),
        exp: 8,
        message: "🎣 잉어 낚았어요!",
      },
      savingsDelta: 15,
      statPointsDelta: 0,
      fx: null,
    };
  }
  if (r < smallCatchP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 2 },
        stats: gainStats(c),
        exp: 4,
        message: "🎣 손바닥만한 붕어",
      },
      savingsDelta: 3,
      statPointsDelta: 0,
      fx: null,
    };
  }
  return {
    effect: {
      status: { ...baseStatus, mood: -2, stress: 2 },
      stats: gainStats(c),
      exp: 2,
      message: "🎣 헌 신발만 건졌어요…",
    },
    savingsDelta: 0,
    statPointsDelta: 0,
    fx: null,
  };
}

/** 다트 — 스탯(집중력/자신감) 위주 보상. 돈은 걸리지 않는다 */
export function playDarts(c: Character, rand: number): MinigameResult {
  const b = luckBonus(c);
  const r = rand * 100;
  const bullseyeP = 3 + b * 0.3;
  const innerP = bullseyeP + 15 + b * 0.6;
  const outerP = innerP + 35 + b;

  if (r < bullseyeP) {
    return {
      effect: {
        status: { ...baseStatus, focus: 8, confidence: 6 },
        stats: gainStats(c),
        exp: 18,
        message: "🎯 불스아이! 스탯 포인트 +1",
      },
      savingsDelta: 0,
      statPointsDelta: 1,
      fx: { tier: "great", label: "🎯 불스아이!" },
    };
  }
  if (r < innerP) {
    return {
      effect: {
        status: { ...baseStatus, focus: 10 },
        stats: gainStats(c),
        exp: 8,
        message: "🎯 인링 명중! 집중력이 올라가요",
      },
      savingsDelta: 0,
      statPointsDelta: 0,
      fx: null,
    };
  }
  if (r < outerP) {
    return {
      effect: {
        status: { ...baseStatus, confidence: 6 },
        stats: gainStats(c),
        exp: 4,
        message: "🎯 아웃링, 그래도 나쁘지 않아요",
      },
      savingsDelta: 0,
      statPointsDelta: 0,
      fx: null,
    };
  }
  return {
    effect: {
      status: { ...baseStatus, stress: 3, mood: -2 },
      stats: gainStats(c),
      exp: 2,
      message: "🎯 완전히 빗나갔어요",
    },
    savingsDelta: 0,
    statPointsDelta: 0,
    fx: null,
  };
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npm test -- minigame.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/game/minigame.ts lib/game/__tests__/minigame.test.ts
git commit -m "feat: 럭 기반 미니게임 3종(룰렛/낚시/다트) 추가"
```

---

### Task 3: 스킬 기반 미니게임 1 — 가위바위보

**Files:**
- Modify: `lib/game/minigame.ts`
- Test: `lib/game/__tests__/minigame.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/game/__tests__/minigame.test.ts` 상단 import에 `playRps`, `type RpsChoice`를 추가한다(Task 2에서 만든 import 블록을 찾아 교체):

```ts
import {
  canPlayMinigame,
  LUCK_CAP,
  LUCK_PER_PLAY,
  luckBonus,
  MINIGAME_ENERGY_COST,
  MINIGAME_MIN_AGE,
  playDarts,
  playFishing,
  playGacha,
  playRoulette,
  playRps,
  playSlots,
  type RpsChoice,
} from "../minigame";
```

파일 끝에 테스트를 추가한다:

```ts

describe("가위바위보", () => {
  it("이기면 승리 보상, 같으면 무승부, 지면 스트레스", () => {
    const c = make();
    const win = playRps(c, "paper", 0); // rand=0 → CPU 바위 → 보로 승리
    expect(win.fx?.tier).toBe("good");
    expect(win.savingsDelta).toBe(5);
    const draw = playRps(c, "rock", 0); // CPU 바위 → 무승부
    expect(draw.fx).toBeNull();
    expect(draw.savingsDelta).toBe(0);
    expect(draw.effect.status?.mood).toBe(2);
    const lose = playRps(c, "rock", 0.4); // rand=0.4 → CPU 보 → 패배
    expect(lose.effect.status?.stress).toBe(4);
  });

  it("행운 스탯과 무관하게 순수 스킬 판정이다(승률 결정에 luckBonus 미사용)", () => {
    const c = make();
    c.stats.luck = 100; // 최대 행운이어도
    const lose = playRps(c, "rock", 0.4); // CPU 보 → 여전히 패배
    expect(lose.effect.status?.stress).toBe(4);
  });
});
```

`RpsChoice`는 테스트에서 문자열 리터럴로만 쓰이므로 실제로 타입 임포트가 꼭 필요하진 않지만, 명시적으로 남겨 타입 안정성을 보장한다.

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npm test -- minigame.test`
Expected: FAIL — `playRps`를 `../minigame`에서 찾을 수 없다는 임포트 에러

- [ ] **Step 3: `playRps` 구현**

`lib/game/minigame.ts`의 `playDarts` 함수 뒤에 추가한다:

```ts

/** 가위바위보 — 유저 선택 vs 랜덤 CPU. 순수 스킬 콘텐츠라 행운 보정이 없다 */
export function playRps(c: Character, userChoice: RpsChoice, rand: number): MinigameResult {
  const choices: RpsChoice[] = ["rock", "paper", "scissors"];
  const cpuChoice = choices[Math.min(choices.length - 1, Math.floor(rand * choices.length))];
  const beats: Record<RpsChoice, RpsChoice> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };
  const cpuLabel = cpuChoice === "rock" ? "바위" : cpuChoice === "paper" ? "보" : "가위";

  if (userChoice === cpuChoice) {
    return {
      effect: {
        status: { ...baseStatus, mood: 2 },
        stats: gainStats(c),
        exp: 4,
        message: `✊ 무승부! 둘 다 ${cpuLabel}를 냈어요`,
      },
      savingsDelta: 0,
      statPointsDelta: 0,
      fx: null,
    };
  }
  if (beats[userChoice] === cpuChoice) {
    return {
      effect: {
        status: { ...baseStatus, mood: 10, confidence: 8 },
        stats: gainStats(c),
        exp: 10,
        message: "✊ 승리! 짜릿한 한 판이었어요 (+5만원)",
      },
      savingsDelta: 5,
      statPointsDelta: 0,
      fx: { tier: "good", label: "✊ 승리!" },
    };
  }
  return {
    effect: {
      status: { ...baseStatus, stress: 4, mood: -3 },
      stats: gainStats(c),
      exp: 2,
      message: "✊ 패배… 다음엔 이길 거예요",
    },
    savingsDelta: 0,
    statPointsDelta: 0,
    fx: null,
  };
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npm test -- minigame.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/game/minigame.ts lib/game/__tests__/minigame.test.ts
git commit -m "feat: 스킬형 미니게임 가위바위보 추가"
```

---

### Task 4: 스킬 기반 미니게임 2 — 타이밍 챌린지

**Files:**
- Modify: `lib/game/minigame.ts`
- Test: `lib/game/__tests__/minigame.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/game/__tests__/minigame.test.ts` 상단 import에 `playTiming`을 추가한다(Task 3의 import 블록을 찾아 교체):

```ts
import {
  canPlayMinigame,
  LUCK_CAP,
  LUCK_PER_PLAY,
  luckBonus,
  MINIGAME_ENERGY_COST,
  MINIGAME_MIN_AGE,
  playDarts,
  playFishing,
  playGacha,
  playRoulette,
  playRps,
  playSlots,
  playTiming,
  type RpsChoice,
} from "../minigame";
```

파일 끝에 테스트를 추가한다:

```ts

describe("타이밍 챌린지", () => {
  it("정확도가 높으면 퍼펙트, 중간이면 굿, 낮으면 미스", () => {
    const c = make();
    const perfect = playTiming(c, 1);
    expect(perfect.fx?.tier).toBe("great");
    expect(perfect.savingsDelta).toBe(10);
    const good = playTiming(c, 0.6);
    expect(good.fx).toBeNull();
    expect(good.effect.status?.focus).toBe(8);
    const miss = playTiming(c, 0.3);
    expect(miss.effect.status?.stress).toBe(3);
  });

  it("정확도와 무관하게 체력은 항상 소모된다", () => {
    const c = make();
    expect(playTiming(c, 1).effect.status?.energy).toBe(-MINIGAME_ENERGY_COST);
    expect(playTiming(c, 0).effect.status?.energy).toBe(-MINIGAME_ENERGY_COST);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npm test -- minigame.test`
Expected: FAIL — `playTiming`을 `../minigame`에서 찾을 수 없다는 임포트 에러

- [ ] **Step 3: `playTiming` 구현**

`lib/game/minigame.ts`의 `playRps` 함수 뒤에 추가한다:

```ts

/**
 * 타이밍 챌린지 — UI가 계산한 정확도(0~1, 1이 정중앙 정지)를 그대로 받는 순수함수.
 * Date.now()/타이머는 컴포넌트 레벨에만 존재하고 이 함수는 결정적이다. 스킬 콘텐츠라 행운 보정 없음.
 */
export function playTiming(c: Character, accuracy: number): MinigameResult {
  if (accuracy >= 0.9) {
    return {
      effect: {
        status: { ...baseStatus, focus: 15, confidence: 8 },
        stats: gainStats(c),
        exp: 15,
        message: "⏱️ 퍼펙트! 완벽한 타이밍이에요 (+10만원)",
      },
      savingsDelta: 10,
      statPointsDelta: 0,
      fx: { tier: "great", label: "⏱️ 퍼펙트!" },
    };
  }
  if (accuracy >= 0.6) {
    return {
      effect: {
        status: { ...baseStatus, focus: 8 },
        stats: gainStats(c),
        exp: 8,
        message: "⏱️ 굿! 타이밍이 좋아요",
      },
      savingsDelta: 0,
      statPointsDelta: 0,
      fx: null,
    };
  }
  return {
    effect: {
      status: { ...baseStatus, stress: 3 },
      stats: gainStats(c),
      exp: 2,
      message: "⏱️ 아쉽게 놓쳤어요",
    },
    savingsDelta: 0,
    statPointsDelta: 0,
    fx: null,
  };
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npm test -- minigame.test`
Expected: PASS (전체 minigame.test.ts 스위트 통과)

- [ ] **Step 5: Commit**

```bash
git add lib/game/minigame.ts lib/game/__tests__/minigame.test.ts
git commit -m "feat: 스킬형 미니게임 타이밍 챌린지 추가"
```

---

### Task 5: 스토어 배선 — `playMinigame` 시그니처 확장

**Files:**
- Modify: `lib/store/useGameStore.ts:79-86` (import), `:151` (인터페이스), `:768-799` (구현)

- [ ] **Step 1: import 블록 확장**

`lib/store/useGameStore.ts`에서 아래 블록을 찾는다:

```ts
import {
  canPlayMinigame,
  LUCK_CAP,
  LUCK_PER_PLAY,
  playGacha,
  playSlots,
  type MinigameKind,
} from "@/lib/game/minigame";
```

다음으로 교체한다:

```ts
import {
  canPlayMinigame,
  LUCK_CAP,
  LUCK_PER_PLAY,
  playDarts,
  playFishing,
  playGacha,
  playRoulette,
  playRps,
  playSlots,
  playTiming,
  type MinigameKind,
  type RpsChoice,
} from "@/lib/game/minigame";
```

- [ ] **Step 2: 인터페이스 시그니처 확장**

아래 줄을 찾는다:

```ts
  playMinigame: (kind: MinigameKind) => ActionResult;
```

다음으로 교체한다:

```ts
  playMinigame: (
    kind: MinigameKind,
    extra?: { choice?: RpsChoice; accuracy?: number },
  ) => ActionResult;
```

- [ ] **Step 3: 구현 분기 확장**

아래 블록을 찾는다:

```ts
      playMinigame: (kind) => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        if (c.deathAge != null) return { ok: false, message: "이미 생을 마쳤어요." };
        const gate = canPlayMinigame(c);
        if (!gate.ok) return { ok: false, message: gate.reason ?? "지금은 할 수 없어요." };
        const result =
          kind === "slots"
            ? playSlots(c, Math.random())
            : playGacha(c, Math.random(), Math.random());
```

다음으로 교체한다:

```ts
      playMinigame: (kind, extra) => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        if (c.deathAge != null) return { ok: false, message: "이미 생을 마쳤어요." };
        const gate = canPlayMinigame(c);
        if (!gate.ok) return { ok: false, message: gate.reason ?? "지금은 할 수 없어요." };
        const result =
          kind === "slots" ? playSlots(c, Math.random())
          : kind === "gacha" ? playGacha(c, Math.random(), Math.random())
          : kind === "roulette" ? playRoulette(c, Math.random())
          : kind === "fishing" ? playFishing(c, Math.random())
          : kind === "darts" ? playDarts(c, Math.random())
          : kind === "rps" ? playRps(c, extra?.choice ?? "rock", Math.random())
          : playTiming(c, extra?.accuracy ?? 0);
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 전체 테스트 실행**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/store/useGameStore.ts
git commit -m "feat: playMinigame 스토어 액션이 신규 5종 게임에 분기하도록 확장"
```

---

### Task 6: UI — `MinigamePanel.tsx`에 5종 추가 + 가위바위보/타이밍 인라인 인터랙션

**Files:**
- Modify: `components/minigame/MinigamePanel.tsx`

- [ ] **Step 1: 컴포넌트 전체 교체**

`components/minigame/MinigamePanel.tsx` 전체 내용을 아래로 교체한다:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import type { Character } from "@/types/character";
import {
  LUCK_CAP,
  MINIGAME_ENERGY_COST,
  MINIGAME_MIN_AGE,
  type MinigameKind,
  type RpsChoice,
} from "@/lib/game/minigame";
import { useGameStore } from "@/lib/store/useGameStore";

const GAMES: { kind: MinigameKind; emoji: string; label: string; desc: string }[] = [
  {
    kind: "slots",
    emoji: "🎰",
    label: "슬롯머신",
    desc: "7️⃣7️⃣7️⃣ 잭팟을 노려요 · 당첨금은 저축으로",
  },
  {
    kind: "gacha",
    emoji: "🎁",
    label: "행운 뽑기",
    desc: "랜덤 캡슐 · 희귀 캡슐엔 스탯 포인트",
  },
  {
    kind: "roulette",
    emoji: "🎡",
    label: "룰렛",
    desc: "돌리면 스트레스가 확 풀려요",
  },
  {
    kind: "fishing",
    emoji: "🎣",
    label: "낚시",
    desc: "월척을 노려보세요",
  },
  {
    kind: "darts",
    emoji: "🎯",
    label: "다트",
    desc: "불스아이면 스탯 포인트",
  },
  {
    kind: "rps",
    emoji: "✊",
    label: "가위바위보",
    desc: "이기면 자신감이 쑥",
  },
  {
    kind: "timing",
    emoji: "⏱️",
    label: "타이밍 챌린지",
    desc: "정확히 멈추면 대성공",
  },
];

const RPS_LABEL: Record<RpsChoice, string> = {
  rock: "✊ 바위",
  paper: "✋ 보",
  scissors: "✌️ 가위",
};

/** 타이밍 바 한 바퀴 길이(ms) — 짧을수록 어렵다 */
const TIMING_CYCLE_MS = 1200;

export function MinigamePanel({ character }: { character: Character }) {
  const playMinigame = useGameStore((s) => s.playMinigame);
  const [expanded, setExpanded] = useState<"rps" | "timing" | null>(null);
  const [timingStart, setTimingStart] = useState<number | null>(null);
  const [timingProgress, setTimingProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (expanded !== "timing" || timingStart == null) return;
    const tick = () => {
      const elapsed = (Date.now() - timingStart) % TIMING_CYCLE_MS;
      setTimingProgress(elapsed / TIMING_CYCLE_MS);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [expanded, timingStart]);

  // 미취학 아동에겐 숨김(도박 콘텐츠) — 실제 게이트는 canPlayMinigame 에도 있음
  if (character.ageYears < MINIGAME_MIN_AGE) return null;
  const lacking = character.status.energy < MINIGAME_ENERGY_COST;
  const luckMaxed = character.stats.luck >= LUCK_CAP;

  const openGame = (kind: MinigameKind) => {
    if (kind === "rps") {
      setExpanded("rps");
      return;
    }
    if (kind === "timing") {
      setExpanded("timing");
      setTimingStart(Date.now());
      return;
    }
    playMinigame(kind);
  };

  const pickRps = (choice: RpsChoice) => {
    playMinigame("rps", { choice });
    setExpanded(null);
  };

  const stopTiming = () => {
    // 중앙(50%)에 가까울수록 정확도가 높다
    const accuracy = Math.max(0, 1 - Math.abs(timingProgress - 0.5) * 2);
    playMinigame("timing", { accuracy });
    setExpanded(null);
    setTimingStart(null);
  };

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">미니게임</h3>
        <span className="pill bg-butter/60 text-ink">
          🍀 행운 {luckMaxed ? "MAX" : Math.round(character.stats.luck)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {GAMES.map((g) => (
          <button
            key={g.kind}
            type="button"
            disabled={lacking}
            onClick={() => openGame(g.kind)}
            className="toy-btn flex min-h-[68px] w-full flex-col items-start gap-1 bg-grape/30 text-left disabled:opacity-50"
          >
            <span className="text-lg leading-none">{g.emoji}</span>
            <span className="text-sm font-bold">{g.label}</span>
            <span className="font-sans text-[11px] font-medium leading-tight text-ink/55">
              {g.desc}
            </span>
          </button>
        ))}
      </div>

      {expanded === "rps" && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-grape/10 p-3">
          {(["rock", "paper", "scissors"] as RpsChoice[]).map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => pickRps(choice)}
              className="toy-btn flex-1 py-2 text-sm font-bold"
            >
              {RPS_LABEL[choice]}
            </button>
          ))}
        </div>
      )}

      {expanded === "timing" && (
        <div className="mt-3 rounded-xl bg-grape/10 p-3">
          <div className="relative h-3 overflow-hidden rounded-full bg-white/60">
            <span className="absolute inset-y-0 left-[42%] w-[16%] bg-butter/80" />
            <span
              className="absolute inset-y-0 w-[3px] bg-ink"
              style={{ left: `${timingProgress * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={stopTiming}
            className="toy-btn mt-2 w-full py-2 text-sm font-bold"
          >
            정지!
          </button>
        </div>
      )}

      <p className="mt-2 font-sans text-[11px] font-medium text-ink/50">
        {lacking
          ? `체력이 부족해요. (체력 ${MINIGAME_ENERGY_COST} 필요)`
          : `쿨타임 없음 · 1회당 체력 -${MINIGAME_ENERGY_COST}${luckMaxed ? " · 행운이 최대예요!" : " · 플레이할수록 행운이 쌓여요"}`}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add components/minigame/MinigamePanel.tsx
git commit -m "feat: 미니게임 패널에 5종 UI + 가위바위보/타이밍 인라인 인터랙션 추가"
```

---

### Task 7: 개발 서버로 수동 확인

**Files:** (없음 — 수동 QA)

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev`

- [ ] **Step 2: 브라우저에서 확인**

`/dashboard` → 놀이 탭에서:
1. 7개 미니게임 버튼이 2열 그리드로 모두 보이는지 확인
2. 룰렛/낚시/다트는 클릭 즉시 결과 토스트가 뜨는지 확인
3. 가위바위보 클릭 시 바위/보/가위 3버튼이 인라인으로 나타나고, 선택하면 결과가 반영되고 선택 UI가 닫히는지 확인
4. 타이밍 챌린지 클릭 시 막대가 좌우로 움직이고 "정지!"를 누르면 결과가 반영되는지 확인(중앙 부근에서 정지하면 퍼펙트/굿, 가장자리에서 정지하면 미스가 뜨는지 몇 번 시도해서 체감 확인)
5. 체력이 부족한 상태(체력 12 미만)에서 모든 버튼이 비활성화되는지 확인

- [ ] **Step 3: 서버 종료**

확인 후 개발 서버를 중지한다.

---

### Task 8: 최종 검증

**Files:** (없음 — 검증만)

- [ ] **Step 1: 전체 테스트 스위트**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: 린트**

Run: `npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 빌드**

Run: `npm run build`
Expected: 빌드 성공(타입 에러 없음)
