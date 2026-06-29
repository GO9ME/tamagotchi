import type { Character, CharacterStats, CharacterStatus } from "./character";

/** 상태/스탯 변화량 (부분 적용) */
export type StatusDelta = Partial<CharacterStatus>;
export type StatsDelta = Partial<CharacterStats>;

export interface ActionEffect {
  status?: StatusDelta;
  stats?: StatsDelta;
  exp?: number;
  message?: string;
}

export type ActionKind = "instant" | "session" | "food";

export interface ActionDef {
  key: string;
  label: string; // 한글 표시명
  emoji: string;
  desc: string;
  kind: ActionKind;
  cooldownMs: number;
  sessionMs?: number; // session 액션의 집중 시간 (예: 30분)
  /** 상태에 영향을 받지 않는 기본 효과 계산 (instant 액션) */
  effect?: (c: Character) => ActionEffect;
  category: "care" | "study" | "fitness" | "selfdev" | "fun" | "rest";
}

export interface FoodDef {
  key: string;
  label: string;
  emoji: string;
  effect: ActionEffect; // status delta + message
}
