import type { ActionEffect } from "@/types/action";
import type { Character, LifeStage } from "@/types/character";
import { clamp } from "./clamp";

/**
 * 시험 점수 (PRD 9.3).
 * examScore = intelligence*0.35 + discipline*0.25 + focus*0.20 + memory*0.10 + randomBonus*0.10
 * 누적 스탯은 min(stat,100) 으로 정규화(후반 만점 고착 방지). focus 는 0~100 status.
 * rand 는 0~1 난수를 주입(결정성/테스트 용이).
 */
export function computeExamScore(c: Character, rand: number): number {
  const ci = (s: number) => Math.min(s, 100);
  const raw =
    ci(c.stats.intelligence) * 0.35 +
    ci(c.stats.discipline) * 0.25 +
    c.status.focus * 0.2 +
    ci(c.stats.memory) * 0.1 +
    rand * 100 * 0.1;
  return clamp(Math.round(raw), 0, 100);
}

export type ExamTier = "우수" | "양호" | "보통" | "미흡";

export function examTier(score: number): ExamTier {
  return score >= 80 ? "우수" : score >= 60 ? "양호" : score >= 40 ? "보통" : "미흡";
}

/** 시험 결과 효과 (연간 리뷰 보상과 합성) */
export function examEffect(tier: ExamTier, stage: LifeStage): ActionEffect {
  let e: ActionEffect;
  if (tier === "우수") {
    e = {
      stats: { academic: 4, careerPotential: 3, employability: 2 },
      status: { confidence: 4 },
    };
  } else if (tier === "양호") {
    e = { stats: { academic: 2, careerPotential: 1 }, status: { confidence: 2 } };
  } else if (tier === "보통") {
    e = { stats: { academic: 1 } };
  } else {
    e = { stats: { careerPotential: -1 }, status: { confidence: -2 } };
  }
  // 취준생 단계 시험은 취업 준비도(employability) 가중
  if (stage === "jobseeker") {
    e.stats = { ...e.stats, employability: (e.stats?.employability ?? 0) + 2 };
  }
  return e;
}
