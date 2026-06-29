import type { Character } from "@/types/character";
import { StatBar } from "@/components/common/StatBar";

export function StatusPanel({ character }: { character: Character }) {
  const s = character.status;
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-pixel text-sm font-bold text-ink/80">컨디션</h3>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <StatBar label="배고픔" value={s.hunger} />
        <StatBar label="체력" value={s.energy} />
        <StatBar label="기분" value={s.mood} />
        <StatBar label="건강" value={s.health} />
        <StatBar label="집중력" value={s.focus} />
        <StatBar label="청결" value={s.cleanliness} />
        <StatBar label="수면 질" value={s.sleepQuality} />
        <StatBar label="자신감" value={s.confidence} />
        <StatBar label="스트레스" value={s.stress} higherIsBetter={false} />
        <StatBar label="번아웃" value={s.burnout} higherIsBetter={false} />
      </div>
    </div>
  );
}
