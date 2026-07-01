import type { LifeStage } from "@/types/character";
import { GAME_YEAR_MS, LIFE_STAGES, MAX_AGE, STAGE_INDEX, StageInfo } from "./constants";

/** bornAt 기준으로 현재 게임 나이(정수) 계산 */
export function ageFromBornAt(bornAt: number, now: number): number {
  return Math.max(0, Math.floor((now - bornAt) / GAME_YEAR_MS));
}

/**
 * 다음 나이(년)까지 남은 실시간(ms). 시간이 실제로 흐르고 있음을 눈으로
 * 확인할 수 있도록 하는 실시간 카운트다운용. 자연사 한계(MAX_AGE) 도달 시
 * 더 이상 의미가 없으므로 null.
 */
export function msUntilNextAge(
  bornAt: number,
  ageYears: number,
  now: number,
): number | null {
  if (ageYears >= MAX_AGE) return null;
  const elapsed = Math.max(0, now - bornAt);
  const rem = elapsed % GAME_YEAR_MS;
  return GAME_YEAR_MS - rem;
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

/**
 * 취업 게이트: 나이로 단계를 산정하되, 직장인(employee) 이상 단계는
 * 실제 취업(job 보유) 했을 때만 진입. 미취업이면 jobseeker 로 캡.
 */
export function cappedStageForAge(age: number, hasJob: boolean): LifeStage {
  const natural = stageForAge(age);
  if (!hasJob && STAGE_INDEX[natural] >= STAGE_INDEX["employee"]) {
    return "jobseeker";
  }
  return natural;
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
