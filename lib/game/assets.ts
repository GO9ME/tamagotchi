// ---------------------------------------------------------------------------
// assets.ts
// 대형 자산(자동차) — 인생 후반 저축 소비처.
// 티어 업그레이드 방식: 상위 티어 구매 시 이전 자산을 판다고 가정하고
// 차액만 지불한다. 자산 가치는 순자산(엔딩 점수·유산)에 포함된다.
// 주거(월세/전세/매매+대출)는 lib/game/housing.ts 로 분리.
// ---------------------------------------------------------------------------

import type { AssetKey, Character } from "@/types/character";
import { housingEquity } from "./housing";

export type AssetCategory = "car";

export interface AssetDef {
  key: AssetKey;
  category: AssetCategory;
  tier: 1 | 2 | 3;
  label: string;
  emoji: string;
  /** 가격(만원) — 티어 오름차순 */
  price: number;
  desc: string;
}

export const ASSETS: AssetDef[] = [
  { key: "carCompactWagon", category: "car", tier: 1, label: "박스카 왜건", emoji: "🚐", price: 1900, desc: "짐 많이 실리는 든든한 왜건" },
  { key: "carCompact", category: "car", tier: 1, label: "경차", emoji: "🚗", price: 2000, desc: "나의 첫 차" },
  { key: "carCompactCoupe", category: "car", tier: 1, label: "미니 쿠페", emoji: "🚕", price: 2100, desc: "아담하지만 스포티하게" },
  { key: "carHybrid", category: "car", tier: 2, label: "하이브리드 세단", emoji: "🔋", price: 5800, desc: "연비 좋은 하이브리드 세단" },
  { key: "carSedan", category: "car", tier: 2, label: "중형 세단", emoji: "🚙", price: 6000, desc: "묵직한 승차감" },
  { key: "carSuv", category: "car", tier: 2, label: "SUV", emoji: "🛻", price: 6200, desc: "가족과 함께, 넉넉한 SUV" },
  { key: "carImport", category: "car", tier: 3, label: "수입차", emoji: "🏎️", price: 15000, desc: "드디어 드림카" },
  { key: "carImportSuv", category: "car", tier: 3, label: "수입 SUV", emoji: "🚙", price: 16000, desc: "수입 SUV, 가족과 함께 하는 럭셔리" },
  { key: "carSupercar", category: "car", tier: 3, label: "슈퍼카", emoji: "🏁", price: 18000, desc: "레이스가 절로 떠오르는 슈퍼카" },
];

export function assetDef(key: AssetKey): AssetDef | undefined {
  return ASSETS.find((a) => a.key === key);
}

/** 카테고리별 보유 중인 자산 중 최고 티어 항목(실제 소유 키 기준 — 같은 티어에 여러 차종이 있어도 정확) */
function ownedAssetOf(assets: AssetKey[], category: AssetCategory): AssetDef | undefined {
  return ASSETS.filter((a) => a.category === category && assets.includes(a.key)).reduce<
    AssetDef | undefined
  >((best, a) => (!best || a.tier > best.tier ? a : best), undefined);
}

/** 카테고리별 보유 최고 티어(없으면 0) */
export function ownedTier(assets: AssetKey[], category: AssetCategory): number {
  return ownedAssetOf(assets, category)?.tier ?? 0;
}

/** 순자산에 더할 자산 가치 = 카테고리별 실제 소유한 최고 티어 차종의 가격 합(하위 티어는 매각됨) */
export function assetValue(assets: AssetKey[]): number {
  const cats: AssetCategory[] = ["car"];
  return cats.reduce((sum, cat) => sum + (ownedAssetOf(assets, cat)?.price ?? 0), 0);
}

/** 순자산(만원) = 저축 + 자동차 가치 + 주거 순자산(보증금/집값 − 대출) */
export function netWorth(c: Character): number {
  return c.savings + assetValue(c.assets ?? []) + housingEquity(c.housing);
}

/**
 * 구매 판정. 업그레이드는 차액만 지불(이전 티어 매각 가정).
 * 티어를 건너뛰는 구매도 허용하되 항상 "현재 티어 가격과의 차액"이 비용.
 */
export function canBuyAsset(
  key: AssetKey,
  assets: AssetKey[],
  savings: number,
): { ok: boolean; cost: number; reason?: string } {
  const def = assetDef(key);
  if (!def) return { ok: false, cost: 0, reason: "알 수 없는 자산이에요." };
  const currentDef = ownedAssetOf(assets, def.category);
  const current = currentDef?.tier ?? 0;
  if (def.tier <= current) return { ok: false, cost: 0, reason: "이미 보유(또는 상위 보유) 중이에요." };
  const cost = def.price - (currentDef?.price ?? 0);
  if (savings < cost) return { ok: false, cost, reason: "저축이 부족해요." };
  return { ok: true, cost };
}
