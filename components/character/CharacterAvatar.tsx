import type { Character } from "@/types/character";
import { stageLabel } from "@/lib/game/growth";
import { TamaDevice } from "./TamaDevice";
import { getMood, moodLabel } from "./Mascot";

export function CharacterAvatar({ character }: { character: Character }) {
  const mood = getMood(character.status);
  return (
    <div className="flex flex-col items-center gap-3">
      <TamaDevice colorKey={character.color} status={character.status} />
      <div className="text-center">
        <div className="font-pixel text-lg font-bold">{character.name}</div>
        <div className="font-pixel text-xs text-ink/55">
          만 {character.ageYears}살 · {stageLabel(character.lifeStage)} · {moodLabel(mood)}
        </div>
      </div>
    </div>
  );
}
