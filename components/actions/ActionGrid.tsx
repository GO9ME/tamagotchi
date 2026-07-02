"use client";

import type { Character } from "@/types/character";
import { ACTIONS, PREP_KEYS, WORK_KEYS } from "@/lib/game/actions";
import { formatEffect } from "@/lib/game/effectLabel";
import { isActionUnlocked, unlockStageLabel } from "@/lib/game/gating";
import { useGameStore } from "@/lib/store/useGameStore";
import { CooldownButton } from "./CooldownButton";

const ACCENT: Record<string, string> = {
  care: "bg-blush/40",
  study: "bg-sky/40",
  fitness: "bg-mint/50",
  selfdev: "bg-grape/40",
  fun: "bg-butter/60",
  rest: "bg-sky/30",
};

export function ActionGrid({
  character,
  now,
}: {
  character: Character;
  now: number;
}) {
  const doAction = useGameStore((s) => s.doAction);

  // feed/study/취업준비(prep) 는 전용 UI 에서 처리하므로 일반 즉시형 액션만 노출
  const instant = ACTIONS.filter(
    (a) =>
      a.kind === "instant" && !PREP_KEYS.has(a.key) && !WORK_KEYS.has(a.key),
  );

  return (
    <div className="card p-4">
      <h3 className="mb-3 font-pixel text-sm font-bold text-ink/80">돌봄 · 활동</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {instant.map((a) => {
          const locked = !isActionUnlocked(a.key, character.lifeStage);
          return (
            <CooldownButton
              key={a.key}
              icon={a.key}
              label={a.label}
              desc={a.desc}
              effects={
                a.effect
                  ? formatEffect(a.effect(character), { exp: false })
                  : undefined
              }
              now={now}
              readyAt={character.cooldowns[a.key] ?? 0}
              accent={ACCENT[a.category] ?? "bg-white"}
              locked={locked}
              lockLabel={unlockStageLabel(a.key)}
              onClick={() => doAction(a.key)}
            />
          );
        })}
      </div>
      <p className="mt-2 font-sans text-[11px] font-medium text-ink/45">
        표시된 수치는 기본 효과예요. 컨디션에 따라 대성공(↑)·부진(↓)으로 달라져요.
      </p>
    </div>
  );
}
