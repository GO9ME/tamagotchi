import type { ActionEffect } from "@/types/action";
import type {
  Character,
  CharacterStats,
  CharacterStatus,
} from "@/types/character";
import { clampStatus, round2 } from "./clamp";
import { expForLevel } from "./constants";
import { STAT_POINTS_PER_LEVEL } from "./statPoints";

/** status delta(부분)를 더해 새 status 반환 (clamp 포함) */
export function addStatus(
  status: CharacterStatus,
  delta?: Partial<CharacterStatus>,
): CharacterStatus {
  if (!delta) return { ...status };
  const next = { ...status };
  (Object.keys(delta) as (keyof CharacterStatus)[]).forEach((k) => {
    next[k] = (next[k] ?? 0) + (delta[k] ?? 0);
  });
  return clampStatus(next);
}

/** stats delta(부분)를 더해 새 stats 반환 (음수 방지) */
export function addStats(
  stats: CharacterStats,
  delta?: Partial<CharacterStats>,
): CharacterStats {
  if (!delta) return { ...stats };
  const next = { ...stats };
  (Object.keys(delta) as (keyof CharacterStats)[]).forEach((k) => {
    next[k] = round2(Math.max(0, (next[k] ?? 0) + (delta[k] ?? 0)));
  });
  return next;
}

/** exp 를 더하고 레벨업 처리 */
export function addExp(
  level: number,
  exp: number,
  gain: number,
): { level: number; exp: number; leveledUp: boolean; levelsGained: number } {
  let lv = level;
  let e = exp + Math.max(0, gain);
  let levelsGained = 0;
  // 무한루프 방지용 상한
  for (let i = 0; i < 100; i++) {
    const need = expForLevel(lv);
    if (e < need) break;
    e -= need;
    lv += 1;
    levelsGained += 1;
  }
  return { level: lv, exp: e, leveledUp: levelsGained > 0, levelsGained };
}

/** 액션 효과를 캐릭터에 적용한 새 캐릭터 반환 (레벨업 시 스탯 포인트 지급) */
export function applyEffect(c: Character, effect: ActionEffect): Character {
  const status = addStatus(c.status, effect.status);
  const stats = addStats(c.stats, effect.stats);
  const { level, exp, levelsGained } = addExp(c.level, c.exp, effect.exp ?? 0);
  const statPoints = c.statPoints + levelsGained * STAT_POINTS_PER_LEVEL;
  return { ...c, status, stats, level, exp, statPoints };
}

// --- 쿨타임 ---

export function setCooldown(
  c: Character,
  key: string,
  now: number,
  cooldownMs: number,
): Record<string, number> {
  return { ...c.cooldowns, [key]: now + cooldownMs };
}

export function cooldownRemaining(c: Character, key: string, now: number): number {
  const until = c.cooldowns[key] ?? 0;
  return Math.max(0, until - now);
}

export function isActionReady(c: Character, key: string, now: number): boolean {
  return cooldownRemaining(c, key, now) <= 0;
}
