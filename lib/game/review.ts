import type { ActionEffect } from "@/types/action";
import type {
  Character,
  CharacterStatus,
  LifeStage,
  ReviewGrade,
  YearCounters,
  YearlyReview,
} from "@/types/character";
import { clamp, round2 } from "./clamp";
import {
  EDU_STAGES,
  MAX_NEGLECT_YEARS_APPLIED,
  YEARLY_TARGETS,
} from "./constants";
import { applyEffect } from "./engine";
import { isActionUnlocked } from "./gating";
import { stageForAge } from "./growth";
import { computeExamScore, examEffect, examTier } from "./exam";
import { weightVerdict } from "./weight";

const ZERO_COUNTERS: YearCounters = {
  study: 0,
  exercise: 0,
  selfDev: 0,
  meals: 0,
};

function isAdultStage(stage: LifeStage): boolean {
  return stage === "employee" || stage === "senior" || stage === "retirement";
}

// --- 효과 합성 유틸 (키별 합산 / 스케일) ---

function mergeDelta(
  a?: Record<string, number>,
  b?: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const src of [a, b]) {
    if (!src) continue;
    for (const k of Object.keys(src)) {
      out[k] = (out[k] ?? 0) + (src[k] ?? 0);
    }
  }
  return out;
}

export function mergeEffect(a: ActionEffect, b: ActionEffect): ActionEffect {
  return {
    status: mergeDelta(
      a.status as unknown as Record<string, number>,
      b.status as unknown as Record<string, number>,
    ) as unknown as ActionEffect["status"],
    stats: mergeDelta(
      a.stats as unknown as Record<string, number>,
      b.stats as unknown as Record<string, number>,
    ) as unknown as ActionEffect["stats"],
    exp: (a.exp ?? 0) + (b.exp ?? 0),
  };
}

function scaleDelta(
  d: Record<string, number> | undefined,
  k: number,
): Record<string, number> | undefined {
  if (!d) return undefined;
  const out: Record<string, number> = {};
  for (const key of Object.keys(d)) out[key] = round2(d[key] * k);
  return out;
}

export function scaleEffect(e: ActionEffect, k: number): ActionEffect {
  return {
    status: scaleDelta(
      e.status as unknown as Record<string, number>,
      k,
    ) as unknown as ActionEffect["status"],
    stats: scaleDelta(
      e.stats as unknown as Record<string, number>,
      k,
    ) as unknown as ActionEffect["stats"],
    exp: e.exp ? Math.round(e.exp * k) : undefined,
  };
}

// --- 연간 평가 점수 (PRD 5.3) ---

export function scoreYear(
  counters: YearCounters,
  status: CharacterStatus,
  age: number,
  opts?: { neutralStatus?: boolean },
): number {
  const T = YEARLY_TARGETS;
  const cap = (count: number, target: number) =>
    Math.min(count / target, 1) * 100;
  // 다년 점프 시: status 는 전체 오프라인 기간만큼 누적 감쇠돼 직전 "1년" 채점에
  // 부당하므로 status 기반 항목을 중립값으로 대체한다.
  const neutral = opts?.neutralStatus ?? false;
  const health = neutral ? 50 : status.health;
  const sleep = neutral ? 50 : status.sleepQuality;
  const stress = neutral ? 50 : status.stress;
  const weightScore = neutral
    ? 70
    : weightVerdict(status.weight, age) === "healthy"
      ? 100
      : 40;
  const raw =
    cap(counters.study, T.study) * 0.22 +
    cap(counters.selfDev, T.selfDev) * 0.2 +
    cap(counters.exercise, T.exercise) * 0.18 +
    cap(counters.meals, T.meals) * 0.1 +
    health * 0.12 +
    sleep * 0.08 +
    (100 - stress) * 0.05 +
    weightScore * 0.05;
  return clamp(Math.round(raw), 0, 100);
}

export function gradeOf(score: number): ReviewGrade {
  return score >= 85
    ? "S"
    : score >= 70
      ? "A"
      : score >= 55
        ? "B"
        : score >= 40
          ? "C"
          : "D";
}

export function reviewEffect(grade: ReviewGrade): ActionEffect {
  switch (grade) {
    case "S":
      return { stats: { careerPotential: 4 }, status: { confidence: 6 }, exp: 60 };
    case "A":
      return { stats: { careerPotential: 2 }, status: { confidence: 4 }, exp: 40 };
    case "B":
      return { stats: { careerPotential: 1 }, status: { confidence: 1 }, exp: 20 };
    case "C":
      return { status: { mood: -3, stress: 4 } };
    case "D":
      return { status: { confidence: -4, mood: -5, stress: 5, health: -3 } };
  }
}

// --- 자기개발 부족 페널티 (PRD 5.4) ---

export function selfDevPenaltyEffect(
  selfDevCount: number,
  stage: LifeStage,
): ActionEffect {
  // 자기개발이 아직 해금되지 않은 단계(아기~중학생)는 페널티 없음
  if (!isActionUnlocked("selfDev", stage)) return {};
  const adult = isAdultStage(stage);

  if (selfDevCount === 0) {
    const stats: Record<string, number> = { discipline: -3, careerPotential: -5 };
    if (adult) {
      stats.careerPotential -= 3; // 성인 가중 (PRD: 직무 스탯 -3% 환산)
      stats.employability = -3;
    }
    return {
      stats: stats as unknown as ActionEffect["stats"],
      status: { confidence: -2 },
    };
  }
  if (selfDevCount < 3) {
    return { stats: { discipline: -1, careerPotential: -2 } };
  }
  if (selfDevCount >= 10) {
    return { stats: { careerPotential: 3 }, status: { confidence: 2 } };
  }
  return {}; // 3~9 중립
}

// --- 핵심: 밀린 연간 리뷰 처리 (멱등 + 다년 점프 안전) ---

export function runDueReviews(
  c: Character,
  now: number,
): { character: Character; reviews: YearlyReview[] } {
  const age = c.ageYears;
  const last = c.lastReviewedAge;
  if (age <= last) return { character: c, reviews: [] }; // 멱등 no-op

  const reviews: YearlyReview[] = [];
  let ch = c;
  const yearsPassed = age - last;
  const multiYear = yearsPassed >= 2;

  // (A) 막 끝난 직전 1년 — 그 해의 나이/단계 기준으로 채점(점프 후 현재 단계가 아님)
  const reviewAge = last + 1;
  const reviewStage = stageForAge(reviewAge);

  const score = scoreYear(ch.yearCounters, ch.status, reviewAge, {
    neutralStatus: multiYear,
  });
  const grade = gradeOf(score);
  let effect = reviewEffect(grade);
  effect = mergeEffect(
    effect,
    selfDevPenaltyEffect(ch.yearCounters.selfDev, reviewStage),
  );

  let exam: { score: number; tier: string } | undefined;
  if (EDU_STAGES.includes(reviewStage)) {
    const es = computeExamScore(ch, Math.random());
    const tier = examTier(es);
    exam = { score: es, tier };
    effect = mergeEffect(effect, examEffect(tier, reviewStage));
  }
  ch = applyEffect(ch, effect);

  reviews.push({
    id: `${c.id}:${reviewAge}`,
    age: reviewAge,
    stage: reviewStage,
    kind: "normal",
    counters: { ...c.yearCounters },
    score,
    grade,
    exam,
    selfDevPenaltyApplied: true,
    salaryBonusForfeited:
      isAdultStage(reviewStage) && c.yearCounters.selfDev === 0
        ? true
        : undefined,
    createdAt: now,
  });

  // (B) 건너뛴 중간 연도 — 단일 방치 요약 (현재 도달 단계 기준, 상한 적용)
  if (multiYear) {
    const stage = ch.lifeStage;
    const effective = Math.min(yearsPassed - 1, MAX_NEGLECT_YEARS_APPLIED);
    const neglectEffect = scaleEffect(
      selfDevPenaltyEffect(0, stage),
      0.5 * effective,
    );
    ch = applyEffect(ch, neglectEffect);
    reviews.push({
      id: `${c.id}:neglect:${age}`,
      age,
      stage,
      kind: "neglected",
      counters: { ...ZERO_COUNTERS },
      score: 0,
      grade: "D",
      selfDevPenaltyApplied: true,
      neglectedYears: yearsPassed - 1,
      createdAt: now,
    });
  }

  // (C) 리셋 + 기록 누적(영속). id 중복 방지 + 최근 100건 유지.
  const existingIds = new Set((ch.reviews ?? []).map((r) => r.id));
  const fresh = reviews.filter((r) => !existingIds.has(r.id));
  ch = {
    ...ch,
    reviews: [...(ch.reviews ?? []), ...fresh].slice(-100),
    yearCounters: { ...ZERO_COUNTERS },
    lastReviewedAge: age,
  };
  return { character: ch, reviews: fresh };
}
