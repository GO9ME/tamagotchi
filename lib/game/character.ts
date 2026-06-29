import type { Character } from "@/types/character";
import { expForLevel } from "./constants";
import { ageFromBornAt, stageForAge } from "./growth";

/** 새 아기 캐릭터 생성 */
export function createCharacter(
  userId: string,
  name: string,
  color: string,
  now: number,
): Character {
  const age = ageFromBornAt(now, now); // = 0
  return {
    id: `char_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    name: name.trim() || "아기",
    color: color || "blush",
    avatar: "🐣",
    ageYears: age,
    lifeStage: stageForAge(age),
    level: 1,
    exp: 0,
    status: {
      hunger: 70,
      energy: 80,
      mood: 80,
      health: 85,
      stress: 8,
      focus: 50,
      sleepQuality: 80,
      cleanliness: 80,
      confidence: 40,
      burnout: 0,
      weight: 10,
    },
    stats: {
      intelligence: 5,
      discipline: 5,
      creativity: 5,
      memory: 5,
      fitness: 5,
      communication: 5,
      careerPotential: 5,
      employability: 5,
      academic: 5,
      portfolioScore: 0,
      interviewScore: 0,
      certificateScore: 0,
      performance: 0,
    },
    bornAt: now,
    createdAt: now,
    lastTickAt: now,
    lastExerciseAt: now,
    cooldowns: {},
    activeSession: null,
    yearCounters: { study: 0, exercise: 0, selfDev: 0, meals: 0 },
    lastReviewedAge: 0,
    reviews: [],
    job: null,
    jobApplications: 0,
  };
}

/** 현재 레벨 진행도 */
export function expProgress(c: Character): {
  current: number;
  need: number;
  ratio: number;
} {
  const need = expForLevel(c.level);
  return { current: c.exp, need, ratio: need > 0 ? c.exp / need : 0 };
}
