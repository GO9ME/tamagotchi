// ---------------------------------------------------------------------------
// leisure.ts
// 여가·쇼핑 — 번 돈을 "능동적으로" 써서 행복도/기분/스트레스를 관리하는 소비 액션.
// 방 꾸미기(1회 영구)·대형 자산(순자산)과 달리, 반복 가능한 쿨타임 액션이다.
// 행복도를 플레이어가 직접 올릴 수 있는 유일한 상시 수단(그 외엔 연 1회 자동 갱신·이벤트).
// ---------------------------------------------------------------------------

import type { ActionEffect } from "@/types/action";
import type { Character } from "@/types/character";
import { cooldownRemaining } from "./engine";

export interface LeisureDef {
  key: string;
  label: string;
  /** PixelIcon 이름 */
  icon: string;
  emoji: string;
  /** 비용(만원) — 저축에서 차감 */
  cost: number;
  minAge: number;
  /** 스케일 전 원시 쿨타임(ms) — 스토어에서 COOLDOWN_SCALE 을 곱해 사용 */
  cooldownMs: number;
  effect: ActionEffect;
  /** 행복도 직접 상승분 */
  happinessDelta: number;
  desc: string;
}

const HOUR = 60 * 60 * 1000;

/** 나이 오름차순 — 성장하며 즐길 거리가 하나씩 열린다 */
export const LEISURE_ACTIVITIES: LeisureDef[] = [
  {
    key: "shopping",
    label: "옷 쇼핑",
    icon: "star",
    emoji: "🛍️",
    cost: 50,
    minAge: 13,
    cooldownMs: 1.5 * HOUR,
    effect: { status: { mood: 10, confidence: 8 }, exp: 6, message: "새 옷을 입으니 어깨가 펴져요!" },
    happinessDelta: 1,
    desc: "기분 전환엔 역시 새 옷 · 자신감 +",
  },
  {
    key: "dining",
    label: "맛집 탐방",
    icon: "feed",
    emoji: "🍜",
    cost: 30,
    minAge: 15,
    cooldownMs: 1.5 * HOUR,
    effect: { status: { mood: 8, hunger: 25 }, exp: 6, message: "웨이팅이 아깝지 않은 맛!" },
    happinessDelta: 1,
    desc: "배도 채우고 기분도 채우고",
  },
  {
    key: "concert",
    label: "콘서트·공연",
    icon: "bolt",
    emoji: "🎤",
    cost: 20,
    minAge: 15,
    cooldownMs: 1.5 * HOUR,
    effect: { status: { mood: 12, stress: -8 }, stats: { creativity: 0.5 }, exp: 6, message: "떼창의 여운이 가시질 않아요!" },
    happinessDelta: 1,
    desc: "스트레스 해소 · 창의력 +",
  },
  {
    key: "hotel",
    label: "호캉스",
    icon: "sleep",
    emoji: "🏨",
    cost: 150,
    minAge: 20,
    cooldownMs: 3 * HOUR,
    effect: { status: { energy: 30, stress: -20, mood: 12, sleepQuality: 20 }, exp: 8, message: "침대 밖은 위험해… 완벽한 재충전!" },
    happinessDelta: 1,
    desc: "에너지·수면 대회복 · 스트레스 해소",
  },
  {
    key: "domesticTrip",
    label: "국내 여행",
    icon: "chart",
    emoji: "🚌",
    cost: 100,
    minAge: 20,
    cooldownMs: 3 * HOUR,
    effect: { status: { mood: 15, stress: -12, energy: 8 }, exp: 8, message: "바다 보고 회 먹고, 이 맛에 살죠!" },
    happinessDelta: 2,
    desc: "훌쩍 떠나는 기분 전환",
  },
  {
    key: "overseasTrip",
    label: "해외여행",
    icon: "medal",
    emoji: "✈️",
    cost: 400,
    minAge: 25,
    cooldownMs: 6 * HOUR,
    effect: { status: { mood: 20, stress: -18 }, stats: { communication: 0.5 }, exp: 12, message: "세상은 넓고 추억은 평생 남아요!" },
    happinessDelta: 3,
    desc: "평생 남을 추억 · 소통 +",
  },
  {
    key: "filialGift",
    label: "부모님 선물",
    icon: "heart",
    emoji: "💐",
    cost: 100,
    minAge: 26,
    cooldownMs: 3 * HOUR,
    effect: { status: { mood: 10, confidence: 3 }, exp: 8, message: "전화기 너머 목소리가 밝아요. 효도 성공!" },
    happinessDelta: 2,
    desc: "효도는 셀프 · 마음이 든든해져요",
  },
];

export function leisureDef(key: string): LeisureDef | undefined {
  return LEISURE_ACTIVITIES.find((l) => l.key === key);
}

/** 쿨다운 저장 키 — 일반 액션 키와 충돌하지 않도록 네임스페이스 */
export function leisureCooldownKey(key: string): string {
  return `leisure:${key}`;
}

/**
 * 실행 가능 판정 — 사유를 함께 반환(UI 잠금/비활성 표시용).
 * 쿨타임은 원시값이 아니라 이미 기록된 cooldowns 를 본다(스토어가 스케일 적용해 기록).
 */
export function canDoLeisure(
  c: Character,
  key: string,
  now: number,
): { ok: boolean; reason?: string } {
  const def = leisureDef(key);
  if (!def) return { ok: false, reason: "알 수 없는 활동이에요." };
  if (c.ageYears < def.minAge) return { ok: false, reason: `${def.minAge}살부터 가능해요.` };
  if (c.savings < def.cost) return { ok: false, reason: "저축이 부족해요." };
  if (cooldownRemaining(c, leisureCooldownKey(key), now) > 0) {
    return { ok: false, reason: "아직 여운이 남아 있어요." };
  }
  return { ok: true };
}
