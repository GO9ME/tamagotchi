import type { Character, Gender } from "@/types/character";

const BIRTH_CM = 50;
const ADULT_AGE = 20;

/**
 * 성인 목표 키(cm)를 성별 기반으로 결정. rand 2개 평균으로 중심화(정규 근사).
 * 남: 평균 ~175 (162~188), 여: 평균 ~162 (150~174).
 */
export function rollHeightPotential(
  gender: Gender,
  rand1: number,
  rand2: number,
): number {
  const r = (rand1 + rand2) / 2; // 0~1, 0.5 중심
  return gender === "female"
    ? Math.round(150 + r * 24)
    : Math.round(162 + r * 26);
}

/** 나이에 따른 현재 키(cm). 0세 50cm → 20세에 목표키 도달(초반 빠르고 둔화). */
export function heightForAge(age: number, potential: number): number {
  if (age >= ADULT_AGE) return potential;
  if (age <= 0) return BIRTH_CM;
  const t = Math.sqrt(age / ADULT_AGE); // ease-out: 어릴 때 빠르게 성장
  return Math.round(BIRTH_CM + (potential - BIRTH_CM) * t);
}

/** 캐릭터의 현재 키(cm) — 파생값(저장하지 않음) */
export function currentHeight(c: Character): number {
  return heightForAge(c.ageYears, c.heightPotential);
}

export type HeightBuild = "tall" | "average" | "short";

/** 성별 평균 대비 체격 분류 (성인 목표키 기준) */
export function heightBuild(potential: number, gender: Gender): HeightBuild {
  const avg = gender === "female" ? 162 : 175;
  if (potential >= avg + 8) return "tall";
  if (potential <= avg - 8) return "short";
  return "average";
}

export function heightBuildLabel(b: HeightBuild): string {
  return b === "tall" ? "장신형" : b === "short" ? "단신형" : "평균형";
}
