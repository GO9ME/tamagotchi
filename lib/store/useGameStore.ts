"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { Character } from "@/types/character";
import { getAction } from "@/lib/game/actions";
import { createCharacter } from "@/lib/game/character";
import {
  FOODS,
  OVEREAT_EXTRA_WEIGHT,
  OVEREAT_HUNGER_THRESHOLD,
} from "@/lib/game/constants";
import { applyEffect, isActionReady, setCooldown } from "@/lib/game/engine";
import { applyDecay } from "@/lib/game/status";
import {
  StudyResult,
  buildStudySession,
  computeStudyResult,
  isStudyReady,
} from "@/lib/game/study";
import { getOrCreateUserId } from "@/lib/storage/local";

export interface ActionResult {
  ok: boolean;
  message: string;
}

interface GameState {
  character: Character | null;
  hydrated: boolean;
  /** UI 토스트용: 마지막 메시지와 토큰(애니메이션 트리거) */
  toast: { message: string; token: number } | null;

  setHydrated: () => void;
  createNew: (name: string, avatar: string) => void;
  reset: () => void;

  tick: () => void;
  feed: (foodKey: string) => ActionResult;
  doAction: (key: string) => ActionResult;
  startStudy: () => ActionResult;
  completeStudy: () => StudyResult | null;
  cancelStudy: () => void;
  addHiddenMs: (ms: number) => void;
}

const now = () => Date.now();

// 서버(SSR)에서는 localStorage 가 없으므로 안전한 no-op 스토리지를 사용
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const browserStorage = createJSONStorage(() =>
  typeof window !== "undefined" ? window.localStorage : noopStorage,
);

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const pushToast = (message: string) =>
        set((s) => ({ toast: { message, token: (s.toast?.token ?? 0) + 1 } }));

      return {
        character: null,
        hydrated: false,
        toast: null,

        setHydrated: () => set({ hydrated: true }),

      createNew: (name, avatar) => {
        const userId = getOrCreateUserId();
        set({ character: createCharacter(userId, name, avatar, now()) });
      },

      reset: () => set({ character: null, toast: null }),

      tick: () => {
        const c = get().character;
        if (!c) return;
        set({ character: applyDecay(c, now()) });
      },

      feed: (foodKey) => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        const t = now();
        if (!isActionReady(c, "feed", t)) {
          return { ok: false, message: "아직 배가 불러요. 잠시 후에 주세요." };
        }
        const food = FOODS.find((f) => f.key === foodKey);
        if (!food) return { ok: false, message: "알 수 없는 음식이에요." };

        let next = applyEffect(c, food.effect);

        // 과식 처리: 이미 배부른 상태에서 또 먹으면 체중 추가 증가
        let message = food.effect.message ?? "잘 먹었어요!";
        if (c.status.hunger >= OVEREAT_HUNGER_THRESHOLD) {
          next = applyEffect(next, {
            status: { weight: OVEREAT_EXTRA_WEIGHT, mood: 2 },
          });
          message = "과식했어요! 살이 조금 더 붙었어요.";
        }

        const isMeal = food.key !== "coffee";
        next = {
          ...next,
          cooldowns: setCooldown(next, "feed", t, getAction("feed")!.cooldownMs),
          yearCounters: {
            ...next.yearCounters,
            meals: next.yearCounters.meals + (isMeal ? 1 : 0),
          },
        };

        set({ character: next });
        pushToast(message);
        return { ok: true, message };
      },

      doAction: (key) => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        const def = getAction(key);
        if (!def || def.kind !== "instant" || !def.effect) {
          return { ok: false, message: "지원하지 않는 액션이에요." };
        }
        const t = now();
        if (!isActionReady(c, key, t)) {
          return { ok: false, message: "아직 쿨타임이에요." };
        }

        const effect = def.effect(c);
        let next = applyEffect(c, effect);

        // 액션별 부가 처리
        const counters = { ...next.yearCounters };
        let lastExerciseAt = next.lastExerciseAt;
        if (key === "exercise") {
          counters.exercise += 1;
          lastExerciseAt = t;
        } else if (key === "selfDev" || key === "read") {
          counters.selfDev += 1;
        }

        next = {
          ...next,
          lastExerciseAt,
          yearCounters: counters,
          cooldowns: setCooldown(next, key, t, def.cooldownMs),
        };

        set({ character: next });
        const message = effect.message ?? `${def.label} 완료!`;
        pushToast(message);
        return { ok: true, message };
      },

      startStudy: () => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        if (c.activeSession) {
          return { ok: false, message: "이미 공부 중이에요." };
        }
        const def = getAction("study")!;
        const t = now();
        if (!isActionReady(c, "study", t)) {
          return { ok: false, message: "아직 공부 쿨타임이에요." };
        }
        const session = buildStudySession(t, def.sessionMs ?? 30 * 60 * 1000);
        set({ character: { ...c, activeSession: session } });
        return { ok: true, message: "공부를 시작했어요. 30분 집중!" };
      },

      completeStudy: () => {
        const c = get().character;
        if (!c || !c.activeSession) return null;
        const t = now();
        if (!isStudyReady(c.activeSession, t)) return null;

        const result = computeStudyResult(c, c.activeSession, t);
        let next = applyEffect(c, result.effect);
        next = {
          ...next,
          activeSession: null,
          yearCounters: {
            ...next.yearCounters,
            study: next.yearCounters.study + 1,
          },
        };
        set({ character: next });
        pushToast(result.effect.message ?? "공부 완료!");
        return result;
      },

      cancelStudy: () => {
        const c = get().character;
        if (!c) return;
        set({ character: { ...c, activeSession: null } });
        pushToast("공부를 중단했어요.");
      },

      addHiddenMs: (ms) => {
        const c = get().character;
        if (!c || !c.activeSession) return;
        set({
          character: {
            ...c,
            activeSession: {
              ...c.activeSession,
              hiddenMs: c.activeSession.hiddenMs + ms,
            },
          },
        });
      },
      };
    },
    {
      name: "lifegotchi:character",
      storage: browserStorage,
      // 첫 클라이언트 렌더가 서버 렌더와 일치하도록 자동 하이드레이션을 끄고
      // StoreHydrator 에서 마운트 후 수동으로 rehydrate 한다.
      skipHydration: true,
      partialize: (s) => ({ character: s.character }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
