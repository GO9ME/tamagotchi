// ---------------------------------------------------------------------------
// wardrobe.ts
// 옷장 — 옷/액세서리를 사서 소장하고, 입히면 픽셀 스프라이트 복장이 실제로 바뀐다.
//   의상(outfit): 성장 단계 기본 복장(교복/후드/정장)을 대체. 직업 악센트보다 우선.
//   액세서리(accessory): 모자/목도리 등을 복장과 별개로 1개 덧착용.
// 여가 "옷 쇼핑"(반복 기분전환)과 달리 1회 구매·영구 소장·자유 착탈.
// ---------------------------------------------------------------------------

import type { Character, WardrobeItemKey } from "@/types/character";

export type WardrobeKind = "outfit" | "accessory";

export interface WardrobeDef {
  key: WardrobeItemKey;
  kind: WardrobeKind;
  label: string;
  emoji: string;
  /** 가격(만원) */
  price: number;
  /** 구매 가능 나이(스프라이트가 tiny(아기)를 벗어나는 시기 이후로 설정) */
  minAge: number;
  desc: string;
}

/** kind별 가격 오름차순 — 실제 물가 기준(만원) */
export const WARDROBE_ITEMS: WardrobeDef[] = [
  { key: "stripeTee", kind: "outfit", label: "줄무늬 티", emoji: "👕", price: 2, minAge: 8, desc: "만만하게 손이 가는 데일리룩" },
  { key: "overalls", kind: "outfit", label: "멜빵바지", emoji: "👖", price: 4, minAge: 8, desc: "편하게 뛰어놀기 좋은 멜빵바지" },
  { key: "training", kind: "outfit", label: "트레이닝복", emoji: "🎽", price: 5, minAge: 8, desc: "운동할 맛 나는 셋업" },
  { key: "hoodie", kind: "outfit", label: "후드티", emoji: "🧥", price: 6, minAge: 8, desc: "편안함의 정점" },
  { key: "swimsuit", kind: "outfit", label: "수영복", emoji: "🏖️", price: 6, minAge: 8, desc: "여름은 물놀이의 계절" },
  { key: "baseballUniform", kind: "outfit", label: "야구 유니폼", emoji: "⚾", price: 7, minAge: 8, desc: "오늘의 포지션은 해피니스" },
  { key: "dress", kind: "outfit", label: "원피스", emoji: "👗", price: 8, minAge: 8, desc: "빙글 돌면 살랑, 나들이룩" },
  { key: "knitCardigan", kind: "outfit", label: "니트 가디건", emoji: "🪢", price: 9, minAge: 8, desc: "가을엔 역시 가디건 하나" },
  { key: "denimSet", kind: "outfit", label: "청청 세트", emoji: "🪡", price: 11, minAge: 13, desc: "청바지엔 청재킷이 국룰" },
  { key: "jacket", kind: "outfit", label: "집업 재킷", emoji: "🧷", price: 12, minAge: 13, desc: "각 잡힌 어깨 라인" },
  { key: "padding", kind: "outfit", label: "패딩 점퍼", emoji: "❄️", price: 15, minAge: 8, desc: "한겨울에도 뽀송뽀송" },
  { key: "trenchCoat", kind: "outfit", label: "트렌치코트", emoji: "🌂", price: 18, minAge: 13, desc: "비 오는 날엔 트렌치코트" },
  { key: "hanbok", kind: "outfit", label: "한복", emoji: "👘", price: 20, minAge: 8, desc: "명절엔 역시 한복이죠" },
  { key: "leather", kind: "outfit", label: "가죽 재킷", emoji: "🖤", price: 25, minAge: 17, desc: "락스피릿 충전" },
  { key: "suit", kind: "outfit", label: "정장", emoji: "🤵", price: 40, minAge: 17, desc: "중요한 날의 승부복" },
  { key: "tuxedo", kind: "outfit", label: "턱시도", emoji: "🎩", price: 45, minAge: 20, desc: "포멀의 정점, 턱시도" },
  { key: "ribbon", kind: "accessory", label: "리본핀", emoji: "🎀", price: 1, minAge: 4, desc: "머리에 포인트 하나" },
  { key: "hairpin", kind: "accessory", label: "헤어핀 세트", emoji: "📎", price: 1, minAge: 4, desc: "포인트 살리는 헤어핀" },
  { key: "beanie", kind: "accessory", label: "비니", emoji: "🧶", price: 2, minAge: 8, desc: "겨울 필수템" },
  { key: "cap", kind: "accessory", label: "캡모자", emoji: "🧢", price: 3, minAge: 8, desc: "눌러쓰면 스트릿 무드" },
  { key: "gloves", kind: "accessory", label: "장갑", emoji: "🧤", price: 3, minAge: 8, desc: "손끝까지 따뜻하게" },
  { key: "scarf", kind: "accessory", label: "목도리", emoji: "🧣", price: 4, minAge: 8, desc: "포근하게 목을 감싸요" },
  { key: "bowtie", kind: "accessory", label: "나비넥타이", emoji: "🎗️", price: 4, minAge: 8, desc: "포멀한 자리엔 나비넥타이" },
  { key: "sunglasses", kind: "accessory", label: "선글라스", emoji: "🕶️", price: 5, minAge: 8, desc: "간지 +100" },
  { key: "headphones", kind: "accessory", label: "헤드폰", emoji: "🎧", price: 7, minAge: 8, desc: "음악과 함께라면" },
  { key: "backpack", kind: "accessory", label: "백팩", emoji: "🎒", price: 8, minAge: 8, desc: "책이며 간식이며 다 들어가요" },
  { key: "watch", kind: "accessory", label: "손목시계", emoji: "⌚", price: 9, minAge: 13, desc: "시간도 스타일도 놓치지 않기" },
  { key: "necklace", kind: "accessory", label: "목걸이", emoji: "📿", price: 10, minAge: 13, desc: "은은한 반짝임 포인트" },
  { key: "earrings", kind: "accessory", label: "귀걸이", emoji: "💎", price: 12, minAge: 13, desc: "반짝이는 포인트 하나 더" },
  { key: "brooch", kind: "accessory", label: "브로치", emoji: "🌸", price: 15, minAge: 17, desc: "옷깃에 다는 작은 사치" },
  { key: "anklet", kind: "accessory", label: "발찌", emoji: "⛓️", price: 20, minAge: 17, desc: "은근하게 반짝이는 발목" },
  { key: "crown", kind: "accessory", label: "왕관", emoji: "👑", price: 50, minAge: 4, desc: "오늘의 주인공은 나야 나" },
];

export function wardrobeDef(key: WardrobeItemKey): WardrobeDef | undefined {
  return WARDROBE_ITEMS.find((w) => w.key === key);
}

/** 스프라이트 렌더러에 넘기는 착용 상태 */
export interface EquippedWardrobe {
  outfit?: WardrobeItemKey | null;
  accessory?: WardrobeItemKey | null;
}

export function equippedOf(c: Character): EquippedWardrobe {
  return { outfit: c.equippedOutfit ?? null, accessory: c.equippedAccessory ?? null };
}

/** 구매 판정 — 사유 포함(UI 표시용) */
export function canBuyWardrobe(
  c: Character,
  key: WardrobeItemKey,
): { ok: boolean; reason?: string } {
  const def = wardrobeDef(key);
  if (!def) return { ok: false, reason: "알 수 없는 아이템이에요." };
  if (c.wardrobe.includes(key)) return { ok: false, reason: "이미 가지고 있어요." };
  if (c.ageYears < def.minAge) return { ok: false, reason: `${def.minAge}살부터 살 수 있어요.` };
  if (c.savings < def.price) return { ok: false, reason: "저축이 부족해요." };
  return { ok: true };
}
