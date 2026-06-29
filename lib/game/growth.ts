import type { LifeStage } from "@/types/character";
import { GAME_YEAR_MS, LIFE_STAGES, StageInfo } from "./constants";

/** bornAt 기준으로 현재 게임 나이(정수) 계산 */
export function ageFromBornAt(bornAt: number, now: number): number {
  return Math.max(0, Math.floor((now - bornAt) / GAME_YEAR_MS));
}

/** 나이로부터 성장 단계 정보 반환 */
export function stageInfoForAge(age: number): StageInfo {
  let current = LIFE_STAGES[0];
  for (const s of LIFE_STAGES) {
    if (age >= s.minAge) current = s;
  }
  return current;
}

export function stageForAge(age: number): LifeStage {
  return stageInfoForAge(age).stage;
}

export function stageLabel(stage: LifeStage): string {
  return LIFE_STAGES.find((s) => s.stage === stage)?.label ?? stage;
}

export function stageEmoji(stage: LifeStage): string {
  return LIFE_STAGES.find((s) => s.stage === stage)?.emoji ?? "🐣";
}

/** 다음 성장 단계까지 남은 게임 나이 (없으면 null) */
export function nextStageInfo(age: number): { label: string; inYears: number } | null {
  for (const s of LIFE_STAGES) {
    if (s.minAge > age) {
      return { label: s.label, inYears: s.minAge - age };
    }
  }
  return null;
}
