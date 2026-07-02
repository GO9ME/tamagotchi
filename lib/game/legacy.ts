// ---------------------------------------------------------------------------
// legacy.ts
// 2세대 플레이 — 엔딩(사망) 후 자녀에게 이어가기.
// 부모 저축의 일부를 유산으로, 핵심 스탯 일부를 재능(시작 보너스)으로 물려준다.
// ---------------------------------------------------------------------------

import type { Character, CharacterStats } from "@/types/character";

/** 유산 상속률 — 부모 최종 저축의 20% (빚은 물려주지 않음) */
export const INHERITANCE_RATE = 0.2;

export function inheritanceAmount(c: Character): number {
  return Math.max(0, Math.round(c.savings * INHERITANCE_RATE));
}

/** "철수" → "철수 2세", "철수 2세" → "철수 3세" */
export function nextGenName(c: Character): string {
  const base = c.name.replace(/\s?\d+세$/, "").trim();
  const gen = (c.generation ?? 1) + 1;
  return `${base} ${gen}세`;
}

/** 부모 스탯의 5%(최대 +5)를 자녀 시작 스탯에 재능으로 반영 */
export function inheritedStatBonus(stats: CharacterStats): Partial<CharacterStats> {
  const keys: (keyof CharacterStats)[] = [
    "intelligence",
    "discipline",
    "creativity",
    "memory",
    "communication",
    "fitness",
  ];
  const out: Partial<CharacterStats> = {};
  for (const k of keys) {
    out[k] = 5 + Math.min(5, Math.round(stats[k] * 0.05));
  }
  return out;
}

/** 2세대 시작 가능 여부 — 사망 엔딩 + 자녀 존재 */
export function canStartSecondGen(c: Character): boolean {
  return c.deathAge != null && (c.childrenBornAges?.length ?? 0) > 0;
}
