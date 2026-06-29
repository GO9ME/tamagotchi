import type { Character } from "@/types/character";
import { stageLabel } from "@/lib/game/growth";
import { formatMoney } from "@/lib/game/ending";
import { currentHeight } from "@/lib/game/body";
import { DEGREE_LABEL } from "@/lib/game/degree";
import { TamaDevice } from "./TamaDevice";
import { getMood, moodLabel } from "./Mascot";

export function CharacterAvatar({ character }: { character: Character }) {
  const mood = getMood(character.status);
  const female = character.gender === "female";
  return (
    <div className="flex flex-col items-center gap-3">
      <TamaDevice
        colorKey={character.color}
        status={character.status}
        stage={character.lifeStage}
        gender={character.gender}
      />
      <div className="text-center">
        <div className="font-pixel text-lg font-bold">{character.name}</div>
        <div className="font-pixel text-xs text-ink/55">
          만 {character.ageYears}살 · {stageLabel(character.lifeStage)} · {moodLabel(mood)}
        </div>
        <div className="mt-1.5 flex flex-wrap justify-center gap-2">
          <span className={`pill ${female ? "bg-blush/50" : "bg-sky/40"} text-ink/70`}>
            {female ? "♀ 여아" : "♂ 남아"} · {currentHeight(character)}cm
          </span>
          {(character.gradEnroll || character.degree !== "highschool") && (
            <span className="pill bg-grape/20 text-ink/70">
              {character.gradEnroll
                ? `🎓 ${DEGREE_LABEL[character.gradEnroll.degree]}과정`
                : DEGREE_LABEL[character.degree]}
            </span>
          )}
          <span className="pill bg-butter/40 text-ink/70">
            저축 {formatMoney(character.savings)}
          </span>
          <span className="pill bg-blush/40 text-ink/70">행복 {character.happiness}</span>
        </div>
      </div>
    </div>
  );
}
