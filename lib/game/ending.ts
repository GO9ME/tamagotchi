import type { Character, ReviewGrade } from "@/types/character";
import { clamp } from "./clamp";
import { GRADE_ORDER } from "./jobs";

const ci = (s: number) => Math.min(Math.max(s, 0), 100);

const GRADE_PTS: Record<ReviewGrade, number> = { S: 100, A: 80, B: 60, C: 40, D: 20 };

function avgReviewScore(c: Character): number {
  const rs = (c.reviews ?? []).filter((r) => r.kind === "normal");
  if (rs.length === 0) return 50;
  return rs.reduce((a, r) => a + (GRADE_PTS[r.grade] ?? 50), 0) / rs.length;
}

/** 인생 종합 점수 (PRD 17.2) */
export function computeLifeScore(c: Character): number {
  const levelScore = ci(c.level * 4); // 레벨 25 ≈ 100
  const educationScore = ci(c.stats.academic);
  const careerScore = c.job
    ? (GRADE_ORDER.indexOf(c.job.grade) / (GRADE_ORDER.length - 1)) * 100
    : 0;
  const salaryScore = c.job ? ci((c.job.salaryManwon / 20000) * 100) : 0; // 2억=100
  const healthScore = c.status.health;
  const selfDevScore = ci(c.stats.careerPotential);
  const consistencyScore = avgReviewScore(c);
  const raw =
    levelScore * 0.15 +
    educationScore * 0.15 +
    careerScore * 0.25 +
    salaryScore * 0.15 +
    healthScore * 0.1 +
    selfDevScore * 0.1 +
    consistencyScore * 0.1;
  return clamp(Math.round(raw), 0, 100);
}

export interface LifeEnding {
  score: number;
  title: string;
  subtitle: string;
}

export function lifeEnding(c: Character): LifeEnding {
  const score = computeLifeScore(c);
  const grade = c.job?.grade;
  let title: string;
  let subtitle: string;
  if (grade === "ceo") {
    title = "정상에 오른 대표";
    subtitle = "맨손에서 한 시대를 풍미한 경영자.";
  } else if (!c.job) {
    title = "자유로운 영혼";
    subtitle = "취업 없이 마이웨이로 살아온 인생.";
  } else if (score >= 85) {
    title = "인생 만렙";
    subtitle = "흠잡을 데 없는 화려한 커리어.";
  } else if (score >= 70) {
    title = "성공한 직장인";
    subtitle = "꾸준함으로 일군 안정된 삶.";
  } else if (score >= 55) {
    title = "단단한 한 사람";
    subtitle = "평범하지만 단단하게 살아냈다.";
  } else if (score >= 40) {
    title = "월급루팡 마스터";
    subtitle = "적당히, 그러나 무사히 정년까지.";
  } else {
    title = "파란만장한 인생";
    subtitle = "굴곡은 많았지만 끝까지 버텨냈다.";
  }
  return { score, title, subtitle };
}
