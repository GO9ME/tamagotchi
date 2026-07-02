import type { Character, CharacterAppearance, Gender } from "@/types/character";
import { rollHeightPotential } from "./body";
import { expForLevel } from "./constants";
import { ageFromBornAt, stageForAge } from "./growth";
import { rollAppearance } from "./sprite/characterAppearance";

/**
 * 새 아기 캐릭터 생성.
 * appearance 를 안 넘기면 새로 랜덤 결정한다 — 생성 화면에서 미리보기와 실제
 * 생성 결과가 똑같도록, 미리 뽑아둔 appearance 를 그대로 넘기는 걸 권장.
 */
export function createCharacter(
  userId: string,
  name: string,
  color: string,
  gender: Gender,
  now: number,
  appearance: CharacterAppearance = rollAppearance(),
): Character {
  const age = ageFromBornAt(now, now); // = 0
  return {
    id: `char_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    name: name.trim() || "아기",
    color: color || "blush",
    gender,
    heightPotential: rollHeightPotential(gender, Math.random(), Math.random()),
    appearance,
    degree: "highschool",
    gradEnroll: null,
    university: null,
    avatar: "🐣",
    ageYears: age,
    lifeStage: stageForAge(age),
    level: 1,
    exp: 0,
    statPoints: 0,
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
      stamina: 5,
      strength: 5,
      communication: 5,
      careerPotential: 5,
      employability: 5,
      academic: 5,
      portfolioScore: 0,
      interviewScore: 0,
      certificateScore: 0,
      performance: 0,
      luck: 5,
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
    savings: 0,
    roomItems: [],
    assets: [],
    housing: { option: "parents", deposit: 0, loanBalance: 0, homeValue: 0 },
    wardrobe: [],
    equippedOutfit: null,
    equippedAccessory: null,
    happiness: 50,
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
