import type { StatsDelta } from "@/types/action";
import type { Character } from "@/types/character";
import { clamp, round2 } from "./clamp";

// 활동 결과 등급: 능력치 상승폭에 배수를 준다 (컨디션 연동).
export type OutcomeTier = "jackpot" | "great" | "good" | "poor";

export interface ActionOutcome {
  tier: OutcomeTier;
  mult: number;
  label: string;
}

/** 대성공 확률(%) — 집중력/기분이 높을수록 ↑, 행운 스탯 보너스(최대 +8) */
export function greatChance(c: Character): number {
  let p = 12;
  if (c.status.focus > 70) p += 8;
  if (c.status.mood > 70) p += 5;
  p += clamp(((c.stats.luck ?? 5) - 5) * 0.2, 0, 8);
  return clamp(p, 0, 35);
}

/** 부진 확률(%) — 배고픔/체력이 낮을수록 ↑ */
export function poorChance(c: Character): number {
  let p = 18;
  if (c.status.hunger < 30) p += 15;
  if (c.status.energy < 30) p += 10;
  return clamp(p, 0, 45);
}

const MULT: Record<OutcomeTier, number> = { jackpot: 2.5, great: 1.8, good: 1, poor: 0.5 };
// 공부처럼 이미 다중 배수가 걸린 액션은 완만하게
const MULT_MILD: Record<OutcomeTier, number> = { jackpot: 1.5, great: 1.3, good: 1, poor: 0.7 };
const LABEL: Record<OutcomeTier, string> = {
  jackpot: "잭팟!",
  great: "대성공!",
  good: "성공",
  poor: "아쉬워요",
};

/** rand 0~1 주입(결정성). mild = 공부 등 완만 배수. */
export function rollOutcome(c: Character, rand: number, mild = false): ActionOutcome {
  const great = greatChance(c);
  const poor = poorChance(c);
  const r = rand * 100;
  const m = mild ? MULT_MILD : MULT;
  let tier: OutcomeTier;
  if (r < great * 0.12) tier = "jackpot"; // 대성공 중 드물게 잭팟
  else if (r < great) tier = "great";
  else if (r >= 100 - poor) tier = "poor";
  else tier = "good";
  return { tier, mult: m[tier], label: LABEL[tier] };
}

/** 능력치 delta 에만 배수 적용 (상태 회복은 그대로) */
export function scaleStatsDelta(
  stats: StatsDelta | undefined,
  mult: number,
): StatsDelta | undefined {
  if (!stats) return stats;
  const src = stats as Record<string, number>;
  const out: Record<string, number> = {};
  for (const k of Object.keys(src)) out[k] = round2(src[k] * mult);
  return out as StatsDelta;
}
