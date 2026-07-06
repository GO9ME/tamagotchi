# 자동차 뽑기 확장 + 자산가치 버그 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자동차 뽑기 후보를 3종(티어당 1대)에서 9종(티어당 3대)으로 늘리고, 이 과정에서 드러나는 "티어당 1대" 전제의 순자산 계산 버그(`assetValue`/`canBuyAsset`)를 고친다.

**Architecture:** `lib/game/assets.ts`의 데이터(`ASSETS`)만 늘리면 `shopGacha.ts`의 확률 로직은 무수정으로 재사용 가능하다. 다만 `assetValue`/`canBuyAsset`이 `ASSETS.find(a => a.tier === X)`로 "티어당 아이템 1개"를 가정하고 있어, 실제 소유한 키가 아니라 배열상 먼저 나오는 아이템을 집어오는 버그가 있다. 이를 실제 소유 키 기준으로 찾는 `ownedAssetOf` 헬퍼로 교체한다. UI(`AssetPanel.tsx`)의 "보유 중/매각함" 판정도 티어 기준에서 키 기준으로 함께 수정한다.

**Tech Stack:** TypeScript, Vitest, Zustand, Next.js/React

**참고 스펙:** [docs/superpowers/specs/2026-07-03-play-gacha-expansion-design.md](../specs/2026-07-03-play-gacha-expansion-design.md) 섹션 D

---

### Task 1: `AssetKey` 타입에 신규 자동차 6종 추가

**Files:**
- Modify: `types/character.ts:100-103`

- [ ] **Step 1: `AssetKey` 유니언 확장**

`types/character.ts`에서 아래 블록을 찾는다:

```ts
/** 대형 자산 키(자동차) — 티어 업그레이드 방식(이전 자산 매각 가정, 차액만 지불) */
export type AssetKey =
  | "carCompact" // 경차
  | "carSedan" // 중형 세단
  | "carImport"; // 수입차
```

다음으로 교체한다:

```ts
/** 대형 자산 키(자동차) — 티어 업그레이드 방식(이전 자산 매각 가정, 차액만 지불) */
export type AssetKey =
  | "carCompact" // 경차
  | "carCompactWagon" // 박스카 왜건
  | "carCompactCoupe" // 미니 쿠페
  | "carSedan" // 중형 세단
  | "carHybrid" // 하이브리드 세단
  | "carSuv" // SUV
  | "carImport" // 수입차
  | "carImportSuv" // 수입 SUV
  | "carSupercar"; // 슈퍼카
```

- [ ] **Step 2: 타입 체크로 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음(아직 `ASSETS` 배열에 신규 키를 쓰지 않았으므로 컴파일 통과)

- [ ] **Step 3: Commit**

```bash
git add types/character.ts
git commit -m "feat: AssetKey에 자동차 6종 추가"
```

---

### Task 2: `ASSETS` 배열에 신규 자동차 데이터 추가

**Files:**
- Modify: `lib/game/assets.ts:25-29`

- [ ] **Step 1: `ASSETS` 배열 교체**

`lib/game/assets.ts`에서 아래 블록을 찾는다:

```ts
export const ASSETS: AssetDef[] = [
  { key: "carCompact", category: "car", tier: 1, label: "경차", emoji: "🚗", price: 2000, desc: "나의 첫 차" },
  { key: "carSedan", category: "car", tier: 2, label: "중형 세단", emoji: "🚙", price: 6000, desc: "묵직한 승차감" },
  { key: "carImport", category: "car", tier: 3, label: "수입차", emoji: "🏎️", price: 15000, desc: "드디어 드림카" },
];
```

다음으로 교체한다:

```ts
export const ASSETS: AssetDef[] = [
  { key: "carCompactWagon", category: "car", tier: 1, label: "박스카 왜건", emoji: "🚐", price: 1900, desc: "짐 많이 실리는 든든한 왜건" },
  { key: "carCompact", category: "car", tier: 1, label: "경차", emoji: "🚗", price: 2000, desc: "나의 첫 차" },
  { key: "carCompactCoupe", category: "car", tier: 1, label: "미니 쿠페", emoji: "🚕", price: 2100, desc: "아담하지만 스포티하게" },
  { key: "carHybrid", category: "car", tier: 2, label: "하이브리드 세단", emoji: "🔋", price: 5800, desc: "연비 좋은 하이브리드 세단" },
  { key: "carSedan", category: "car", tier: 2, label: "중형 세단", emoji: "🚙", price: 6000, desc: "묵직한 승차감" },
  { key: "carSuv", category: "car", tier: 2, label: "SUV", emoji: "🛻", price: 6200, desc: "가족과 함께, 넉넉한 SUV" },
  { key: "carImport", category: "car", tier: 3, label: "수입차", emoji: "🏎️", price: 15000, desc: "드디어 드림카" },
  { key: "carImportSuv", category: "car", tier: 3, label: "수입 SUV", emoji: "🚙", price: 16000, desc: "수입 SUV, 가족과 함께 하는 럭셔리" },
  { key: "carSupercar", category: "car", tier: 3, label: "슈퍼카", emoji: "🏁", price: 18000, desc: "레이스가 절로 떠오르는 슈퍼카" },
];
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 기존 테스트 실행 — 실패 확인**

Run: `npm test -- shopGacha`
Expected: FAIL — `자동차 풀: 보유 티어보다 높은 차만...` 테스트가 `["carImport"]`를 기대하지만 실제로는 `["carImport", "carImportSuv", "carSupercar"]`가 나와서 깨짐. `마지막 남은 아이템은 확정 지급이므로...` 테스트도 함께 깨짐(carSedan 소유 시 남는 차가 1개가 아니라 3개이므로 `pull.item.key`가 `carImport`라고 보장 안 됨).

이 실패는 Task 3에서 테스트를 새 데이터에 맞게 고치면서 해결한다.

- [ ] **Step 4: Commit**

```bash
git add lib/game/assets.ts
git commit -m "feat: 자동차 뽑기 후보를 티어당 3종(총 9종)으로 확장"
```

---

### Task 3: 기존 `shopGacha.test.ts`를 신규 자동차 데이터에 맞게 수정

**Files:**
- Modify: `lib/game/__tests__/shopGacha.test.ts`

- [ ] **Step 1: "자동차 풀" 테스트의 기대값 수정**

`lib/game/__tests__/shopGacha.test.ts`에서 아래 테스트를 찾는다:

```ts
  it("자동차 풀: 보유 티어보다 높은 차만, 최고 티어 보유 시 뽑기 불가", () => {
    const c = make();
    c.assets = ["carSedan"];
    expect(gachaPool(c, "car").map((i) => i.key)).toEqual(["carImport"]);
    c.assets = ["carImport"];
    expect(gachaPool(c, "car")).toHaveLength(0);
    expect(canPullGacha(c, "car").ok).toBe(false);
  });
```

다음으로 교체한다(티어2인 `carSedan`을 소유하면 티어3 세 종류가 모두 후보가 되고, 가격 오름차순으로 정렬됨):

```ts
  it("자동차 풀: 보유 티어보다 높은 차만, 최고 티어 보유 시 뽑기 불가", () => {
    const c = make();
    c.assets = ["carSedan"];
    expect(gachaPool(c, "car").map((i) => i.key)).toEqual([
      "carImport",
      "carImportSuv",
      "carSupercar",
    ]);
    c.assets = ["carImport"];
    expect(gachaPool(c, "car")).toHaveLength(0);
    expect(canPullGacha(c, "car").ok).toBe(false);
  });
```

- [ ] **Step 2: "마지막 남은 아이템" 테스트를 room 카테고리로 교체**

같은 파일에서 아래 테스트를 찾는다:

```ts
  it("마지막 남은 아이템은 확정 지급이므로 레어 연출 없음", () => {
    const c = make();
    c.assets = ["carSedan"]; // 수입차 1개만 남음
    const pull = pullShopGacha(c, "car", 0.99, 0.5)!;
    expect(pull.item.key).toBe("carImport");
    expect(pull.rare).toBe(false);
  });
```

이제 자동차 카테고리는 티어당 3종이라 "1개만 남는" 상태가 절대 나오지 않는다(한 티어를 얻으면 그 티어 전체가 한번에 후보에서 빠지기 때문). 이 케이스는 개별 아이템 단위로 하나씩 소장하는 `room` 카테고리로 옮겨서 같은 동작(마지막 1개 확정 지급)을 검증한다. 다음으로 교체한다:

```ts
  it("마지막 남은 아이템은 확정 지급이므로 레어 연출 없음", () => {
    const c = make();
    c.roomItems = ROOM_ITEMS.filter((i) => i.key !== "artFrame").map((i) => i.key);
    const pull = pullShopGacha(c, "room", 0.99, 0.5)!;
    expect(pull.item.key).toBe("artFrame");
    expect(pull.rare).toBe(false);
  });
```

- [ ] **Step 3: `ROOM_ITEMS` import 추가**

파일 상단 import 블록을 찾는다:

```ts
import {
  canPullGacha,
  GACHA_CONFIG,
  gachaPool,
  pullShopGacha,
} from "../shopGacha";
```

바로 아래 줄에 추가한다:

```ts
import { ROOM_ITEMS } from "../roomItems";
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npm test -- shopGacha`
Expected: PASS (전체 6개 테스트 통과)

- [ ] **Step 5: Commit**

```bash
git add lib/game/__tests__/shopGacha.test.ts
git commit -m "test: 자동차 뽑기 확장에 맞춰 shopGacha 테스트 갱신"
```

---

### Task 4: 자산가치 버그를 드러내는 실패 테스트 작성

**Files:**
- Create: `lib/game/__tests__/assets.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/game/__tests__/assets.test.ts` 파일을 새로 만든다:

```ts
import { describe, expect, it } from "vitest";

import { assetValue, canBuyAsset, ownedTier } from "../assets";
import type { AssetKey } from "@/types/character";

describe("ownedTier — 같은 티어의 어느 차종을 소유해도 정확한 티어를 돌려준다", () => {
  it("티어2 세 차종(하이브리드/세단/SUV) 모두 티어 2를 반환한다", () => {
    expect(ownedTier(["carHybrid"] as AssetKey[], "car")).toBe(2);
    expect(ownedTier(["carSedan"] as AssetKey[], "car")).toBe(2);
    expect(ownedTier(["carSuv"] as AssetKey[], "car")).toBe(2);
  });
});

describe("assetValue — 실제 소유한 차종의 가격을 반영해야 한다", () => {
  it("같은 티어라도 소유한 차종에 따라 가치가 다르다", () => {
    expect(assetValue(["carHybrid"] as AssetKey[])).toBe(5800);
    expect(assetValue(["carSedan"] as AssetKey[])).toBe(6000);
    expect(assetValue(["carSuv"] as AssetKey[])).toBe(6200);
  });
});

describe("canBuyAsset — 업그레이드 차액은 실제 소유한 차종 기준이어야 한다", () => {
  it("저렴한 하이브리드를 소유했을 때 수입차 업그레이드 비용은 하이브리드 가격 기준 차액이다", () => {
    const result = canBuyAsset("carImport", ["carHybrid"] as AssetKey[], 999999);
    expect(result.cost).toBe(15000 - 5800);
  });

  it("더 비싼 SUV를 소유했을 때는 같은 업그레이드 비용이 더 적다", () => {
    const result = canBuyAsset("carImport", ["carSuv"] as AssetKey[], 999999);
    expect(result.cost).toBe(15000 - 6200);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인(버그 재현)**

Run: `npm test -- assets.test`
Expected: FAIL — `assetValue`/`canBuyAsset`가 실제 배열 순서상 먼저 나오는 티어2 정의(`carHybrid`, `ASSETS` 배열의 첫 번째 티어2 항목)의 가격만 돌려주므로, `carSedan`·`carSuv`를 소유한 케이스의 `expect`가 어긋난다.

- [ ] **Step 3: Commit (실패하는 테스트를 커밋 — TDD 레드 단계)**

```bash
git add lib/game/__tests__/assets.test.ts
git commit -m "test: 자산가치 계산의 티어당-1대 가정 버그를 드러내는 실패 테스트 추가"
```

---

### Task 5: `ownedAssetOf` 헬퍼로 버그 수정

**Files:**
- Modify: `lib/game/assets.ts`

- [ ] **Step 1: `ownedAssetOf` 헬퍼 추가 + `ownedTier`/`assetValue`/`canBuyAsset` 교체**

`lib/game/assets.ts`에서 아래 블록을 찾는다:

```ts
/** 카테고리별 보유 최고 티어(없으면 0) */
export function ownedTier(assets: AssetKey[], category: AssetCategory): number {
  return ASSETS.filter((a) => a.category === category && assets.includes(a.key)).reduce(
    (m, a) => Math.max(m, a.tier),
    0,
  );
}

/** 순자산에 더할 자산 가치 = 카테고리별 최고 티어 가격의 합(하위 티어는 매각됨) */
export function assetValue(assets: AssetKey[]): number {
  const cats: AssetCategory[] = ["car"];
  return cats.reduce((sum, cat) => {
    const tier = ownedTier(assets, cat);
    const def = ASSETS.find((a) => a.category === cat && a.tier === tier);
    return sum + (def?.price ?? 0);
  }, 0);
}
```

다음으로 교체한다:

```ts
/** 카테고리별 보유 중인 자산 중 최고 티어 항목(실제 소유 키 기준 — 같은 티어에 여러 차종이 있어도 정확) */
function ownedAssetOf(assets: AssetKey[], category: AssetCategory): AssetDef | undefined {
  return ASSETS.filter((a) => a.category === category && assets.includes(a.key)).reduce<
    AssetDef | undefined
  >((best, a) => (!best || a.tier > best.tier ? a : best), undefined);
}

/** 카테고리별 보유 최고 티어(없으면 0) */
export function ownedTier(assets: AssetKey[], category: AssetCategory): number {
  return ownedAssetOf(assets, category)?.tier ?? 0;
}

/** 순자산에 더할 자산 가치 = 카테고리별 실제 소유한 최고 티어 차종의 가격 합(하위 티어는 매각됨) */
export function assetValue(assets: AssetKey[]): number {
  const cats: AssetCategory[] = ["car"];
  return cats.reduce((sum, cat) => sum + (ownedAssetOf(assets, cat)?.price ?? 0), 0);
}
```

- [ ] **Step 2: `canBuyAsset` 교체**

같은 파일에서 아래 블록을 찾는다:

```ts
  const current = ownedTier(assets, def.category);
  if (def.tier <= current) return { ok: false, cost: 0, reason: "이미 보유(또는 상위 보유) 중이에요." };
  const currentDef = ASSETS.find((a) => a.category === def.category && a.tier === current);
  const cost = def.price - (currentDef?.price ?? 0);
```

다음으로 교체한다:

```ts
  const currentDef = ownedAssetOf(assets, def.category);
  const current = currentDef?.tier ?? 0;
  if (def.tier <= current) return { ok: false, cost: 0, reason: "이미 보유(또는 상위 보유) 중이에요." };
  const cost = def.price - (currentDef?.price ?? 0);
```

- [ ] **Step 3: 테스트 실행 — 통과 확인**

Run: `npm test -- assets.test`
Expected: PASS (전체 4개 테스트 통과)

- [ ] **Step 4: 전체 테스트 스위트 실행 — 회귀 없는지 확인**

Run: `npm test`
Expected: PASS (모든 테스트 통과, `shopGacha`/`assets` 포함)

- [ ] **Step 5: Commit**

```bash
git add lib/game/assets.ts
git commit -m "fix: 자산가치 계산이 실제 소유 차종 기준으로 정확히 동작하도록 수정"
```

---

### Task 6: `AssetPanel.tsx` — 소유 판정을 티어 기준에서 키 기준으로 수정

**Files:**
- Modify: `components/room/AssetPanel.tsx`

- [ ] **Step 1: 소유/매각 판정 로직 교체**

`components/room/AssetPanel.tsx`에서 아래 블록을 찾는다:

```tsx
              {tiers.map((a) => {
                const owned = a.tier <= current;
                const isCurrent = a.tier === current;
                return (
                  <li
                    key={a.key}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl px-3 py-2",
                      isCurrent ? "bg-grape/15" : owned ? "bg-black/[0.02]" : "bg-black/[0.03]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{a.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-pixel text-[11px] font-bold text-ink/80">
                          {a.label}
                        </div>
                        <div className="truncate text-[11px] text-ink/50">{a.desc}</div>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="pill shrink-0 bg-grape/40 text-ink">보유 중</span>
                    ) : owned ? (
                      <span className="pill shrink-0 bg-black/10 text-ink/40">매각함</span>
                    ) : (
                      <span className="pill shrink-0 bg-black/10 text-ink/45">
                        미보유 · 정가 {formatMoney(a.price)}
                      </span>
                    )}
                  </li>
                );
              })}
```

다음으로 교체한다(실제 소유 키 기준으로 "보유 중"/"매각함"/"미보유(지나간 티어)"/"미보유(정가)" 4가지 상태를 구분):

```tsx
              {tiers.map((a) => {
                const isOwned = character.assets.includes(a.key);
                const isCurrent = isOwned && a.tier === current;
                const wasSold = isOwned && a.tier < current;
                const passedTierUnowned = !isOwned && a.tier <= current;
                return (
                  <li
                    key={a.key}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl px-3 py-2",
                      isCurrent ? "bg-grape/15" : isOwned || passedTierUnowned ? "bg-black/[0.02]" : "bg-black/[0.03]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{a.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-pixel text-[11px] font-bold text-ink/80">
                          {a.label}
                        </div>
                        <div className="truncate text-[11px] text-ink/50">{a.desc}</div>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="pill shrink-0 bg-grape/40 text-ink">보유 중</span>
                    ) : wasSold ? (
                      <span className="pill shrink-0 bg-black/10 text-ink/40">매각함</span>
                    ) : passedTierUnowned ? (
                      <span className="pill shrink-0 bg-black/10 text-ink/40">미보유</span>
                    ) : (
                      <span className="pill shrink-0 bg-black/10 text-ink/45">
                        미보유 · 정가 {formatMoney(a.price)}
                      </span>
                    )}
                  </li>
                );
              })}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add components/room/AssetPanel.tsx
git commit -m "fix: 자동차 패널 소유 판정을 티어 기준에서 실제 소유 키 기준으로 수정"
```

---

### Task 7: 개발 서버로 수동 확인

**Files:** (없음 — 수동 QA)

- [ ] **Step 1: 개발 서버 실행**

Run: `npm run dev`

- [ ] **Step 2: 브라우저에서 확인**

`/dashboard` → 상점 탭 → 자동차 패널에서:
1. 저축을 충분히 올린 캐릭터로 자동차 뽑기를 여러 번 실행해, 티어1 세 차종(경차/박스카 왜건/미니 쿠페) 중 하나가 무작위로 나오는지 확인
2. 티어1 차량을 얻은 뒤 다시 뽑으면 티어2 세 차종 중 하나가 나오는지 확인(같은 티어 반복 없음)
3. "보유 중" 라벨이 실제로 뽑은 차종에만 붙는지, 같은 티어의 다른 차종엔 "매각함"이 아니라 "미보유"로 뜨는지 확인
4. 상단 자산 표시(`자산 {금액}`)가 실제 보유 차종의 정가와 일치하는지 확인

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
