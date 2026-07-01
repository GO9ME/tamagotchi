import type { Character, UniversityTierKey } from "@/types/character";
import { round2 } from "./clamp";
import { BACHELOR_AGE } from "./degree";

export interface UniversityTier {
  label: string;
  desc: string;
  tuitionPerYear: number; // 연 등록금(만원)
  academicBar: number; // 입학 커트라인(학업 스탯)
  hiringBonus: number; // 취업 합격률 보너스(%p) — 학위 보너스에 추가로 얹힘
  salaryMult: number; // 초봉 배율 추가 보정(학위 배율과 곱)
}

/** 학부 4개 티어 — 등록금·학업 커트라인·취업 유불리가 서로 다름(국립대가 저렴하면서도 우수) */
export const UNIVERSITY_TIERS: Record<UniversityTierKey, UniversityTier> = {
  elite: {
    label: "명문 사립대",
    desc: "학업 최상위권 필요 · 등록금이 가장 비싸요",
    tuitionPerYear: 900,
    academicBar: 70,
    hiringBonus: 8,
    salaryMult: 1.1,
  },
  national: {
    label: "거점 국립대",
    desc: "학업 우수 필요 · 등록금은 저렴한 가성비 최고",
    tuitionPerYear: 450,
    academicBar: 60,
    hiringBonus: 6,
    salaryMult: 1.05,
  },
  mid: {
    label: "수도권 중위권 사립대",
    desc: "무난한 선택",
    tuitionPerYear: 700,
    academicBar: 30,
    hiringBonus: 0,
    salaryMult: 1.0,
  },
  local: {
    label: "지방 사립대",
    desc: "학업 부담은 적지만 취업엔 다소 불리해요",
    tuitionPerYear: 550,
    academicBar: 0,
    hiringBonus: -4,
    salaryMult: 0.93,
  },
};

export const UNIVERSITY_ORDER: UniversityTierKey[] = [
  "elite",
  "national",
  "mid",
  "local",
];

/** 학자금대출 재학 중 연 이자율 */
export const LOAN_INTEREST_RATE = 0.03;
/** 취업 후 대출 잔액이 있으면 매년 연봉의 이 비율만큼 자동 상환 */
export const LOAN_REPAY_RATE = 0.08;

/** 대학 선택 가능 여부 — 대학생 단계 + 아직 미선택 + 학사 취득 전 */
export function canChooseUniversity(c: Character): boolean {
  return c.lifeStage === "university" && !c.university && c.degree === "highschool";
}

export function universityHiringMod(c: Character): number {
  return c.university ? UNIVERSITY_TIERS[c.university.tier].hiringBonus : 0;
}

export function universitySalaryMult(c: Character): number {
  return c.university ? UNIVERSITY_TIERS[c.university.tier].salaryMult : 1;
}

/**
 * 한 해치 대학 등록금/학자금대출 처리.
 * - 재학 중(대학생 단계, 학사 취득 전)이면 등록금 청구: 저축에서 낼 수 있는 만큼 내고
 *   모자란 만큼 학자금대출로 전환(대출 잔액에 이자 포함해 누적).
 * - 취업 후엔 대출 잔액이 있으면 매년 연봉의 일부로 자동 상환.
 * savingsDelta = 이 처리로 실제 저축에 가감된 총량(리뷰 기록·토스트 표시용).
 */
export function processUniversityYear(
  c: Character,
  age: number,
): { character: Character; savingsDelta: number } {
  let ch = c;
  let delta = 0;

  // 등록금 청구(재학 중, 학사 취득 전)
  if (ch.university && age < BACHELOR_AGE && ch.degree === "highschool") {
    const tuition = UNIVERSITY_TIERS[ch.university.tier].tuitionPerYear;
    const payFromCash = Math.min(Math.max(0, ch.savings), tuition);
    const shortfall = tuition - payFromCash;
    let loanBalance = ch.university.loanBalance + shortfall;
    if (loanBalance > 0) loanBalance = round2(loanBalance * (1 + LOAN_INTEREST_RATE));
    delta -= payFromCash;
    ch = {
      ...ch,
      savings: ch.savings - payFromCash,
      university: { ...ch.university, loanBalance },
    };
  }

  // 취업 후 자동 상환
  if (ch.job && ch.university && ch.university.loanBalance > 0) {
    const repay = Math.min(
      ch.university.loanBalance,
      Math.round(ch.job.salaryManwon * LOAN_REPAY_RATE),
    );
    if (repay > 0) {
      delta -= repay;
      ch = {
        ...ch,
        savings: ch.savings - repay,
        university: { ...ch.university, loanBalance: ch.university.loanBalance - repay },
      };
    }
  }

  return { character: ch, savingsDelta: delta };
}
