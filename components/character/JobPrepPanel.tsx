import type { Character } from "@/types/character";
import { StatBar } from "@/components/common/StatBar";
import { employmentBreakdown, employmentScore } from "@/lib/game/employment";

export function JobPrepPanel({ character }: { character: Character }) {
  const score = employmentScore(character);
  const items = employmentBreakdown(character);
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">취업 준비도</h3>
        <span className="pill bg-grape/40 text-ink">{score}점</span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        {items.map((it) => (
          <StatBar key={it.label} label={it.label} value={it.value} />
        ))}
      </div>
      <p className="mt-3 font-sans text-[11px] text-ink/50">
        준비도가 높을수록 합격 확률과 시작 직급(초봉)이 올라가요.
      </p>
    </div>
  );
}
