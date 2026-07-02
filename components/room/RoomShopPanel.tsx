"use client";

// 방 꾸미기 상점 — 저축(만원)으로 가구/장식을 사서 방에 영구 배치한다.
// 저축의 소비처(경제 루프의 출구) 역할. 산 아이템은 캐릭터 방에 바로 나타난다.

import type { Character } from "@/types/character";
import { cn } from "@/lib/utils";
import { ROOM_ITEMS, canBuyRoomItem } from "@/lib/game/roomItems";
import { formatMoney } from "@/lib/game/ending";
import { useGameStore } from "@/lib/store/useGameStore";

export function RoomShopPanel({ character }: { character: Character }) {
  const buyRoomItem = useGameStore((s) => s.buyRoomItem);
  const ownedCount = character.roomItems.length;

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">방 꾸미기</h3>
        <span className="pill bg-butter/40 text-ink/70">
          저축 {formatMoney(character.savings)}
        </span>
      </div>
      <p className="mb-3 text-xs text-ink/55">
        저축으로 가구를 사면 방에 바로 놓여요. ({ownedCount}/{ROOM_ITEMS.length} 보유)
      </p>

      <ul className="flex flex-col gap-1.5">
        {ROOM_ITEMS.map((item) => {
          const owned = character.roomItems.includes(item.key);
          const gate = canBuyRoomItem(item.key, character.roomItems, character.savings);
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
                  {/* 구매 불가 사유를 인라인으로 — 모바일엔 hover 툴팁이 없다 */}
                  {!owned && !gate.ok && (
                    <div className="font-pixel text-[10px] font-bold text-coral">
                      {character.savings < item.price
                        ? `${formatMoney(item.price - character.savings)} 부족`
                        : gate.reason}
                    </div>
                  )}
                </div>
              </div>
              {owned ? (
                <span className="pill shrink-0 bg-mint text-ink">보유 중</span>
              ) : (
                <button
                  type="button"
                  onClick={() => buyRoomItem(item.key)}
                  disabled={!gate.ok}
                  className={cn(
                    "pill shrink-0 font-bold transition-colors",
                    gate.ok
                      ? "bg-coral text-white hover:brightness-105"
                      : "cursor-not-allowed bg-black/10 text-ink/40",
                  )}
                >
                  {formatMoney(item.price)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
