import type { ActionDef } from "@/types/action";
import type { Character } from "@/types/character";
import { weightEfficiencyMultiplier } from "./weight";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

/**
 * 액션 정의 목록.
 * - food: 밥 먹이기 (음식 선택은 FoodSelector + feed 로직에서 처리)
 * - session: 공부하기 (시작/완료 30분, study.ts 에서 보상 계산)
 * - instant: 즉시 보상 액션
 */
export const ACTIONS: ActionDef[] = [
  {
    key: "feed",
    label: "밥 먹이기",
    emoji: "🍚",
    desc: "음식을 골라 배고픔을 채워요.",
    kind: "food",
    cooldownMs: 3 * HOUR,
    category: "care",
  },
  {
    key: "snack",
    label: "간식 주기",
    emoji: "🍪",
    desc: "기분 전환! 대신 살짝 살이 붙어요.",
    kind: "instant",
    cooldownMs: 1 * HOUR,
    category: "fun",
    effect: () => ({
      status: { hunger: 10, mood: 8, weight: 0.15 },
      exp: 3,
      message: "간식을 먹고 기분이 좋아졌어요.",
    }),
  },
  {
    key: "study",
    label: "공부하기",
    emoji: "📖",
    desc: "30분 집중 세션. 끝나면 완료를 눌러 보상을 받아요.",
    kind: "session",
    cooldownMs: 30 * MIN,
    sessionMs: 30 * MIN,
    category: "study",
  },
  {
    key: "exercise",
    label: "운동하기",
    emoji: "🏃",
    desc: "체력을 단련하고 몸무게를 줄여요.",
    kind: "instant",
    cooldownMs: 1 * HOUR,
    category: "fitness",
    effect: (c: Character) => {
      const m = weightEfficiencyMultiplier(c);
      return {
        status: {
          weight: -0.3 * m,
          energy: -8,
          stress: -3,
          mood: 3,
          health: 2,
        },
        stats: { fitness: 1.5 * m },
        exp: 8,
        message: "운동으로 땀을 흘렸어요. 상쾌하다!",
      };
    },
  },
  {
    key: "selfDev",
    label: "자기개발",
    emoji: "🚀",
    desc: "커리어 잠재력과 성실성을 키워요.",
    kind: "instant",
    cooldownMs: 1 * HOUR,
    category: "selfdev",
    effect: () => ({
      status: { energy: -5, stress: 3, focus: 2 },
      stats: { careerPotential: 2, discipline: 1 },
      exp: 10,
      message: "자기개발에 시간을 투자했어요. 미래의 나에게 투자!",
    }),
  },
  {
    key: "read",
    label: "독서",
    emoji: "📚",
    desc: "지능과 창의력을 키워요.",
    kind: "instant",
    cooldownMs: 1 * HOUR,
    category: "selfdev",
    effect: () => ({
      status: { focus: 3, mood: 2 },
      stats: { intelligence: 1, creativity: 1 },
      exp: 6,
      message: "책을 읽으며 생각이 깊어졌어요.",
    }),
  },
  {
    key: "play",
    label: "놀아주기",
    emoji: "🎈",
    desc: "기분을 올리고 스트레스를 풀어요.",
    kind: "instant",
    cooldownMs: 1 * HOUR,
    category: "fun",
    effect: () => ({
      status: { mood: 15, stress: -10, energy: -5 },
      exp: 4,
      message: "신나게 놀았어요!",
    }),
  },
  {
    key: "bath",
    label: "씻기",
    emoji: "🛁",
    desc: "청결을 회복하고 기분도 좋아져요.",
    kind: "instant",
    cooldownMs: 4 * HOUR,
    category: "care",
    effect: () => ({
      status: { cleanliness: 55, mood: 5 },
      exp: 3,
      message: "깨끗하게 씻었어요. 뽀송뽀송!",
    }),
  },
  {
    key: "nap",
    label: "낮잠 자기",
    emoji: "😴",
    desc: "체력을 빠르게 회복해요.",
    kind: "instant",
    cooldownMs: 2 * HOUR,
    category: "rest",
    effect: () => ({
      status: { energy: 25, mood: 3, stress: -4 },
      exp: 2,
      message: "달콤한 낮잠으로 체력을 회복했어요.",
    }),
  },
  {
    key: "sleep",
    label: "수면",
    emoji: "🛏️",
    desc: "푹 자고 컨디션을 크게 회복해요.",
    kind: "instant",
    cooldownMs: 8 * HOUR,
    category: "rest",
    effect: () => ({
      status: { energy: 60, sleepQuality: 45, stress: -12, health: 3, focus: 10 },
      exp: 4,
      message: "푹 잤어요. 컨디션 최상!",
    }),
  },
];

export const ACTION_MAP: Record<string, ActionDef> = Object.fromEntries(
  ACTIONS.map((a) => [a.key, a]),
);

export function getAction(key: string): ActionDef | undefined {
  return ACTION_MAP[key];
}
