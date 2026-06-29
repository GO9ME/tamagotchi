import type { Character } from "@/types/character";
import { stageEmoji, stageLabel } from "@/lib/game/growth";

function moodFace(c: Character): { face: string; mood: string } {
  const { hunger, energy, mood, health, stress } = c.status;
  if (health < 25) return { face: "🤒", mood: "아파요" };
  if (hunger < 20) return { face: "😣", mood: "배고파요" };
  if (energy < 20) return { face: "🥱", mood: "지쳤어요" };
  if (stress > 80) return { face: "😵", mood: "스트레스 폭발" };
  if (mood > 70) return { face: "😄", mood: "기분 최고" };
  if (mood < 30) return { face: "😢", mood: "시무룩" };
  return { face: "🙂", mood: "평온해요" };
}

export function CharacterAvatar({ character }: { character: Character }) {
  const { face, mood } = moodFace(character);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-b from-white to-blush/40 shadow-toy">
        <span className="animate-bob text-[5.5rem] leading-none drop-shadow-sm">
          {character.avatar}
        </span>
        <span className="absolute -right-1 bottom-3 text-3xl">{face}</span>
        <span className="pill absolute -top-2 bg-grape/30 text-ink">
          {stageEmoji(character.lifeStage)} {stageLabel(character.lifeStage)}
        </span>
      </div>
      <div className="text-center">
        <div className="text-xl font-extrabold">{character.name}</div>
        <div className="text-sm text-ink/60">
          만 {character.ageYears}살 · {mood}
        </div>
      </div>
    </div>
  );
}
