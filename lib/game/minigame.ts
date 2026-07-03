// ---------------------------------------------------------------------------
// minigame.ts
// 슬롯머신·행운 뽑기 — 쿨타임 없이 체력을 소모해 즉시 실행하는 운빨 콘텐츠.
// 행운 스탯이 당첨 확률을 올리고, 플레이할 때마다 행운이 조금씩 쌓인다.
// rand 는 0~1 주입(결정성 — 테스트 가능).
// ---------------------------------------------------------------------------

import type { ActionEffect } from "@/types/action";
import type { Character } from "@/types/character";
import { clamp } from "./clamp";
import type { OutcomeTier } from "./outcome";
import { ALLOCATABLE_STATS } from "./statPoints";

/** 1회 플레이 체력 소모 — 쿨타임 대신 체력이 게이트 */
export const MINIGAME_ENERGY_COST = 12;
/** 플레이할 때마다(꽝 포함) 쌓이는 행운 */
export const LUCK_PER_PLAY = 0.2;
/** 행운 성장 상한 — 소비처(당첨 확률·대성공 보너스)가 포화되는 지점 */
export const LUCK_CAP = 55;
/** 미니게임 해금 나이 — 여가와 같은 결(도박 콘텐츠는 미취학 아동 제외) */
export const MINIGAME_MIN_AGE = 6;

export type MinigameKind =
  | "slots"
  | "gacha"
  | "roulette"
  | "fishing"
  | "darts"
  | "rps"
  | "timing";

export type RpsChoice = "rock" | "paper" | "scissors";

export interface MinigameResult {
  effect: ActionEffect; // 체력 소모 + 보상 (message 포함)
  savingsDelta: number; // 당첨금(만원)
  statPointsDelta: number; // 희귀 캡슐: 스탯 포인트
  fx: { tier: OutcomeTier; label: string } | null; // OutcomeBurst 연출
}

export function canPlayMinigame(c: Character): { ok: boolean; reason?: string } {
  if (c.ageYears < MINIGAME_MIN_AGE) {
    return { ok: false, reason: `${MINIGAME_MIN_AGE}살부터 할 수 있어요.` };
  }
  if (c.status.energy < MINIGAME_ENERGY_COST) {
    return { ok: false, reason: `체력이 부족해요. (체력 ${MINIGAME_ENERGY_COST} 필요)` };
  }
  return { ok: true };
}

/** 행운 스탯 → 당첨 확률 보너스(%p). 초기값 5 기준 0, 최대 +15%p */
export function luckBonus(c: Character): number {
  return clamp((c.stats.luck - 5) * 0.3, 0, 15);
}

const baseStatus = { energy: -MINIGAME_ENERGY_COST };
/** 행운은 상한까지만 쌓인다 — 상한 이후엔 소비처가 없어 표시만 커지는 걸 방지 */
const gainStats = (c: Character) => ({
  luck: c.stats.luck < LUCK_CAP ? LUCK_PER_PLAY : 0,
});

// ponytail: 슬롯 기대값은 판당 +4만원 안팎으로 살짝 플러스 — 체력 경제(낮잠/수면 쿨타임)가
// 플레이 횟수를 묶어 연봉 대비 무시할 수준. 화폐 인플레가 보이면 당첨금부터 줄일 것.
/** 슬롯머신 — 잭팟/대박/소소한 당첨/꽝. 당첨금은 저축으로. */
export function playSlots(c: Character, rand: number): MinigameResult {
  const b = luckBonus(c);
  const r = rand * 100;
  const jackpotP = 1.5 + b * 0.2;
  const bigP = jackpotP + 8 + b * 0.5;
  const smallP = bigP + 25 + b;

  if (r < jackpotP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 15, confidence: 8 },
        stats: gainStats(c),
        exp: 20,
        message: "🎰 7️⃣7️⃣7️⃣ 잭팟! 당첨금 +100만원!",
      },
      savingsDelta: 100,
      statPointsDelta: 0,
      fx: { tier: "jackpot", label: "🎰 잭팟!" },
    };
  }
  if (r < bigP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 10, confidence: 4 },
        stats: gainStats(c),
        exp: 10,
        message: "🎰 🍒🍒🍒 대박! 당첨금 +20만원!",
      },
      savingsDelta: 20,
      statPointsDelta: 0,
      fx: { tier: "great", label: "🎰 대박!" },
    };
  }
  if (r < smallP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 4 },
        stats: gainStats(c),
        exp: 5,
        message: "🎰 🍒🍒⬜ 소소한 당첨! +5만원",
      },
      savingsDelta: 5,
      statPointsDelta: 0,
      fx: null,
    };
  }
  return {
    effect: {
      status: { ...baseStatus, mood: -2, stress: 3 },
      stats: gainStats(c),
      exp: 2,
      message: "🎰 꽝… 대신 행운이 조금 쌓였어요.",
    },
    savingsDelta: 0,
    statPointsDelta: 0,
    fx: null,
  };
}

/** 행운 뽑기 — 희귀(스탯 포인트)/보통(랜덤 스탯 +1)/일반(컨디션 캡슐) */
export function playGacha(c: Character, rand: number, rand2: number): MinigameResult {
  const b = luckBonus(c);
  const r = rand * 100;
  const rareP = 4 + b * 0.4;
  const uncommonP = rareP + 18 + b * 0.6;

  if (r < rareP) {
    return {
      effect: {
        status: { ...baseStatus, mood: 12, confidence: 6 },
        stats: gainStats(c),
        exp: 15,
        message: "🎁 ✨ 희귀 캡슐! 스탯 포인트 +1",
      },
      savingsDelta: 0,
      statPointsDelta: 1,
      fx: { tier: "great", label: "✨ 희귀 캡슐!" },
    };
  }
  if (r < uncommonP) {
    const pick =
      ALLOCATABLE_STATS[
        Math.min(ALLOCATABLE_STATS.length - 1, Math.floor(rand2 * ALLOCATABLE_STATS.length))
      ];
    return {
      effect: {
        status: { ...baseStatus, mood: 6 },
        stats: { ...gainStats(c), [pick.key]: 1 },
        exp: 10,
        message: `🎁 ${pick.label} 캡슐! ${pick.label}이(가) 자랐어요.`,
      },
      savingsDelta: 0,
      statPointsDelta: 0,
      fx: null,
    };
  }
  // 일반 캡슐 — 소소한 컨디션 보상 중 하나
  const commons: { status: Partial<Character["status"]>; message: string }[] = [
    { status: { mood: 8 }, message: "🎁 기분 좋아지는 캡슐이 나왔어요!" },
    { status: { confidence: 5 }, message: "🎁 자신감 캡슐! 어깨가 으쓱해져요." },
    { status: { focus: 6 }, message: "🎁 집중력 캡슐! 머리가 맑아져요." },
  ];
  const pick = commons[Math.min(commons.length - 1, Math.floor(rand2 * commons.length))];
  return {
    effect: {
      status: { ...baseStatus, ...pick.status },
      stats: gainStats(c),
      exp: 5,
      message: pick.message,
    },
    savingsDelta: 0,
    statPointsDelta: 0,
    fx: null,
  };
}
