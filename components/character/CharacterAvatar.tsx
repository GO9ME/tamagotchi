"use client";

import { useEffect, useRef, useState } from "react";
import type { Character } from "@/types/character";
import { stageLabel } from "@/lib/game/growth";
import { formatMoney } from "@/lib/game/ending";
import { currentHeight } from "@/lib/game/body";
import { DEGREE_LABEL } from "@/lib/game/degree";
import { useGameStore } from "@/lib/store/useGameStore";
import { PixelRoom } from "@/components/game/PixelRoom";
import { PixelCharacter } from "@/components/game/PixelCharacter";
import { CharacterSpeechBubble } from "@/components/game/CharacterSpeechBubble";
import { CharacterStatusIcon } from "@/components/game/CharacterStatusIcon";
import {
  actionStateDurationMs,
  getCharacterVisualState,
  jobTypeFromFamily,
  type ActionState,
} from "@/lib/game/sprite/characterVisualState";

/** 말풍선을 띄울 컨디션 상태 */
const BUBBLE_WARN = new Set(["hungry", "sick", "burned_out", "tired"]);

export function CharacterAvatar({ character }: { character: Character }) {
  const female = character.gender === "female";
  const jobType = jobTypeFromFamily(character.job?.family);

  // 액션 펄스: 버튼을 누르면 잠깐 그 행동 포즈를 취하고, 시간이 지나면 평상시로
  const fx = useGameStore((s) => s.charAction);
  const [live, setLive] = useState<ActionState | null>(null);
  const lastToken = useRef(0);
  useEffect(() => {
    if (!fx || fx.token === lastToken.current) return;
    lastToken.current = fx.token;
    setLive(fx.state);
    const id = setTimeout(() => setLive(null), actionStateDurationMs(fx.state));
    return () => clearTimeout(id);
  }, [fx]);

  // 진행 중인 공부 세션은 펄스가 없을 때도 계속 공부 포즈
  const sessionAction: ActionState | undefined =
    character.activeSession?.actionType === "study" ? "studying" : undefined;
  const actionState = live ?? sessionAction;

  const vs = getCharacterVisualState({
    lifeStage: character.lifeStage,
    mood: character.status.mood,
    hunger: character.status.hunger,
    energy: character.status.energy,
    health: character.status.health,
    burnout: character.status.burnout,
    actionState,
    jobType,
  });

  // 행동 중(펄스)일 땐 경고 말풍선 대신 행동 라벨을 우선
  const showBubble = !!live || BUBBLE_WARN.has(vs.state) || vs.state === "happy";
  const night = vs.pose === "lie";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {showBubble && (
          <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
            <CharacterSpeechBubble
              text={vs.label}
              tone={BUBBLE_WARN.has(vs.state) ? "warn" : "default"}
            />
          </div>
        )}
        <PixelRoom stage={character.lifeStage} night={night} width={250}>
          <PixelCharacter
            lifeStage={character.lifeStage}
            mood={character.status.mood}
            hunger={character.status.hunger}
            energy={character.status.energy}
            health={character.status.health}
            burnout={character.status.burnout}
            actionState={actionState}
            jobType={jobType}
            gender={character.gender}
            size={128}
          />
        </PixelRoom>
      </div>

      <div className="text-center">
        <div className="font-pixel text-lg font-bold">{character.name}</div>
        <div className="mt-0.5 flex items-center justify-center gap-2 font-pixel text-xs text-ink/55">
          <span>
            만 {character.ageYears}살 · {stageLabel(character.lifeStage)}
          </span>
          <CharacterStatusIcon state={vs.state} />
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
