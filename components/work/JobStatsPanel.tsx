import type { Character, CharacterStats } from "@/types/character";
import { StatBar } from "@/components/common/StatBar";
import { JOB_FAMILIES } from "@/lib/game/jobs";
import { workPerformance } from "@/lib/game/work";

const STAT_LABEL: Partial<Record<keyof CharacterStats, string>> = {
  intelligence: "지능",
  discipline: "성실성",
  creativity: "창의력",
  memory: "기억력",
  communication: "소통",
  careerPotential: "커리어",
  fitness: "체력",
};

export function JobStatsPanel({ character }: { character: Character }) {
  if (!character.job) return null;
  const fam = JOB_FAMILIES[character.job.family];
  const wp = workPerformance(character, 0.5); // 표시용 고정 rand

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">
          직무 역량 · {fam.label}
        </h3>
        <span className="pill bg-grape/40 text-ink">성과 {wp}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        {fam.coreStats.map((k) => (
          <StatBar
            key={k}
            label={STAT_LABEL[k] ?? k}
            value={Math.min(100, character.stats[k])}
          />
        ))}
        <StatBar label="업무성과" value={Math.min(100, character.stats.performance)} />
      </div>
    </div>
  );
}
