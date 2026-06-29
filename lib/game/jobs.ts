import type {
  CharacterStats,
  CompanyTypeKey,
  JobFamilyKey,
  JobGrade,
} from "@/types/character";

export interface JobFamily {
  label: string;
  icon: string; // PixelIcon 이름
  coreStats: (keyof CharacterStats)[];
  desc: string;
}

export const JOB_FAMILIES: Record<JobFamilyKey, JobFamily> = {
  management: { label: "경영/전략", icon: "star", coreStats: ["careerPotential", "intelligence", "communication"], desc: "기획·전략·리더십" },
  finance: { label: "회계/재무", icon: "coin", coreStats: ["intelligence", "discipline", "memory"], desc: "회계·재무·정확성" },
  hr: { label: "인사/총무", icon: "heart", coreStats: ["communication", "discipline"], desc: "인사·운영·공감" },
  sales: { label: "영업/영업관리", icon: "bolt", coreStats: ["communication", "careerPotential"], desc: "영업·협상·멘탈" },
  marketing: { label: "마케팅/콘텐츠", icon: "chart", coreStats: ["creativity", "communication"], desc: "마케팅·창의·트렌드" },
  dev: { label: "개발/IT", icon: "code", coreStats: ["intelligence", "discipline", "creativity"], desc: "코딩·설계·협업" },
  data: { label: "데이터/AI", icon: "chart", coreStats: ["intelligence", "memory", "discipline"], desc: "통계·모델링·인사이트" },
  pm: { label: "기획/PM", icon: "star", coreStats: ["careerPotential", "communication", "creativity"], desc: "기획·문서·실행" },
  design: { label: "디자인", icon: "palette", coreStats: ["creativity", "intelligence"], desc: "감각·UX·디테일" },
  cs: { label: "고객지원/CS", icon: "speech", coreStats: ["communication"], desc: "응대·공감·문제해결" },
  production: { label: "생산/품질/구매", icon: "exercise", coreStats: ["discipline", "fitness"], desc: "공정·품질·운영" },
  legal: { label: "법무/컴플라이언스", icon: "resume", coreStats: ["intelligence", "discipline", "memory"], desc: "법무·규정·정확성" },
};

export interface CompanyType {
  label: string;
  icon: string;
  salaryMult: number;
  chanceMod: number; // employmentChance 보정(음수=어려움)
  desc: string;
}

export const COMPANY_TYPES: Record<CompanyTypeKey, CompanyType> = {
  large: { label: "대기업", icon: "briefcase", salaryMult: 1.3, chanceMod: -15, desc: "높은 초봉 · 높은 강도" },
  midsize: { label: "중견기업", icon: "briefcase", salaryMult: 1.1, chanceMod: -5, desc: "안정적" },
  small: { label: "중소기업", icon: "briefcase", salaryMult: 0.9, chanceMod: 8, desc: "빠른 성장 · 변동" },
  startup: { label: "스타트업", icon: "bolt", salaryMult: 1.05, chanceMod: -3, desc: "고성장 · 고리스크" },
  public: { label: "공공기관", icon: "star", salaryMult: 0.95, chanceMod: -12, desc: "안정 · 저성장" },
  freelance: { label: "프리랜서", icon: "folder", salaryMult: 0.85, chanceMod: 12, desc: "자유 · 수입 변동" },
};

export const BASE_SALARY: Record<JobGrade, number> = {
  intern: 2400,
  newbie: 3000,
  staff: 3600,
};

export const GRADE_LABEL: Record<JobGrade, string> = {
  intern: "인턴",
  newbie: "신입",
  staff: "사원",
};

export function gradeForScore(score: number): JobGrade {
  return score >= 75 ? "staff" : score >= 55 ? "newbie" : "intern";
}

/** 초봉(만원) = 직급 기본 × 회사 배율, 100만원 단위 반올림 */
export function startingSalary(grade: JobGrade, company: CompanyTypeKey): number {
  return Math.round((BASE_SALARY[grade] * COMPANY_TYPES[company].salaryMult) / 100) * 100;
}

export function jobTitle(family: JobFamilyKey, grade: JobGrade): string {
  return `${JOB_FAMILIES[family].label} ${GRADE_LABEL[grade]}`;
}
