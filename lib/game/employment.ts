import type { Character, CompanyTypeKey } from "@/types/character";
import { clamp } from "./clamp";
import { COMPANY_TYPES } from "./jobs";

// 0~100 정규화 (누적 스탯이 100 넘으면 만점 고착 방지 — exam.ts ci 패턴)
const ci = (s: number) => Math.min(Math.max(s, 0), 100);

/**
 * 취업 준비도 점수 (PRD 10.3).
 * educationScore = academic 재사용. portfolio/interview/certificate 는 취업 준비 스탯.
 */
export function employmentScore(c: Character): number {
  const education = ci(c.stats.academic);
  const portfolio = ci(c.stats.portfolioScore);
  const interview = ci(c.stats.interviewScore);
  const certificate = ci(c.stats.certificateScore);
  const communication = ci(c.stats.communication);
  const confidence = c.status.confidence; // 이미 0~100
  const health = c.status.health; // 이미 0~100
  const raw =
    education * 0.25 +
    portfolio * 0.2 +
    interview * 0.2 +
    certificate * 0.1 +
    communication * 0.1 +
    confidence * 0.1 +
    health * 0.05;
  return clamp(Math.round(raw), 0, 100);
}

/** 회사 유형 난이도 보정 후 합격 확률(%) */
export function employmentChance(c: Character, company: CompanyTypeKey): number {
  return clamp(
    Math.round(employmentScore(c) + COMPANY_TYPES[company].chanceMod),
    5,
    95,
  );
}

/** rand(0~1) 주입 — 결정성/테스트. Math.random 은 store 에서만 */
export function rollHire(
  chance: number,
  rand: number,
): { hired: boolean; roll: number } {
  const roll = Math.round(rand * 100);
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
    { label: "소통", value: ci(c.stats.communication) },
    { label: "자신감", value: c.status.confidence },
    { label: "건강", value: c.status.health },
  ];
}
