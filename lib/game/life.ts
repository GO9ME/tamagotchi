import type { Character, CharacterStatus } from "@/types/character";
import { clamp } from "./clamp";
import { LIVING_COST, MAX_AGE } from "./constants";
import { JOB_FAMILIES } from "./jobs";

/** 나이별 기본 위험 확률(%) — 60세 한계로 압축(약 9시간 한 판) */
export function ageRiskPct(age: number): number {
  if (age >= MAX_AGE) return 100;
  if (age < 30) return 0.5;
  if (age < 40) return 1.5;
  if (age < 45) return 4;
  if (age < 50) return 8;
  if (age < 55) return 16;
  if (age < 58) return 30;
  return 50;
}

/**
 * 연간 사고·질병·사망 위험 확률(%) = 나이 + 직업 위험도 + 스트레스 − 건강관리.
 * neutral=true 면 오프라인 누적 감쇠로 부풀려진 컨디션 대신 중립값으로 평가(채점과 대칭).
 */
export function riskPct(c: Character, age: number, neutral = false): number {
  if (age >= MAX_AGE) return 100;
  const base = ageRiskPct(age);
  const job = c.job ? JOB_FAMILIES[c.job.family].riskLevel * 100 : 1.5;
  const health = neutral ? 50 : c.status.health;
  const burnout = neutral ? 30 : c.status.burnout;
  const stress = neutral ? 50 : c.status.stress;
  const stressAdd = stress > 80 ? 2 : 0;
  const careReduction = (health - 50) * 0.06 + (50 - burnout) * 0.03;
  return clamp(base + job + stressAdd - careReduction, 0.2, 100);
}

export type RiskEvent =
  | { kind: "none" }
  | { kind: "incident"; cause: string; healthHit: number }
  | { kind: "death"; cause: string };

const INCIDENTS = [
  { cause: "교통사고", hit: 30 },
  { cause: "큰 병", hit: 35 },
  { cause: "과로로 입원", hit: 25 },
  { cause: "부상", hit: 20 },
];

/** 회복 가능한 사고/병 사인 단일 출처 — ending.ts 요절 판정이 이걸 참조 */
export const INCIDENT_CAUSES: string[] = INCIDENTS.map((i) => i.cause);

/** rand 3개 주입(결정성). 위험 발동 시 대부분 회복 가능한 사건, 드물게 사망. */
export function rollLifeRisk(
  c: Character,
  age: number,
  rTrigger: number,
  rFatal: number,
  rPick: number,
  neutral = false,
): RiskEvent {
  if (age >= MAX_AGE) return { kind: "death", cause: "노환" };
  const p = riskPct(c, age, neutral);
  if (rTrigger * 100 >= p) return { kind: "none" };

  const inc = INCIDENTS[Math.min(INCIDENTS.length - 1, Math.floor(rPick * INCIDENTS.length))];
  // 치명 확률: 건강 낮을수록·고령일수록 ↑
  const health = neutral ? 50 : c.status.health;
  const fatalChance = clamp(
    0.18 + (50 - health) * 0.006 + Math.max(0, age - 45) * 0.012,
    0.1,
    0.85,
  );
  if (rFatal < fatalChance) {
    return { kind: "death", cause: age >= 52 ? "지병" : inc.cause };
  }
  return { kind: "incident", cause: inc.cause, healthHit: inc.hit };
}

/** 연간 저축 변화(만원) = 연봉 − 생활비. 취업 전(학생·취준생 포함)에는 생활비 면제(0). */
export function yearlyNet(c: Character): number {
  if (!c.job) return 0;
  return c.job.salaryManwon - LIVING_COST;
}

/** 행복도 갱신 — 그 해 컨디션으로 평생 평균을 갱신 */
export function updateHappiness(prev: number, status: CharacterStatus): number {
  const yearHappy =
    status.mood * 0.4 +
    (100 - status.burnout) * 0.25 +
    (100 - status.stress) * 0.2 +
    status.health * 0.15;
  return clamp(Math.round(prev * 0.6 + yearHappy * 0.4), 0, 100);
}
