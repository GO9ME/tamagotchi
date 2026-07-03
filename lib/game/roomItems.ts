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
  { key: "candleSet", label: "캔들 세트", emoji: "🕯️", price: 40, desc: "은은한 향과 조명" },
  { key: "rug", label: "러그", emoji: "🟫", price: 50, desc: "방 한가운데 포근한 러그" },
  { key: "poster", label: "우주 포스터", emoji: "🪐", price: 60, desc: "벽에 붙인 낭만 한 장" },
  { key: "succulents", label: "다육식물 화분", emoji: "🌵", price: 70, desc: "손 안 가는 초록이" },
  { key: "lamp", label: "스탠드 조명", emoji: "💡", price: 80, desc: "아늑한 코너 조명" },
  { key: "bookshelf", label: "미니 책장", emoji: "📚", price: 90, desc: "책 좀 읽는 사람 컨셉" },
  { key: "bigPlant", label: "대형 화분", emoji: "🪴", price: 100, desc: "침대 옆 초록 식물" },
  { key: "moodLamp", label: "무드등", emoji: "🌙", price: 110, desc: "밤엔 은은하게" },
  { key: "curtain", label: "커튼", emoji: "🪟", price: 120, desc: "창문 양옆 커튼" },
  { key: "teddyBear", label: "곰인형", emoji: "🧸", price: 130, desc: "포근한 방 친구" },
  { key: "fishbowl", label: "어항", emoji: "🐟", price: 150, desc: "물고기 한 마리" },
  { key: "dartboard", label: "다트보드", emoji: "🎯", price: 160, desc: "벽에 거는 승부욕" },
  { key: "console", label: "게임기", emoji: "🎮", price: 200, desc: "작은 TV + 게임기" },
  { key: "turntable", label: "턴테이블", emoji: "📻", price: 250, desc: "아날로그 감성 가득" },
  { key: "vanity", label: "화장대", emoji: "🪞", price: 260, desc: "거울 앞에서 꾸미는 시간" },
  { key: "sofa", label: "소파", emoji: "🛋️", price: 300, desc: "푹 꺼지는 1인용 소파" },
  { key: "miniFridge", label: "미니 냉장고", emoji: "🧊", price: 350, desc: "방에서 시원한 음료 한 잔" },
  { key: "wallTv", label: "벽걸이 TV", emoji: "📺", price: 400, desc: "벽에 딱 붙는 대화면" },
  { key: "airConditioner", label: "에어컨", emoji: "🌬️", price: 450, desc: "여름 나기의 필수템" },
  { key: "puppy", label: "강아지", emoji: "🐶", price: 500, desc: "꼬리 흔드는 가족" },
  { key: "catTower", label: "캣타워", emoji: "🐈", price: 600, desc: "고양이 전용 전망대" },
  { key: "massageChair", label: "안마의자", emoji: "💺", price: 700, desc: "퇴근 후 완벽한 휴식" },
  { key: "robotVacuum", label: "로봇청소기", emoji: "🤖", price: 800, desc: "알아서 청소해줘요" },
  { key: "bigAquarium", label: "대형 수족관", emoji: "🐠", price: 900, desc: "물고기 여러 마리가 사는 방" },
  { key: "chandelier", label: "샹들리에", emoji: "✨", price: 1000, desc: "천장에서 쏟아지는 럭셔리" },
  { key: "homeTheater", label: "홈시어터", emoji: "🎬", price: 1100, desc: "극장이 부럽지 않은 사운드" },
  { key: "artFrame", label: "명화 액자", emoji: "🖼️", price: 1200, desc: "거장의 작품(느낌)" },
  { key: "grandPiano", label: "그랜드 피아노", emoji: "🎹", price: 1400, desc: "방 안의 콘서트홀" },
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
