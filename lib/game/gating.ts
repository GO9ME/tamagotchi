import type { LifeStage } from "@/types/character";
import { LIFE_STAGES, STAGE_INDEX } from "./constants";
import { ACTION_MAP } from "./actions";

export function stageIndex(stage: LifeStage): number {
  return STAGE_INDEX[stage] ?? 0;
}

/** minStage(없으면 항상 가능) 기준으로 현재 단계가 해금됐는지 */
export function isStageUnlocked(
  minStage: LifeStage | undefined,
  current: LifeStage,
): boolean {
  if (!minStage) return true;
  return stageIndex(current) >= stageIndex(minStage);
}

/** 액션 키 + 현재 단계로 해금 여부 */
export function isActionUnlocked(actionKey: string, stage: LifeStage): boolean {
  return isStageUnlocked(ACTION_MAP[actionKey]?.minStage, stage);
}

function stageLabelByStage(stage: LifeStage): string {
  return LIFE_STAGES.find((s) => s.stage === stage)?.label ?? stage;
}

/** 잠긴 액션에 표시할 "○○단계부터" 라벨 */
export function unlockStageLabel(actionKey: string): string {
  const min = ACTION_MAP[actionKey]?.minStage;
  if (!min) return "";
  return `${stageLabelByStage(min)}부터`;
}

/** 단계별 공부 콘텐츠 라벨 (로직에는 영향 없음, 표시만) */
export function studyContentForStage(stage: LifeStage): string {
  switch (stage) {
    case "elementary":
      return "숙제 · 독서 · 기초수학";
    case "middle":
      return "시험공부 · 수행평가 · 동아리";
    case "high":
      return "내신 · 수능 · 진로";
    case "university":
      return "전공 · 과제 · 자격증";
    case "jobseeker":
      return "이력서 · 포폴 · 면접 준비";
    case "employee":
    case "senior":
    case "retirement":
      return "직무역량 · 자기계발";
    default:
      return "기초 학습";
  }
}
