"use client";

// 대형 자산(자동차) 패널 — 인생 후반 저축 소비처.
// 티어 업그레이드 방식: 상위 티어는 차액만 지불(이전 자산 매각 가정).
// 자산 가치는 순자산으로 엔딩 점수·부자 판정·2세대 유산에 반영된다.
// 주거(월세/전세/매매+대출)는 HousingPanel 로 분리.

import type { Character } from "@/types/character";
import { cn } from "@/lib/utils";
import { ASSETS, assetValue, canBuyAsset, ownedTier, type AssetCategory } from "@/lib/game/assets";
import { formatMoney } from "@/lib/game/ending";
import { useGameStore } from "@/lib/store/useGameStore";

const CATEGORY_LABEL: Record<AssetCategory, string> = { car: "자동차" };

export function AssetPanel({ character }: { character: Character }) {
  const buyAsset = useGameStore((s) => s.buyAsset);
  const totalValue = assetValue(character.assets);

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">자동차</h3>
        {totalValue > 0 && (
          <span className="pill bg-grape/20 text-ink/70">자산 {formatMoney(totalValue)}</span>
        )}
      </div>
      <p className="mb-3 text-xs text-ink/55">
        차는 순자산으로 남아 엔딩 점수와 2세대 유산에 반영돼요. 업그레이드는 차액만 내요.
      </p>

      {(["car"] as AssetCategory[]).map((cat) => {
        const tiers = ASSETS.filter((a) => a.category === cat);
        const current = ownedTier(character.assets, cat);
        return (
          <div key={cat} className="mb-2 last:mb-0">
            <div className="mb-1 font-pixel text-[11px] font-bold text-ink/60">
              {CATEGORY_LABEL[cat]}
            </div>
            <ul className="flex flex-col gap-1.5">
              {tiers.map((a) => {
                const owned = a.tier <= current;
                const isCurrent = a.tier === current;
                const gate = canBuyAsset(a.key, character.assets, character.savings);
                return (
                  <li
                    key={a.key}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl px-3 py-2",
                      isCurrent ? "bg-grape/15" : owned ? "bg-black/[0.02]" : "bg-black/[0.03]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{a.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-pixel text-[11px] font-bold text-ink/80">
                          {a.label}
                        </div>
                        <div className="truncate text-[11px] text-ink/50">{a.desc}</div>
                        {!owned && !gate.ok && gate.cost > 0 && (
                          <div className="font-pixel text-[10px] font-bold text-coral">
                            {formatMoney(gate.cost - character.savings)} 부족
                          </div>
                        )}
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="pill shrink-0 bg-grape/40 text-ink">보유 중</span>
                    ) : owned ? (
                      <span className="pill shrink-0 bg-black/10 text-ink/40">매각함</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => buyAsset(a.key)}
                        disabled={!gate.ok}
                        className={cn(
                          "pill shrink-0 font-bold transition-colors",
                          gate.ok
                            ? "bg-grape text-white hover:brightness-105"
                            : "cursor-not-allowed bg-black/10 text-ink/40",
                        )}
                      >
                        {formatMoney(gate.cost)}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
