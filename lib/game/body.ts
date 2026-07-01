import type { Character, Gender } from "@/types/character";

const BIRTH_CM = 50;

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

// 나이별 성인키 대비 백분율(%) 앵커 — 질병관리청/대한소아과학회 성장도표 기반 실측 근사치.
// 남아는 사춘기 성장급등이 늦고(19세 완성), 여아는 더 이르다(17세 완성).
const BOY_HEIGHT_PCT: [number, number][] = [
  [0, 28.9], [1, 45.1], [2, 51.4], [3, 54.9], [4, 57.7], [6, 66.6],
  [8, 73.6], [9, 76.1], [10, 78.6], [12, 85.8], [14, 94.2], [15, 97],
  [16, 98.8], [17, 99.5], [18, 99.9], [19, 100],
];
const GIRL_HEIGHT_PCT: [number, number][] = [
  [0, 30.7], [1, 47.7], [2, 54.3], [3, 58.5], [4, 61.9], [6, 71.1],
  [8, 78.9], [9, 81.4], [10, 84.2], [12, 93.4], [13, 96.5], [14, 98.2],
  [15, 99], [16, 99.3], [17, 99.5], [18, 99.8], [19, 100],
];

/** 나이(년)에 대한 성인키 대비 백분율을 앵커 사이 선형보간으로 산출 */
function heightPercentForAge(age: number, gender: Gender): number {
  const anchors = gender === "female" ? GIRL_HEIGHT_PCT : BOY_HEIGHT_PCT;
  if (age <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (age >= last[0]) return 100;
  for (let i = 1; i < anchors.length; i++) {
    const [prevAge, prevPct] = anchors[i - 1];
    const [nextAge, nextPct] = anchors[i];
    if (age <= nextAge) {
      const t = (age - prevAge) / (nextAge - prevAge);
      return prevPct + (nextPct - prevPct) * t;
    }
  }
  return 100;
}

/** 나이에 따른 현재 키(cm). 실측 성장도표 기반 성별별 백분율 곡선 사용(여아가 더 일찍 완성). */
export function heightForAge(
  age: number,
  potential: number,
  gender: Gender,
): number {
  if (age <= 0) return BIRTH_CM;
  const pct = heightPercentForAge(age, gender);
  return Math.max(BIRTH_CM, Math.round(potential * (pct / 100)));
}

/** 캐릭터의 현재 키(cm) — 파생값(저장하지 않음) */
export function currentHeight(c: Character): number {
  return heightForAge(c.ageYears, c.heightPotential, c.gender);
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
