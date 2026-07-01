import type { Character, CharacterStats } from "@/types/character";
import { round2 } from "./clamp";

/** 레벨업 시 지급되는 스탯 포인트(메이플스토리 스타일 자유 배분) */
export const STAT_POINTS_PER_LEVEL = 5;

/** 포인트로 자유 배분 가능한 핵심 스탯 5종 (직군 공통 코어 스탯 중심) */
export interface AllocatableStat {
  key: keyof CharacterStats;
  label: string;
}

export const ALLOCATABLE_STATS: AllocatableStat[] = [
  { key: "intelligence", label: "지능" },
  { key: "discipline", label: "성실성" },
  { key: "creativity", label: "창의력" },
  { key: "memory", label: "기억력" },
  { key: "communication", label: "소통" },
];

const ALLOCATABLE_KEYS = new Set(ALLOCATABLE_STATS.map((s) => s.key));

export function isAllocatableStat(key: string): key is keyof CharacterStats {
  return ALLOCATABLE_KEYS.has(key as keyof CharacterStats);
}

/** 포인트 1개 = 스탯 +1 배분 */
export function allocateStatPoint(
  c: Character,
  statKey: keyof CharacterStats,
): Character {
  if (c.statPoints <= 0 || !isAllocatableStat(statKey)) return c;
  return {
    ...c,
    statPoints: c.statPoints - 1,
    stats: { ...c.stats, [statKey]: round2(c.stats[statKey] + 1) },
  };
}
