"use client";

// 방 꾸미기 상점 — 저축(만원)으로 가구/장식을 사서 방에 영구 배치한다.
// 저축의 소비처(경제 루프의 출구) 역할. 산 아이템은 캐릭터 방에 바로 나타난다.

import type { Character } from "@/types/character";
import { cn } from "@/lib/utils";
import { ROOM_ITEMS } from "@/lib/game/roomItems";
import { formatMoney } from "@/lib/game/ending";
import { CollapsibleCard } from "@/components/common/CollapsibleCard";
import { GachaPullButton } from "@/components/common/GachaPullButton";

export function RoomShopPanel({ character }: { character: Character }) {
  const ownedCount = character.roomItems.length;

  return (
    <CollapsibleCard
      title="방 꾸미기"
      badge={
        <span className="pill bg-butter/40 text-ink/70">
          저축 {formatMoney(character.savings)}
        </span>
      }
    >
      <p className="mb-3 text-xs text-ink/55">
        인테리어 뽑기로 가구를 얻으면 방에 바로 놓여요. ({ownedCount}/{ROOM_ITEMS.length} 보유)
      </p>
      <GachaPullButton character={character} category="room" />

      <ul className="flex flex-col gap-1.5">
        {ROOM_ITEMS.map((item) => {
          const owned = character.roomItems.includes(item.key);
          return (
            <li
              key={item.key}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl px-3 py-2",
                owned ? "bg-mint/20" : "bg-black/[0.03]",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-base leading-none">{item.emoji}</span>
                <div className="min-w-0">
                  <div className="font-pixel text-[11px] font-bold text-ink/80">
                    {item.label}
                  </div>
                  <div className="truncate text-[11px] text-ink/50">{item.desc}</div>
                </div>
              </div>
              {owned ? (
                <span className="pill shrink-0 bg-mint text-ink">보유 중</span>
              ) : (
                <span className="pill shrink-0 bg-black/10 text-ink/45">
                  미소장 · 정가 {formatMoney(item.price)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </CollapsibleCard>
  );
}
