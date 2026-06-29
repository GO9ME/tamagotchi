import type { Character } from "@/types/character";
import { expProgress } from "@/lib/game/character";

const STAT_META: { key: keyof Character["stats"]; label: string; emoji: string }[] = [
  { key: "intelligence", label: "지능", emoji: "🧠" },
  { key: "discipline", label: "성실성", emoji: "📐" },
  { key: "creativity", label: "창의력", emoji: "🎨" },
  { key: "memory", label: "기억력", emoji: "🔖" },
  { key: "fitness", label: "체력단련", emoji: "💪" },
  { key: "communication", label: "소통", emoji: "🗣️" },
  { key: "careerPotential", label: "커리어", emoji: "📈" },
  { key: "employability", label: "취업력", emoji: "💼" },
];

export function StatsPanel({ character }: { character: Character }) {
  const prog = expProgress(character);
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-ink/80">성장 스탯</h3>
        <span className="pill bg-sky/40 text-ink">Lv. {character.level}</span>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs font-semibold text-ink/60">
          <span>경험치</span>
          <span className="tabular-nums">
            {Math.round(prog.current)} / {prog.need}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-grape transition-all duration-500"
            style={{ width: `${Math.min(100, prog.ratio * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
        {STAT_META.map((m) => (
          <div
            key={m.key}
            className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2"
          >
            <span className="text-xs font-semibold text-ink/70">
              {m.emoji} {m.label}
            </span>
            <span className="text-sm font-extrabold tabular-nums">
              {Math.round(character.stats[m.key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
