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

/** kind별 가격 오름차순 */
export const WARDROBE_ITEMS: WardrobeDef[] = [
  { key: "stripeTee", kind: "outfit", label: "줄무늬 티", emoji: "👕", price: 30, minAge: 8, desc: "만만하게 손이 가는 데일리룩" },
  { key: "hoodie", kind: "outfit", label: "후드티", emoji: "🧥", price: 80, minAge: 8, desc: "편안함의 정점" },
  { key: "jacket", kind: "outfit", label: "집업 재킷", emoji: "🧷", price: 150, minAge: 13, desc: "각 잡힌 어깨 라인" },
  { key: "suit", kind: "outfit", label: "정장", emoji: "🤵", price: 300, minAge: 17, desc: "중요한 날의 승부복" },
  { key: "ribbon", kind: "accessory", label: "리본핀", emoji: "🎀", price: 20, minAge: 4, desc: "머리에 포인트 하나" },
  { key: "cap", kind: "accessory", label: "캡모자", emoji: "🧢", price: 60, minAge: 8, desc: "눌러쓰면 스트릿 무드" },
  { key: "beanie", kind: "accessory", label: "비니", emoji: "🧶", price: 60, minAge: 8, desc: "겨울 필수템" },
  { key: "scarf", kind: "accessory", label: "목도리", emoji: "🧣", price: 90, minAge: 8, desc: "포근하게 목을 감싸요" },
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
