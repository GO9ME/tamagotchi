// ---------------------------------------------------------------------------
// events.ts
// 연간 랜덤 인생 이벤트 — 리뷰(runDueReviews) 시점에 최대 1건 발동.
// rollLifeRisk(사고/사망)와 별개로, 소소한 행운/불운과 결혼·출산 마일스톤을 담당.
// rand 는 전부 주입받아 결정적으로 동작(테스트 가능).
// ---------------------------------------------------------------------------

import type { ActionEffect } from "@/types/action";
import type { Character, LifeEventRecord } from "@/types/character";

/** 이벤트 발동 확률(연간, 결혼/출산 미발동 시) */
export const YEARLY_EVENT_CHANCE = 0.22;

export const MARRIAGE_COST = 500; // 결혼식+신혼 준비(만원)
export const CHILDBIRTH_COST = 200; // 출산·육아 초기 비용(만원)
export const MAX_CHILDREN = 2;

export interface RolledEvent {
  record: LifeEventRecord;
  /** 상태/스탯 변화(있으면) */
  effect?: ActionEffect;
  /** 저축 변화(만원) */
  savingsDelta: number;
  /** 행복도 변화 */
  happinessDelta: number;
}

interface EventDef {
  key: string;
  emoji: string;
  label: string;
  weight: number;
  when: (c: Character, age: number) => boolean;
  make: (c: Character, age: number) => Omit<RolledEvent, "record"> & { detail: string };
}

const EVENTS: EventDef[] = [
  {
    key: "foundCash",
    emoji: "💵",
    label: "지갑 습득 사례금",
    weight: 2,
    when: (_c, age) => age >= 8,
    make: () => ({
      detail: "길에서 주운 지갑을 주인에게 돌려주고 사례금을 받았어요.",
      savingsDelta: 20,
      happinessDelta: 1,
      effect: { status: { mood: 5 } },
    }),
  },
  {
    key: "lottery",
    emoji: "🎰",
    label: "복권 3등 당첨",
    weight: 0.6,
    when: (_c, age) => age >= 19,
    make: (c) => ({
      detail: "재미로 산 복권이 3등에 당첨됐어요!",
      // 자산 규모에 맞춰 체감 유지 — 기본 300 + 연봉의 30%
      savingsDelta: 300 + Math.round((c.job?.salaryManwon ?? 0) * 0.3),
      happinessDelta: 3,
      effect: { status: { mood: 12 } },
    }),
  },
  {
    key: "phoneBroken",
    emoji: "📱",
    label: "휴대폰 파손",
    weight: 1.5,
    when: (_c, age) => age >= 13,
    make: (c) => ({
      detail: "휴대폰 액정이 깨져서 수리비가 나갔어요…",
      savingsDelta: -(80 + Math.round((c.job?.salaryManwon ?? 0) * 0.02)),
      happinessDelta: -1,
      effect: { status: { mood: -5, stress: 4 } },
    }),
  },
  {
    key: "bonus",
    emoji: "💰",
    label: "특별 보너스",
    weight: 1.5,
    when: (c) => !!c.job,
    make: (c) => ({
      detail: "회사에서 깜짝 특별 보너스가 나왔어요!",
      savingsDelta: Math.round(c.job!.salaryManwon * 0.05),
      happinessDelta: 2,
      effect: { status: { mood: 8, confidence: 3 } },
    }),
  },
  {
    key: "reunion",
    emoji: "🤝",
    label: "오랜 친구와 재회",
    weight: 2,
    when: (_c, age) => age >= 10,
    make: () => ({
      detail: "오랜 친구와 우연히 재회해 밤새 수다를 떨었어요.",
      savingsDelta: 0,
      happinessDelta: 2,
      effect: { status: { mood: 10, stress: -5 } },
    }),
  },
  {
    key: "stockGain",
    emoji: "📈",
    label: "투자 수익",
    weight: 1,
    when: (c, age) => age >= 20 && c.savings >= 500,
    make: (c) => ({
      detail: "소액 투자가 수익을 냈어요!",
      // 저축의 8%, 상한 5,000만원 — 후반에도 체감되도록
      savingsDelta: Math.min(5000, Math.round(c.savings * 0.08)),
      happinessDelta: 1,
      effect: { status: { mood: 6, confidence: 2 } },
    }),
  },
  {
    key: "stockLoss",
    emoji: "📉",
    label: "투자 손실",
    weight: 1,
    when: (c, age) => age >= 20 && c.savings >= 500,
    make: (c) => ({
      detail: "투자가 물렸어요… 다음엔 신중하게.",
      savingsDelta: -Math.min(5000, Math.round(c.savings * 0.08)),
      happinessDelta: -1,
      effect: { status: { mood: -6, stress: 6 } },
    }),
  },
  {
    key: "viral",
    emoji: "✨",
    label: "SNS 소소한 유명세",
    weight: 1,
    when: (_c, age) => age >= 13,
    make: () => ({
      detail: "올린 게시물이 화제가 돼 기분 좋은 하루!",
      savingsDelta: 0,
      happinessDelta: 1,
      effect: { status: { mood: 7, confidence: 5 } },
    }),
  },
];

/**
 * 연간 랜덤 이벤트 롤. rTrigger 로 발동 여부, rPick 으로 가중 선택.
 * 발동하지 않거나 조건에 맞는 이벤트가 없으면 null.
 */
export function rollYearlyEvent(
  c: Character,
  age: number,
  rTrigger: number,
  rPick: number,
): RolledEvent | null {
  if (rTrigger >= YEARLY_EVENT_CHANCE) return null;
  const pool = EVENTS.filter((e) => e.when(c, age));
  if (pool.length === 0) return null;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let acc = 0;
  const target = rPick * total;
  const picked = pool.find((e) => (acc += e.weight) >= target) ?? pool[pool.length - 1];
  const made = picked.make(c, age);
  return {
    record: {
      key: picked.key,
      emoji: picked.emoji,
      label: picked.label,
      detail: made.detail,
      savingsDelta: made.savingsDelta !== 0 ? made.savingsDelta : undefined,
    },
    effect: made.effect,
    savingsDelta: made.savingsDelta,
    happinessDelta: made.happinessDelta,
  };
}

// ---------------------------------------------------------------------------
// 결혼·출산 — 일반 이벤트보다 우선 판정되는 마일스톤
// ---------------------------------------------------------------------------

/** 결혼 조건: 미혼 · 26~45세 · 취업 상태 · 행복도 55+ → 연 18% */
export function rollMarriage(c: Character, age: number, r: number): boolean {
  if (c.marriedAtAge != null) return false;
  if (age < 26 || age > 45) return false;
  if (!c.job) return false;
  if (c.happiness < 55) return false;
  return r < 0.18;
}

/** 출산 조건: 기혼 1년+ · 45세 이하 · 자녀 2명 미만 → 연 28% */
export function rollChildbirth(c: Character, age: number, r: number): boolean {
  if (c.marriedAtAge == null) return false;
  if (age > 45) return false;
  if ((c.childrenBornAges ?? []).length >= MAX_CHILDREN) return false;
  if (age - c.marriedAtAge < 1) return false;
  return r < 0.28;
}
