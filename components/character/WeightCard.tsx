import type { Character } from "@/types/character";
import { cn } from "@/lib/utils";
import {
  healthyRangeForAge,
  weightVerdict,
  weightVerdictLabel,
} from "@/lib/game/weight";

export function WeightCard({ character }: { character: Character }) {
  const w = character.status.weight;
  const [lo, hi] = healthyRangeForAge(character.ageYears);
  const v = weightVerdict(w, character.ageYears);

  // 게이지 표현: 적정 범위를 살짝 넘는 구간까지 표시
  const min = Math.max(0, lo - 10);
  const max = hi + 15;
  const pct = ((w - min) / (max - min)) * 100;
  const loPct = ((lo - min) / (max - min)) * 100;
  const hiPct = ((hi - min) / (max - min)) * 100;

  const verdictColor =
    v === "healthy" ? "bg-mint text-ink" : v === "high" ? "bg-coral text-white" : "bg-sky text-ink";

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-ink/80">몸무게</h3>
        <span className={cn("pill", verdictColor)}>{weightVerdictLabel(v)}</span>
      </div>
      <div className="mb-2 flex items-end gap-2">
        <span className="text-3xl font-extrabold tabular-nums">{w.toFixed(1)}</span>
        <span className="mb-1 text-sm text-ink/60">kg</span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-black/10">
        {/* 적정 범위 표시 */}
        <div
          className="absolute top-0 h-full rounded-full bg-mint/50"
          style={{ left: `${loPct}%`, width: `${Math.max(0, hiPct - loPct)}%` }}
        />
        {/* 현재 위치 */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow"
          style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink/55">
        적정 범위 {lo}~{hi}kg · 운동하면 감소, 과식하면 증가해요.
      </p>
    </div>
  );
}
