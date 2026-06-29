"use client";

import { useState } from "react";
import { X } from "lucide-react";

import type { StatusDelta } from "@/types/action";
import type { Character } from "@/types/character";
import { FOODS } from "@/lib/game/constants";
import { useGameStore } from "@/lib/store/useGameStore";
import { formatDuration } from "@/lib/utils";
import { PixelIcon } from "@/components/pixel/PixelIcon";

function effectHint(status?: StatusDelta): string {
  if (!status) return "";
  const parts: string[] = [];
  if (status.hunger) parts.push(`배고픔 +${status.hunger}`);
  if (status.health) parts.push(`건강 ${status.health > 0 ? "+" : ""}${status.health}`);
  if (status.focus) parts.push(`집중 +${status.focus}`);
  if (status.weight) parts.push(`몸무게 +${status.weight}kg`);
  return parts.join(" · ");
}

export function FoodSelector({
  character,
  now,
}: {
  character: Character;
  now: number;
}) {
  const [open, setOpen] = useState(false);
  const feed = useGameStore((s) => s.feed);

  const readyAt = character.cooldowns["feed"] ?? 0;
  const remaining = Math.max(0, readyAt - now);
  const onCooldown = remaining > 0;

  return (
    <>
      <button
        type="button"
        disabled={onCooldown}
        onClick={() => setOpen(true)}
        className="toy-btn relative flex w-full items-center gap-3 bg-blush/40 text-left disabled:opacity-60"
      >
        <span className="text-ink">
          <PixelIcon name="feed" size={26} />
        </span>
        <span className="flex-1">
          <span className="block text-base font-bold">밥 먹이기</span>
          <span className="block font-sans text-[11px] font-medium text-ink/55">
            {onCooldown
              ? `${formatDuration(remaining)} 후에 다시 줄 수 있어요`
              : "음식을 골라 배고픔을 채워요"}
          </span>
        </span>
        {onCooldown && (
          <span className="pill bg-black/10 text-ink/70 tabular-nums">
            {formatDuration(remaining)}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-pixel text-lg font-bold">무엇을 먹일까?</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 hover:bg-black/5"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {FOODS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    feed(f.key);
                    setOpen(false);
                  }}
                  className="toy-btn flex flex-col items-start gap-1 bg-white"
                >
                  <span className="text-ink">
                    <PixelIcon name={f.key} size={24} />
                  </span>
                  <span className="text-sm font-bold">{f.label}</span>
                  <span className="font-sans text-[10px] font-medium leading-tight text-ink/55">
                    {effectHint(f.effect.status)}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center font-sans text-[11px] text-ink/45">
              배부른 상태에서 또 먹이면 과식으로 살이 더 쪄요.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
