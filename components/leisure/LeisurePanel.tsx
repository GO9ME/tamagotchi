"use client";

// 여가·쇼핑 패널 — 번 돈으로 행복도/기분/스트레스를 능동적으로 관리하는 소비 액션.
// 나이로 하나씩 해금되고, 쿨타임(여운)이 돌며, 비용은 저축에서 차감된다.

import type { Character } from "@/types/character";
import { CooldownButton } from "@/components/actions/CooldownButton";
import { LEISURE_ACTIVITIES, canDoLeisure, leisureCooldownKey } from "@/lib/game/leisure";
import { formatMoney } from "@/lib/game/ending";
import { useGameStore } from "@/lib/store/useGameStore";

export function LeisurePanel({ character, now }: { character: Character; now: number }) {
  const doLeisure = useGameStore((s) => s.doLeisure);

  // 나이 미달 활동은 다음 해금 1개만 잠금 표시(먼 미래 것까지 늘어놓지 않기)
  const unlocked = LEISURE_ACTIVITIES.filter((l) => character.ageYears >= l.minAge);
  const nextLocked = LEISURE_ACTIVITIES.find((l) => character.ageYears < l.minAge);
  if (unlocked.length === 0 && !nextLocked) return null;

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-pixel text-sm font-bold text-ink/80">여가 · 쇼핑</h3>
        <span className="pill bg-blush/40 text-ink/70">행복 {character.happiness}</span>
      </div>
      <p className="mb-3 text-xs text-ink/55">
        번 돈으로 즐기는 시간 — 행복도를 직접 올리는 가장 확실한 방법이에요.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {unlocked.map((l) => {
          const gate = canDoLeisure(character, l.key, now);
          const insufficient = character.savings < l.cost;
          return (
            <CooldownButton
              key={l.key}
              icon={l.icon}
              label={`${l.label} · ${formatMoney(l.cost)}`}
              desc={
                insufficient
                  ? `${formatMoney(l.cost - character.savings)} 부족`
                  : `${l.desc} · 행복 +${l.happinessDelta}`
              }
              readyAt={character.cooldowns[leisureCooldownKey(l.key)] ?? 0}
              now={now}
              accent="bg-butter/30"
              locked={!gate.ok && insufficient}
              lockLabel={`${formatMoney(l.cost - character.savings)} 부족`}
              onClick={() => doLeisure(l.key)}
            />
          );
        })}
        {nextLocked && (
          <CooldownButton
            icon={nextLocked.icon}
            label={`${nextLocked.label} · ${formatMoney(nextLocked.cost)}`}
            desc=""
            readyAt={0}
            now={now}
            locked
            lockLabel={`${nextLocked.minAge}살부터`}
            onClick={() => {}}
          />
        )}
      </div>
    </div>
  );
}
