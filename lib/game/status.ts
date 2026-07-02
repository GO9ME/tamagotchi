import type { Character } from "@/types/character";
import { clamp, clampStatus, round2 } from "./clamp";
import {
  DECAY_PER_HOUR,
  DECAY_SCALE,
  MAX_AGE,
  NO_EXERCISE_THRESHOLD_MS,
  WEIGHT_GAIN_NO_EXERCISE_PER_HOUR,
} from "./constants";
import { ageFromBornAt, cappedStageForAge } from "./growth";
import { weightTickPenalty } from "./weight";

/**
 * 시간 경과에 따른 상태 변화를 적용한다. (서버/클라이언트 공용 순수 함수)
 * lastTickAt 부터 now 까지의 경과 시간만큼 감소/증가를 반영.
 */
export function applyDecay(c: Character, now: number): Character {
  const elapsedMs = Math.max(0, now - c.lastTickAt);
  const hours = elapsedMs / (60 * 60 * 1000);

  const next: Character = {
    ...c,
    status: { ...c.status },
    stats: { ...c.stats },
  };

  if (hours > 0) {
    const s = next.status;
    // 짧은 한 판(9분/년)에서도 케어가 의미있도록 감소를 배율 적용
    const dh = hours * DECAY_SCALE;
    s.hunger += DECAY_PER_HOUR.hunger * dh;
    s.energy += DECAY_PER_HOUR.energy * dh;
    s.mood += DECAY_PER_HOUR.mood * dh;
    s.focus += DECAY_PER_HOUR.focus * dh;
    s.cleanliness += DECAY_PER_HOUR.cleanliness * dh;
    s.sleepQuality += DECAY_PER_HOUR.sleepQuality * dh;
    s.stress += DECAY_PER_HOUR.stress * dh;

    // 배고픔이 바닥이면 건강/기분이 추가로 나빠진다.
    if (s.hunger < 10) {
      s.health -= 2 * dh;
      s.mood -= 2 * dh;
    }

    // 청결이 바닥이면 기분/건강이 나빠진다 — "씻기" 액션의 존재 이유
    if (s.cleanliness < 25) {
      s.mood -= 1.5 * dh;
      s.health -= 0.8 * dh;
    }

    // 스트레스가 높으면 번아웃이 천천히 쌓인다.
    if (s.stress > 70) {
      s.burnout += 1.2 * dh;
    } else {
      s.burnout -= 0.4 * dh;
    }

    // 장기 미운동 시 체중 증가
    if (now - c.lastExerciseAt > NO_EXERCISE_THRESHOLD_MS) {
      s.weight += WEIGHT_GAIN_NO_EXERCISE_PER_HOUR * hours;
    }

    // 몸무게 페널티
    const wp = weightTickPenalty(s.weight, next.ageYears, hours);
    s.health += wp.health;
    s.focus += wp.focus;
    s.energy += wp.energy;

    next.status = clampStatus(s);
    next.lastTickAt = now;
  }

  // 나이/단계 갱신 (시간 경과와 무관하게 항상 최신화)
  // employee 이상은 취업(job 보유) 했을 때만 진입 — 미취업이면 jobseeker 로 캡
  // 자연사 한계(60세)를 넘는 오프라인 점프에서도 나이는 60에 캡 → 수명·엔딩 표기 일관성
  const age = Math.min(ageFromBornAt(c.bornAt, now), MAX_AGE);
  next.ageYears = age;
  next.lifeStage = cappedStageForAge(age, c.job != null);

  return next;
}

/**
 * 공부/업무 보상 효율 배수.
 * hunger<30 -> 0.5, energy<30 -> 0.6, mood<30 -> 0.7, cleanliness<25 -> 0.85,
 * focus>80 -> 1.2. 가장 불리한 페널티를 적용하고 focus 보너스를 곱한다.
 */
export function learningEfficiency(c: Character): number {
  const { hunger, energy, mood, focus, cleanliness } = c.status;
  let mult = 1;
  if (hunger < 30) mult = Math.min(mult, 0.5);
  if (energy < 30) mult = Math.min(mult, 0.6);
  if (mood < 30) mult = Math.min(mult, 0.7);
  if (cleanliness < 25) mult = Math.min(mult, 0.85);
  const focusBonus = focus > 80 ? 1.2 : 1;
  return round2(mult * focusBonus);
}

/** 효율이 100% 미만일 때 사용자에게 보여줄 사유 목록 */
export function efficiencyReasons(c: Character): string[] {
  const reasons: string[] = [];
  if (c.status.hunger < 30) reasons.push("배고픔");
  if (c.status.energy < 30) reasons.push("체력 부족");
  if (c.status.mood < 30) reasons.push("기분 저하");
  if (c.status.cleanliness < 25) reasons.push("위생 불량");
  return reasons;
}

export { clamp };
