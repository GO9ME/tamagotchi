import type { Character } from "@/types/character";
import { StatBar } from "@/components/common/StatBar";

export function StatusPanel({ character }: { character: Character }) {
  const s = character.status;
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-extrabold text-ink/80">컨디션</h3>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <StatBar label="배고픔" emoji="🍙" value={s.hunger} />
        <StatBar label="체력" emoji="⚡" value={s.energy} />
        <StatBar label="기분" emoji="💗" value={s.mood} />
        <StatBar label="건강" emoji="🩺" value={s.health} />
        <StatBar label="집중력" emoji="🎯" value={s.focus} />
        <StatBar label="청결" emoji="🧼" value={s.cleanliness} />
        <StatBar label="수면 질" emoji="🌙" value={s.sleepQuality} />
        <StatBar label="자신감" emoji="✨" value={s.confidence} />
        <StatBar label="스트레스" emoji="🔥" value={s.stress} higherIsBetter={false} />
        <StatBar label="번아웃" emoji="🥵" value={s.burnout} higherIsBetter={false} />
      </div>
    </div>
  );
}
