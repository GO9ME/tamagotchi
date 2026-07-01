import type { FoodDef } from "@/types/action";
import type { JobGrade, LifeStage } from "@/types/character";

// ---------------------------------------------------------------------------
// 시간 / 나이
// ---------------------------------------------------------------------------

const HOUR = 60 * 60 * 1000;

/**
 * 게임 1년이 현실 몇 ms 인지. 기본 = 9분 → 정년(60세)까지 약 9시간 한 판(출근 월급루팡용).
 * env(NEXT_PUBLIC_GAME_YEAR_MS) 로 조절 가능(빠른 테스트/느린 플레이).
 */
export const GAME_YEAR_MS: number = (() => {
  const fromEnv = Number(process.env.NEXT_PUBLIC_GAME_YEAR_MS);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 9 * 60 * 1000;
})();

/** 연간 생활비(만원) — 저축 = 연봉 - 생활비 */
export const LIVING_COST = 2000;

/** 자연사 한계 나이(이 나이엔 사망 확률 100%). 60세 = 9분/년 × 60 = 약 9시간 한 판 */
export const MAX_AGE = 60;

/** 액션 쿨타임 배율(빠른 회전). 1.0=원본(시간단위), 0.2≈5분의1 */
export const COOLDOWN_SCALE = 0.2;

/** 상태 감소 배율(짧은 한 판에서도 케어가 의미있도록) */
export const DECAY_SCALE = 3;

export const WEIGHT_MIN = 6;
export const WEIGHT_MAX = 120;

// ---------------------------------------------------------------------------
// 시간 경과 상태 감소율 (현실 1시간당 변화량)
//   양수 = 시간이 지나면 증가, 음수 = 감소
// ---------------------------------------------------------------------------

export const DECAY_PER_HOUR = {
  hunger: -7,
  energy: -4,
  mood: -3,
  focus: -5,
  cleanliness: -4,
  sleepQuality: -3,
  stress: +2,
} as const;

/** 마지막 운동 후 이 시간이 지나면 시간당 체중이 조금씩 증가 */
export const NO_EXERCISE_THRESHOLD_MS = 18 * HOUR;
export const WEIGHT_GAIN_NO_EXERCISE_PER_HOUR = 0.08;

// ---------------------------------------------------------------------------
// 성장 단계 (게임 나이 기준)
// ---------------------------------------------------------------------------

export interface StageInfo {
  stage: LifeStage;
  label: string;
  minAge: number;
  emoji: string;
}

export const LIFE_STAGES: StageInfo[] = [
  { stage: "baby", label: "아기", minAge: 0, emoji: "🐣" },
  { stage: "child", label: "유아", minAge: 4, emoji: "🧒" },
  { stage: "elementary", label: "초등학생", minAge: 8, emoji: "🎒" },
  { stage: "middle", label: "중학생", minAge: 14, emoji: "📚" },
  { stage: "high", label: "고등학생", minAge: 17, emoji: "🎓" },
  { stage: "university", label: "대학생", minAge: 20, emoji: "🏫" },
  { stage: "jobseeker", label: "취준생", minAge: 25, emoji: "💼" },
  { stage: "employee", label: "직장인", minAge: 26, emoji: "🧑‍💻" },
  { stage: "senior", label: "경력직", minAge: 38, emoji: "🧑‍💼" },
  { stage: "retirement", label: "은퇴 준비", minAge: 60, emoji: "🌅" },
];

// ---------------------------------------------------------------------------
// 적정 몸무게 (성장 단계별)
// ---------------------------------------------------------------------------

export const HEALTHY_WEIGHT: Record<LifeStage, [number, number]> = {
  baby: [8, 15],
  child: [15, 30],
  elementary: [25, 45],
  middle: [40, 65],
  high: [50, 75],
  university: [52, 82],
  jobseeker: [52, 82],
  employee: [55, 85],
  senior: [55, 88],
  retirement: [52, 85],
};

// ---------------------------------------------------------------------------
// 레벨 곡선: 다음 레벨까지 필요한 누적 exp
// ---------------------------------------------------------------------------

export function expForLevel(level: number): number {
  // 1 -> 2 는 30, 점점 증가
  return Math.round(30 * Math.pow(level, 1.4));
}

// ---------------------------------------------------------------------------
// 음식
// ---------------------------------------------------------------------------

export const FOODS: FoodDef[] = [
  {
    key: "homeMeal",
    label: "집밥",
    emoji: "🍚",
    effect: {
      status: { hunger: 40, health: 5, weight: 0.2 },
      message: "집밥을 먹었어요. 든든하고 건강해요!",
    },
  },
  {
    key: "cafeteria",
    label: "급식/학식",
    emoji: "🍱",
    effect: {
      status: { hunger: 35, weight: 0.2 },
      message: "급식으로 한 끼 해결!",
    },
  },
  {
    key: "convenience",
    label: "편의점",
    emoji: "🍙",
    effect: {
      status: { hunger: 25, mood: 3, health: -1, weight: 0.1 },
      message: "편의점 음식으로 간단히 때웠어요.",
    },
  },
  {
    key: "fastfood",
    label: "패스트푸드",
    emoji: "🍔",
    effect: {
      status: { hunger: 40, mood: 8, health: -2, weight: 0.5 },
      message: "기분은 좋지만 살이 조금 붙었어요.",
    },
  },
  {
    key: "salad",
    label: "샐러드",
    emoji: "🥗",
    effect: {
      status: { hunger: 20, health: 5, weight: 0.05 },
      message: "가볍고 건강한 한 끼!",
    },
  },
  {
    key: "coffee",
    label: "커피",
    emoji: "☕",
    effect: {
      status: { focus: 15, stress: 3, sleepQuality: -5 },
      message: "집중력이 올라갔어요. 너무 늦게 마시면 잠을 설칠 수 있어요.",
    },
  },
];

/** 과식 기준: 이미 배부른 상태(>=85)에서 또 먹으면 과식 페널티 */
export const OVEREAT_HUNGER_THRESHOLD = 85;
export const OVEREAT_EXTRA_WEIGHT = 0.5;

// ---------------------------------------------------------------------------
// Phase 2: 단계 인덱스 / 연간 리뷰 / 시험
// ---------------------------------------------------------------------------

/** LifeStage -> LIFE_STAGES 내 순서 인덱스 */
export const STAGE_INDEX: Record<LifeStage, number> = LIFE_STAGES.reduce(
  (acc, s, i) => {
    acc[s.stage] = i;
    return acc;
  },
  {} as Record<LifeStage, number>,
);

/**
 * 연간 권장 활동 횟수 — GAME_YEAR_MS(9분/년)와 액션 쿨타임(실 ~12분)에 맞춰 자동 산출.
 * 9분/년에 8회 공부는 물리적으로 불가능했던 문제를 정합화(한 해에 실제로 달성 가능한 수치).
 * 시간 배율(env)이 바뀌면 함께 스케일된다.
 */
const _yearMin = GAME_YEAR_MS / 60000;
const _per = (cycleMin: number) => Math.max(1, Math.round(_yearMin / cycleMin));
export const YEARLY_TARGETS = {
  study: _per(12), // 공부: 세션+쿨타임 ≈ 실 12분
  selfDev: _per(12),
  exercise: _per(12),
  meals: _per(6), // 식사는 더 자주
};

/** 오프라인 다년 방치 시 페널티 적용 상한 연수 */
export const MAX_NEGLECT_YEARS_APPLIED = 3;

/** 이 시간(ms) 이상 앱을 열지 않으면 방치 사망 처리 */
export const NEGLECT_DEATH_MS = 8 * 60 * 60 * 1000; // 현실 8시간

/** 시험이 발생하는 학업 단계 */
export const EDU_STAGES: LifeStage[] = [
  "elementary",
  "middle",
  "high",
  "university",
  "jobseeker",
];

/** 평가 등급별 연봉 인상률(%) — PRD 14.4 */
export const RAISE_PCT: Record<"S" | "A" | "B" | "C" | "D", number> = {
  S: 8,
  A: 5,
  B: 3,
  C: 0,
  D: -3,
};

/** 현재 직급에서 다음 직급으로 승진하는 데 필요한 promotionScore 임계 — 고연차일수록 ↑ */
export const PROMO_THRESHOLD: Record<JobGrade, number> = {
  intern: 55,
  newbie: 60,
  staff: 65,
  junior: 68,
  assistant: 72,
  manager: 76,
  deputy: 80,
  director: 86,
  executive: 93,
  ceo: 999, // 최상위, 승진 없음
};

// ---------------------------------------------------------------------------
// 마스코트 색상 팔레트 (커스텀 캐릭터)
// ---------------------------------------------------------------------------

export interface MascotColor {
  key: string;
  label: string;
  body: string; // 본체 색
  shade: string; // 배/그림자 등 진한 색
}

export const MASCOT_COLORS: MascotColor[] = [
  { key: "blush", label: "복숭아", body: "#FFB7C5", shade: "#FF94A9" },
  { key: "mint", label: "민트", body: "#A8E6CF", shade: "#7FD9B6" },
  { key: "sky", label: "하늘", body: "#AEDFF7", shade: "#86CBEF" },
  { key: "butter", label: "버터", body: "#FFE08A", shade: "#FFC94D" },
  { key: "grape", label: "포도", body: "#C9B6F2", shade: "#AE96E8" },
  { key: "coral", label: "코랄", body: "#FFB199", shade: "#FF8C6B" },
];

export function getMascotColor(key: string): MascotColor {
  return MASCOT_COLORS.find((c) => c.key === key) ?? MASCOT_COLORS[0];
}
