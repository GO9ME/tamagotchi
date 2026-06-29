import type { ActionEffect } from "@/types/action";
import type { Character, Degree } from "@/types/character";

export const DEGREE_LABEL: Record<Degree, string> = {
  highschool: "고졸",
  bachelor: "학사",
  master: "석사",
  phd: "박사",
};

/** 학위별 취업 합격률 보너스(%p) — 높은 학위일수록 유리 */
export const DEGREE_HIRING_BONUS: Record<Degree, number> = {
  highschool: -8,
  bachelor: 0,
  master: 10,
  phd: 18,
};

/** 학위별 초봉 배율 */
export const DEGREE_SALARY_MULT: Record<Degree, number> = {
  highschool: 0.92,
  bachelor: 1.0,
  master: 1.12,
  phd: 1.25,
};

/** 대학원 과정 소요 게임년수 */
export const DEGREE_YEARS: Record<"master" | "phd", number> = {
  master: 2,
  phd: 3,
};

/** 대학원 연간 추가 비용(등록금 등, 만원) — 생활비와 별개로 저축에서 빠짐(노예의 빚) */
export const GRAD_TUITION = 1200;

/** 대학원 입학에 필요한 학업 스탯 하한 */
export const GRAD_ADMISSION_ACADEMIC: Record<"master" | "phd", number> = {
  master: 30,
  phd: 50,
};

/** 대학 졸업(학사 자동 취득) 나이 = 취준생 진입 */
export const BACHELOR_AGE = 25;

const ci = (s: number) => Math.min(Math.max(s, 0), 100);

/** 취업 합격률 보너스(현재 학위 기준) */
export function degreeHiringMod(c: Character): number {
  return DEGREE_HIRING_BONUS[c.degree];
}

export function degreeSalaryMult(c: Character): number {
  return DEGREE_SALARY_MULT[c.degree];
}

/** 현재 학위에서 다음으로 진학 가능한 대학원 과정(없으면 null) */
export function nextGradDegree(d: Degree): "master" | "phd" | null {
  if (d === "bachelor") return "master";
  if (d === "master") return "phd";
  return null;
}

/** 대학원 입학 가능 여부 (취준생·미취업·미재학 + 학위 단계 + 학업 하한) */
export function gradAdmission(c: Character): {
  ok: boolean;
  target: "master" | "phd" | null;
  reason?: string;
} {
  if (c.job) return { ok: false, target: null, reason: "재직 중에는 진학할 수 없어요." };
  if (c.gradEnroll) {
    return { ok: false, target: c.gradEnroll.degree, reason: "이미 대학원 재학 중이에요." };
  }
  if (c.lifeStage !== "jobseeker") {
    return { ok: false, target: null, reason: "취준생(대학 졸업) 단계부터 진학할 수 있어요." };
  }
  const target = nextGradDegree(c.degree);
  if (!target) return { ok: false, target: null, reason: "더 진학할 과정이 없어요." };
  const bar = GRAD_ADMISSION_ACADEMIC[target];
  if (ci(c.stats.academic) < bar) {
    return {
      ok: false,
      target,
      reason: `학업 ${bar} 이상 필요해요. (현재 ${Math.round(ci(c.stats.academic))})`,
    };
  }
  return { ok: true, target };
}

/** 대학원 1년치 효과(노예): 학업·지능 폭증, 스트레스·번아웃 ↑ */
export function gradYearEffect(): ActionEffect {
  return {
    stats: { academic: 8, intelligence: 3, memory: 2, careerPotential: 1 },
    status: { stress: 10, burnout: 3, mood: -2, confidence: 1 },
  };
}
