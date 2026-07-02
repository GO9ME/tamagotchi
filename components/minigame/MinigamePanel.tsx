"use client";

import type { Character } from "@/types/character";
import {
  LUCK_CAP,
  MINIGAME_ENERGY_COST,
  MINIGAME_MIN_AGE,
  type MinigameKind,
} from "@/lib/game/minigame";
import { useGameStore } from "@/lib/store/useGameStore";

const GAMES: { kind: MinigameKind; emoji: string; label: string; desc: string }[] = [
  {
    kind: "slots",
    emoji: "🎰",
    label: "슬롯머신",
    desc: "7️⃣7️⃣7️⃣ 잭팟을 노려요 · 당첨금은 저축으로",
  },
  {
    kind: "gacha",
    emoji: "🎁",
    label: "행운 뽑기",
    desc: "랜덤 캡슐 · 희귀 캡슐엔 스탯 포인트",
  },
];

export function MinigamePanel({ character }: { character: Character }) {
  const playMinigame = useGameStore((s) => s.playMinigame);
  // 미취학 아동에겐 숨김(도박 콘텐츠) — 실제 게이트는 canPlayMinigame 에도 있음
  if (character.ageYears < MINIGAME_MIN_AGE) return null;
  const lacking = character.status.energy < MINIGAME_ENERGY_COST;
  const luckMaxed = character.stats.luck >= LUCK_CAP;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">미니게임</h3>
        <span className="pill bg-butter/60 text-ink">
          🍀 행운 {luckMaxed ? "MAX" : Math.round(character.stats.luck)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {GAMES.map((g) => (
          <button
            key={g.kind}
            type="button"
            disabled={lacking}
            onClick={() => playMinigame(g.kind)}
            className="toy-btn flex min-h-[68px] w-full flex-col items-start gap-1 bg-grape/30 text-left disabled:opacity-50"
          >
            <span className="text-lg leading-none">{g.emoji}</span>
            <span className="text-sm font-bold">{g.label}</span>
            <span className="font-sans text-[11px] font-medium leading-tight text-ink/55">
              {g.desc}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 font-sans text-[11px] font-medium text-ink/50">
        {lacking
          ? `체력이 부족해요. (체력 ${MINIGAME_ENERGY_COST} 필요)`
          : `쿨타임 없음 · 1회당 체력 -${MINIGAME_ENERGY_COST}${luckMaxed ? " · 행운이 최대예요!" : " · 플레이할수록 행운이 쌓여요"}`}
      </p>
    </div>
  );
}
