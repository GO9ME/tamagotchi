import type {
  Character,
  CompanyTypeKey,
  JobFamilyKey,
} from "@/types/character";
import { clamp } from "./clamp";
import { COMPANY_TYPES, JOB_FAMILIES } from "./jobs";

// 0~100 정규화 (누적 스탯이 100 넘으면 만점 고착 방지 — exam.ts ci 패턴)
const ci = (s: number) => Math.min(Math.max(s, 0), 100);

/**
 * 취업 준비도 점수 (PRD 10.3 + employability).
 * educationScore = academic 재사용. portfolio/interview/certificate 는 취업 준비 스탯.
 * 가중치 합 = 1.0.
 */
export function employmentScore(c: Character): number {
  const education = ci(c.stats.academic);
  const portfolio = ci(c.stats.portfolioScore);
  const interview = ci(c.stats.interviewScore);
  const certificate = ci(c.stats.certificateScore);
  const employability = ci(c.stats.employability);
  const communication = ci(c.stats.communication);
  const confidence = c.status.confidence; // 이미 0~100
  const health = c.status.health; // 이미 0~100
  const raw =
    education * 0.22 +
    portfolio * 0.18 +
    interview * 0.18 +
    certificate * 0.1 +
    employability * 0.1 +
    communication * 0.08 +
    confidence * 0.09 +
    health * 0.05;
  return clamp(Math.round(raw), 0, 100);
}

/** 선택한 직업군의 핵심 스탯 적합도 보너스 (-5 ~ +5) */
export function familyFitBonus(c: Character, family: JobFamilyKey | null): number {
  if (!family) return 0;
  const cs = JOB_FAMILIES[family].coreStats;
  if (cs.length === 0) return 0;
  const avg =
    cs.reduce((a, k) => a + ci(c.stats[k]), 0) / cs.length;
  return Math.round((avg - 50) * 0.1);
}

/** 직업군 적합도까지 반영한 종합 준비도 (0~100) */
export function employmentReadiness(
  c: Character,
  family: JobFamilyKey | null,
): number {
  return clamp(employmentScore(c) + familyFitBonus(c, family), 0, 100);
}

/** 회사 유형 난이도 + 직업군 적합도 보정 후 합격 확률(%) */
export function employmentChance(
  c: Character,
  family: JobFamilyKey | null,
  company: CompanyTypeKey,
): number {
  return clamp(
    employmentReadiness(c, family) + COMPANY_TYPES[company].chanceMod,
    5,
    95,
  );
}

/** rand(0~1) 주입 — 결정성/테스트. Math.random 은 store 에서만. floor 로 균등 분포. */
export function rollHire(
  chance: number,
  rand: number,
): { hired: boolean; roll: number } {
  const roll = Math.floor(rand * 100); // 0~99 균등
  return { hired: roll < chance, roll };
}

/** 취업 준비도 항목 (UI 표시용) */
export function employmentBreakdown(
  c: Character,
): { label: string; value: number }[] {
  return [
    { label: "학업", value: ci(c.stats.academic) },
    { label: "포트폴리오", value: ci(c.stats.portfolioScore) },
    { label: "면접", value: ci(c.stats.interviewScore) },
    { label: "자격증", value: ci(c.stats.certificateScore) },
    { label: "취업력", value: ci(c.stats.employability) },
    { label: "소통", value: ci(c.stats.communication) },
    { label: "자신감", value: c.status.confidence },
    { label: "건강", value: c.status.health },
  ];
}
