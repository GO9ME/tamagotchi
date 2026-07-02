// ---------------------------------------------------------------------------
// roomItems.ts
// 방 꾸미기 상점 — 저축(만원)의 소비처. 아이템은 한 번 사면 평생 방에 남는다.
// 구매 시 기분·행복도 소폭 상승(코스메틱 + 가벼운 보상), 되팔기 없음.
// ---------------------------------------------------------------------------

import type { RoomItemKey } from "@/types/character";

export interface RoomItemDef {
  key: RoomItemKey;
  label: string;
  emoji: string;
  /** 가격(만원) */
  price: number;
  desc: string;
}

/** 가격 오름차순 — 상점 목록 순서 그대로 사용 */
export const ROOM_ITEMS: RoomItemDef[] = [
  { key: "rug", label: "러그", emoji: "🟫", price: 50, desc: "방 한가운데 포근한 러그" },
  { key: "lamp", label: "스탠드 조명", emoji: "💡", price: 80, desc: "아늑한 코너 조명" },
  { key: "bigPlant", label: "대형 화분", emoji: "🪴", price: 100, desc: "침대 옆 초록 식물" },
  { key: "curtain", label: "커튼", emoji: "🪟", price: 120, desc: "창문 양옆 커튼" },
  { key: "fishbowl", label: "어항", emoji: "🐟", price: 150, desc: "물고기 한 마리" },
  { key: "console", label: "게임기", emoji: "🎮", price: 200, desc: "작은 TV + 게임기" },
  { key: "puppy", label: "강아지", emoji: "🐶", price: 500, desc: "꼬리 흔드는 가족" },
  { key: "robotVacuum", label: "로봇청소기", emoji: "🤖", price: 800, desc: "알아서 청소해줘요" },
  { key: "artFrame", label: "명화 액자", emoji: "🖼️", price: 1200, desc: "거장의 작품(느낌)" },
];

export function roomItemDef(key: RoomItemKey): RoomItemDef | undefined {
  return ROOM_ITEMS.find((i) => i.key === key);
}

/** 구매 가능 여부 판정 — 사유를 함께 반환(UI 버튼 비활성 사유 표시용) */
export function canBuyRoomItem(
  key: RoomItemKey,
  owned: RoomItemKey[],
  savings: number,
): { ok: boolean; reason?: string } {
  const def = roomItemDef(key);
  if (!def) return { ok: false, reason: "알 수 없는 아이템이에요." };
  if (owned.includes(key)) return { ok: false, reason: "이미 가지고 있어요." };
  if (savings < def.price) return { ok: false, reason: "저축이 부족해요." };
  return { ok: true };
}
