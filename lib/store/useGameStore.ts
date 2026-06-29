"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type {
  Character,
  CompanyTypeKey,
  Gender,
  JobFamilyKey,
  JobOutcome,
  JobState,
  NegotiationResult,
  YearlyReview,
} from "@/types/character";
import { getAction, PREP_KEYS, WORK_KEYS } from "@/lib/game/actions";
import { createCharacter } from "@/lib/game/character";
import {
  COOLDOWN_SCALE,
  FOODS,
  GAME_YEAR_MS,
  OVEREAT_EXTRA_WEIGHT,
  OVEREAT_HUNGER_THRESHOLD,
} from "@/lib/game/constants";
import { applyEffect, isActionReady, setCooldown } from "@/lib/game/engine";
import { isActionUnlocked } from "@/lib/game/gating";
import {
  rollOutcome,
  scaleStatsDelta,
  type ActionOutcome,
  type OutcomeTier,
} from "@/lib/game/outcome";
import { runDueReviews } from "@/lib/game/review";
import {
  employmentChance,
  employmentReadiness,
  rollHire,
} from "@/lib/game/employment";
import { canNegotiate, negotiate } from "@/lib/game/negotiate";
import { degreeSalaryMult, gradAdmission } from "@/lib/game/degree";
import { gradeForScore, jobTitle, startingSalary } from "@/lib/game/jobs";
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
  /** 아직 확인하지 않은 연간 리뷰 모달 큐 (비영속) */
  pendingReviews: YearlyReview[];
  /** 취업 지원 결과 모달 (비영속) */
  jobResult: JobOutcome | null;
  /** 연봉협상 결과 모달 (비영속) */
  negotiationResult: NegotiationResult | null;
  /** 대성공/잭팟 연출 트리거 (비영속) */
  outcomeFx: { tier: OutcomeTier; label: string; token: number } | null;

  setHydrated: () => void;
  createNew: (name: string, color: string, gender: Gender) => void;
  reset: () => void;

  tick: () => void;
  feed: (foodKey: string) => ActionResult;
  doAction: (key: string) => ActionResult;
  startStudy: () => ActionResult;
  completeStudy: () => StudyResult | null;
  cancelStudy: () => void;
  addHiddenMs: (ms: number) => void;
  ackReview: () => void;
  ackAllReviews: () => void;
  applyForJob: (family: JobFamilyKey, company: CompanyTypeKey) => ActionResult;
  ackJobResult: () => void;
  negotiateSalary: () => ActionResult;
  ackNegotiation: () => void;
  enrollGrad: () => ActionResult;
  dropGrad: () => ActionResult;
}

const now = () => Date.now();
const HOUR = 60 * 60 * 1000;
/** 쿨타임 배율 적용 */
const cd = (ms: number) => Math.round(ms * COOLDOWN_SCALE);

/** 모달로 띄울 만한 마일스톤 리뷰인지 (단계전환/승진/시험/S·D/방치) */
function isMilestone(
  review: YearlyReview,
  allReviews: YearlyReview[],
): boolean {
  if (
    review.kind === "neglected" ||
    review.exam ||
    review.work?.promoted ||
    review.incident ||
    review.death ||
    review.degreeChange ||
    review.grade === "S" ||
    review.grade === "D"
  ) {
    return true;
  }
  const i = allReviews.findIndex((r) => r.id === review.id);
  const prevStage = i > 0 ? allReviews[i - 1].stage : review.stage;
  return review.stage !== prevStage;
}

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

      // 대성공/잭팟이면 화면 연출 트리거(토스트 외 보이는 도파민)
      const fireFx = (o: ActionOutcome | null) => {
        if (!o || (o.tier !== "jackpot" && o.tier !== "great")) return;
        set((s) => ({
          outcomeFx: { tier: o.tier, label: o.label, token: (s.outcomeFx?.token ?? 0) + 1 },
        }));
      };

      return {
        character: null,
        hydrated: false,
        toast: null,
        pendingReviews: [],
        jobResult: null,
        negotiationResult: null,
        outcomeFx: null,

        setHydrated: () => set({ hydrated: true }),

      createNew: (name, color, gender) => {
        const userId = getOrCreateUserId();
        set({
          character: createCharacter(userId, name, color, gender, now()),
          pendingReviews: [],
          jobResult: null,
          negotiationResult: null,
          toast: null,
        });
      },

      reset: () =>
        set({
          character: null,
          toast: null,
          pendingReviews: [],
          jobResult: null,
          negotiationResult: null,
        }),

      tick: () => {
        const c = get().character;
        if (!c) return;
        if (c.deathAge != null) return; // 사망 시 상태 동결(엔딩)
        const decayed = applyDecay(c, now());
        const { character, reviews } = runDueReviews(decayed, now());
        if (reviews.length > 0) {
          set((s) => {
            const existing = new Set(s.pendingReviews.map((r) => r.id));
            // 마일스톤만 모달로 (평범한 해는 성장기록에만 — 9분/년이라 매년 팝업하면 피곤)
            const fresh = reviews.filter(
              (r) => !existing.has(r.id) && isMilestone(r, character.reviews),
            );
            return { character, pendingReviews: [...s.pendingReviews, ...fresh] };
          });
        } else {
          set({ character });
        }
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
          cooldowns: setCooldown(next, "feed", t, cd(getAction("feed")!.cooldownMs)),
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
        if (!isActionUnlocked(key, c.lifeStage)) {
          return { ok: false, message: "아직 이 단계에서는 할 수 없어요." };
        }
        if (WORK_KEYS.has(key) && !c.job) {
          return { ok: false, message: "취업 후에 할 수 있어요." };
        }
        const t = now();
        if (!isActionReady(c, key, t)) {
          return { ok: false, message: "아직 쿨타임이에요." };
        }

        // 능력치 활동이면 확률로 상승폭 변동(대성공/부진, 컨디션 연동)
        const baseEffect = def.effect(c);
        let outcome: ActionOutcome | null = null;
        let effect = baseEffect;
        if (baseEffect.stats && Object.keys(baseEffect.stats).length > 0) {
          outcome = rollOutcome(c, Math.random());
          effect = { ...baseEffect, stats: scaleStatsDelta(baseEffect.stats, outcome.mult) };
        }
        let next = applyEffect(c, effect);

        // 액션별 부가 처리
        const counters = { ...next.yearCounters };
        let lastExerciseAt = next.lastExerciseAt;
        if (key === "exercise") {
          counters.exercise += 1;
          lastExerciseAt = t;
        } else if (
          key === "selfDev" ||
          key === "read" ||
          key === "workSelfDev" ||
          PREP_KEYS.has(key)
        ) {
          counters.selfDev += 1;
        }

        next = {
          ...next,
          lastExerciseAt,
          yearCounters: counters,
          cooldowns: setCooldown(next, key, t, cd(def.cooldownMs)),
        };

        set({ character: next });
        const baseMsg = baseEffect.message ?? `${def.label} 완료!`;
        const message =
          outcome && outcome.tier !== "good" ? `${outcome.label} ${baseMsg}` : baseMsg;
        pushToast(message);
        fireFx(outcome);
        return { ok: true, message };
      },

      startStudy: () => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        if (c.activeSession) {
          return { ok: false, message: "이미 공부 중이에요." };
        }
        if (!isActionUnlocked("study", c.lifeStage)) {
          return { ok: false, message: "아직 공부할 단계가 아니에요." };
        }
        const def = getAction("study")!;
        const t = now();
        if (!isActionReady(c, "study", t)) {
          return { ok: false, message: "아직 공부 쿨타임이에요." };
        }
        const session = buildStudySession(t, cd(def.sessionMs ?? 30 * 60 * 1000));
        set({ character: { ...c, activeSession: session } });
        return { ok: true, message: "공부를 시작했어요. 30분 집중!" };
      },

      completeStudy: () => {
        const c = get().character;
        if (!c || !c.activeSession) return null;
        const t = now();
        if (!isStudyReady(c.activeSession, t)) return null;

        const result = computeStudyResult(c, c.activeSession, t);
        const outcome = rollOutcome(c, Math.random(), true); // 완만(공부는 이미 시간/효율 배수)
        const scaledEffect = {
          ...result.effect,
          stats: scaleStatsDelta(result.effect.stats, outcome.mult),
        };
        let next = applyEffect(c, scaledEffect);
        next = {
          ...next,
          activeSession: null,
          // 세션 종료 후 다음 공부까지 쿨타임(연타 방지) — feed/doAction 과 동일 컨벤션
          cooldowns: setCooldown(next, "study", t, cd(getAction("study")!.cooldownMs)),
          yearCounters: {
            ...next.yearCounters,
            study: next.yearCounters.study + 1,
          },
        };
        set({ character: next });
        const baseMsg = result.effect.message ?? "공부 완료!";
        pushToast(
          outcome.tier !== "good" ? `${outcome.label} ${baseMsg}` : baseMsg,
        );
        fireFx(outcome);
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

      ackReview: () =>
        set((s) => ({ pendingReviews: s.pendingReviews.slice(1) })),

      ackAllReviews: () => set({ pendingReviews: [] }),

      applyForJob: (family, company) => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        if (c.lifeStage !== "jobseeker" || c.job) {
          return { ok: false, message: "지금은 취업 지원 단계가 아니에요." };
        }
        if (c.gradEnroll) {
          return { ok: false, message: "대학원 재학 중에는 지원할 수 없어요. 졸업 후에!" };
        }
        const t = now();
        if (!isActionReady(c, "jobApply", t)) {
          return { ok: false, message: "아직 지원 쿨타임이에요." };
        }
        const chance = employmentChance(c, family, company);
        const { hired, roll } = rollHire(chance, Math.random());

        if (hired) {
          const grade = gradeForScore(employmentReadiness(c, family));
          // 학위 보너스 반영(석/박사 초봉 ↑), 100만원 단위 반올림
          const salary =
            Math.round((startingSalary(grade, company, family) * degreeSalaryMult(c)) / 100) * 100;
          const job: JobState = {
            family,
            company,
            grade,
            title: jobTitle(family, grade),
            salaryManwon: salary,
            hiredAt: t,
            hiredAtAge: c.ageYears,
          };
          let next = applyEffect(c, {
            status: { confidence: 8, mood: 10, stress: -5 },
            stats: { careerPotential: 3, employability: 2 },
            exp: 80,
          });
          next = {
            ...next,
            job,
            jobApplications: c.jobApplications + 1,
            cooldowns: setCooldown(next, "jobApply", t, cd(HOUR)),
          };
          set({
            character: next,
            jobResult: { success: true, family, company, chance, roll, job },
          });
          pushToast("합격! 출근을 준비해요.");
          return { ok: true, message: "합격!" };
        }

        let next = applyEffect(c, {
          status: { stress: 10, confidence: -5, mood: -6 },
          stats: { careerPotential: 1 },
        });
        next = {
          ...next,
          jobApplications: c.jobApplications + 1,
          cooldowns: setCooldown(next, "jobApply", t, cd(HOUR)),
        };
        set({
          character: next,
          jobResult: { success: false, family, company, chance, roll },
        });
        pushToast("아쉽게 불합격… 다시 도전해요.");
        return { ok: true, message: "불합격" };
      },

      ackJobResult: () => set({ jobResult: null }),

      negotiateSalary: () => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        const gate = canNegotiate(c);
        if (!gate.ok) {
          return { ok: false, message: gate.reason ?? "지금은 협상할 수 없어요." };
        }
        const result = negotiate(c, Math.random(), Math.random());
        const job = c.job!;
        let next: Character;
        if (result.outcome === "success") {
          next = applyEffect(c, { status: { confidence: 6, mood: 5 } });
          next = {
            ...next,
            job: {
              ...job,
              salaryManwon: result.salaryAfter,
              lastNegotiatedAtAge: c.ageYears,
              lastNegotiatePct: result.raisePct,
            },
          };
          pushToast(`연봉협상 성공! +${result.raisePct}%`);
        } else if (result.outcome === "backfire") {
          next = applyEffect(c, {
            status: { confidence: -6, stress: 10 },
            stats: { careerPotential: -1 },
          });
          next = {
            ...next,
            job: { ...job, lastNegotiatedAtAge: c.ageYears },
            negotiateBackfire: true,
          };
          pushToast("협상이 역효과를 냈어요…");
        } else {
          next = applyEffect(c, {
            status: { confidence: -3, stress: 6, mood: -3 },
          });
          next = { ...next, job: { ...job, lastNegotiatedAtAge: c.ageYears } };
          pushToast("협상 결렬… 내년에 다시.");
        }
        set({ character: next, negotiationResult: result });
        return { ok: true, message: result.outcome };
      },

      ackNegotiation: () => set({ negotiationResult: null }),

      enrollGrad: () => {
        const c = get().character;
        if (!c) return { ok: false, message: "캐릭터가 없어요." };
        if (c.deathAge != null) return { ok: false, message: "이미 생을 마쳤어요." };
        const adm = gradAdmission(c);
        if (!adm.ok || !adm.target) {
          return { ok: false, message: adm.reason ?? "지금은 진학할 수 없어요." };
        }
        const target = adm.target;
        set({
          character: { ...c, gradEnroll: { degree: target, startAge: c.ageYears } },
        });
        pushToast(
          target === "master"
            ? "석사 과정 입학! 대학원 노예 라이프 시작…"
            : "박사 과정 입학! 끝까지 버텨봐요.",
        );
        return { ok: true, message: "입학" };
      },

      dropGrad: () => {
        const c = get().character;
        if (!c || c.deathAge != null || !c.gradEnroll) {
          return { ok: false, message: "대학원 재학 중이 아니에요." };
        }
        set({ character: { ...c, gradEnroll: null } });
        pushToast("대학원을 자퇴했어요. 학위는 이전 단계로 남아요.");
        return { ok: true, message: "자퇴" };
      },
      };
    },
    {
      name: "lifegotchi:character",
      version: 10,
      storage: browserStorage,
      // 첫 클라이언트 렌더가 서버 렌더와 일치하도록 자동 하이드레이션을 끄고
      // StoreHydrator 에서 마운트 후 수동으로 rehydrate 한다.
      skipHydration: true,
      partialize: (s) => ({ character: s.character }),
      // 구버전 세이브 호환(필드 누락 보정). 항상 ?? 로 보정하므로 idempotent.
      migrate: (persisted) => {
        const stored = (persisted ?? {}) as { character?: Character | null };
        const c = stored.character;
        if (!c) return { character: null } as unknown as GameState;
        const gender: Gender = c.gender === "female" ? "female" : "male";
        const merged: Character = {
          ...c,
          color: c.color || "blush",
          gender,
          // 구버전 세이브: 성별 평균 키로 보정(결정적)
          heightPotential: c.heightPotential ?? (gender === "female" ? 162 : 175),
          // 학위: 구버전은 나이로 추정(취준생 이상이면 학사)
          degree: c.degree ?? ((c.ageYears ?? 0) >= 25 ? "bachelor" : "highschool"),
          gradEnroll: c.gradEnroll ?? null,
          avatar: c.avatar || "🐣",
          stats: {
            ...c.stats,
            academic: c.stats?.academic ?? 5,
            portfolioScore: c.stats?.portfolioScore ?? 0,
            interviewScore: c.stats?.interviewScore ?? 0,
            certificateScore: c.stats?.certificateScore ?? 0,
            performance: c.stats?.performance ?? 0,
          },
          reviews: c.reviews ?? [],
          // 기존 값 보존(없는 구버전 세이브만 ageYears 로 폴백 → 리뷰 폭탄 방지)
          lastReviewedAge: c.lastReviewedAge ?? c.ageYears ?? 0,
          job: c.job ?? null,
          jobApplications: c.jobApplications ?? 0,
          savings: c.savings ?? 0,
          happiness: c.happiness ?? 50,
          negotiateBackfire: c.negotiateBackfire ?? false,
          // 시간 배율이 바뀌어도 현재 나이를 유지하도록 bornAt 재기준 + decay 시계 리셋
          bornAt: Date.now() - (c.ageYears ?? 0) * GAME_YEAR_MS,
          lastTickAt: Date.now(),
          // 같은 시계를 쓰는 절대 타임스탬프 필드도 함께 정규화(옛 epoch 잔존 → 즉시 페널티/완료 방지)
          lastExerciseAt: Date.now(),
          cooldowns: {},
          activeSession: null,
        };
        return { character: merged } as unknown as GameState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
