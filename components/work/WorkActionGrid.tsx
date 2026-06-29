"use client";

import type { Character } from "@/types/character";
import { ACTIONS, WORK_KEYS } from "@/lib/game/actions";
import { useGameStore } from "@/lib/store/useGameStore";
import { CooldownButton } from "@/components/actions/CooldownButton";

const WORK_ICON: Record<string, string> = {
  focusWork: "bolt",
  writeDoc: "resume",
  meeting: "speech",
  handleIssue: "star",
  workSelfDev: "selfDev",
  overtime: "briefcase",
  workRest: "sleep",
};

const ACCENT: Record<string, string> = {
  overtime: "bg-coral/30",
  workRest: "bg-mint/40",
};

const WORK_ACTIONS = ACTIONS.filter((a) => WORK_KEYS.has(a.key));

export function WorkActionGrid({
  character,
  now,
}: {
  character: Character;
  now: number;
}) {
  const doAction = useGameStore((s) => s.doAction);
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-pixel text-sm font-bold text-ink/80">업무</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {WORK_ACTIONS.map((a) => (
          <CooldownButton
            key={a.key}
            icon={WORK_ICON[a.key] ?? "star"}
            label={a.label}
            desc={a.desc}
            now={now}
            readyAt={character.cooldowns[a.key] ?? 0}
            accent={ACCENT[a.key] ?? "bg-sky/30"}
            onClick={() => doAction(a.key)}
          />
        ))}
      </div>
    </div>
  );
}
