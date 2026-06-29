import type { CharacterStatus } from "@/types/character";

/** 값을 [min, max] 범위로 제한 */
export function clamp(v: number, min = 0, max = 100): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

/** 소수 둘째 자리까지 반올림 (몸무게 등) */
export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

import { WEIGHT_MAX, WEIGHT_MIN } from "./constants";

/** 모든 상태 수치를 유효 범위로 clamp */
export function clampStatus(s: CharacterStatus): CharacterStatus {
  return {
    hunger: clamp(s.hunger),
    energy: clamp(s.energy),
    mood: clamp(s.mood),
    health: clamp(s.health),
    stress: clamp(s.stress),
    focus: clamp(s.focus),
    sleepQuality: clamp(s.sleepQuality),
    cleanliness: clamp(s.cleanliness),
    confidence: clamp(s.confidence),
    burnout: clamp(s.burnout),
    weight: round2(clamp(s.weight, WEIGHT_MIN, WEIGHT_MAX)),
  };
}
