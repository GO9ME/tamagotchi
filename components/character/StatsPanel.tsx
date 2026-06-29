import type { Character } from "@/types/character";
import { expProgress } from "@/lib/game/character";

const STAT_META: { key: keyof Character["stats"]; label: string }[] = [
  { key: "intelligence", label: "지능" },
  { key: "discipline", label: "성실성" },
  { key: "creativity", label: "창의력" },
  { key: "memory", label: "기억력" },
  { key: "academic", label: "학업" },
  { key: "fitness", label: "체력단련" },
  { key: "communication", label: "소통" },
  { key: "careerPotential", label: "커리어" },
  { key: "employability", label: "취업력" },
];

export function StatsPanel({ character }: { character: Character }) {
  const prog = expProgress(character);
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {STAT_META.map((m) => (
          <div
            key={m.key}
            className="flex items-center justify-between rounded-lg border-2 border-ink/10 bg-black/[0.02] px-3 py-2"
          >
            <span className="font-pixel text-[11px] font-bold text-ink/70">
              {m.label}
            </span>
            <span className="font-pixel text-sm font-bold tabular-nums">
              {Math.round(character.stats[m.key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
