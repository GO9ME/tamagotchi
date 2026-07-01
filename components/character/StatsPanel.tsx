"use client";

import type { Character } from "@/types/character";
import { expProgress } from "@/lib/game/character";
import { ALLOCATABLE_STATS } from "@/lib/game/statPoints";
import { useGameStore } from "@/lib/store/useGameStore";

const STAT_META: { key: keyof Character["stats"]; label: string }[] = [
  { key: "intelligence", label: "지능" },
  { key: "discipline", label: "성실성" },
  { key: "creativity", label: "창의력" },
  { key: "memory", label: "기억력" },
  { key: "academic", label: "학업" },
  { key: "fitness", label: "체력단련" },
  { key: "stamina", label: "지구력" },
  { key: "strength", label: "근력" },
  { key: "communication", label: "소통" },
  { key: "careerPotential", label: "커리어" },
  { key: "employability", label: "취업력" },
  { key: "performance", label: "업무성과" },
];

const ALLOCATABLE_KEYS = new Set(ALLOCATABLE_STATS.map((s) => s.key));

export function StatsPanel({ character }: { character: Character }) {
  const prog = expProgress(character);
  const allocateStat = useGameStore((s) => s.allocateStat);
  const points = character.statPoints;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">성장 스탯</h3>
        <span className="pill bg-sky/50 text-ink">Lv. {character.level}</span>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between font-pixel text-[11px] font-bold text-ink/60">
          <span>경험치</span>
          <span className="tabular-nums">
            {Math.round(prog.current)} / {prog.need}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink/15 bg-black/[0.06]">
          <div
            className="h-full bg-grape transition-all duration-500"
            style={{ width: `${Math.min(100, prog.ratio * 100)}%` }}
          />
        </div>
      </div>

      {points > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border-2 border-butter bg-butter/30 px-3 py-2">
          <span className="font-pixel text-xs font-bold text-ink/80">
            스탯 포인트 {points}개 남음!
          </span>
          <span className="font-pixel text-[10px] text-ink/55">
            아래 스탯의 + 버튼으로 배분해요
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {STAT_META.map((m) => {
          const allocatable = ALLOCATABLE_KEYS.has(m.key);
          return (
            <div
              key={m.key}
              className="flex items-center justify-between rounded-lg border-2 border-ink/10 bg-black/[0.02] px-3 py-2"
            >
              <span className="font-pixel text-[11px] font-bold text-ink/70">
                {m.label}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-pixel text-sm font-bold tabular-nums">
                  {Math.round(character.stats[m.key])}
                </span>
                {allocatable && points > 0 && (
                  <button
                    type="button"
                    onClick={() => allocateStat(m.key)}
                    className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-ink bg-mint font-pixel text-[11px] font-bold text-ink transition-transform active:translate-y-px"
                    aria-label={`${m.label} 스탯 포인트 배분`}
                  >
                    +
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
