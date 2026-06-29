"use client";

import { useEffect, useRef } from "react";

import type { Character } from "@/types/character";
import { useGameStore } from "@/lib/store/useGameStore";
import { efficiencyReasons, learningEfficiency } from "@/lib/game/status";
import {
  STUDY_PERFECT_WINDOW_MS,
  isStudyReady,
} from "@/lib/game/study";
import { isActionReady } from "@/lib/game/engine";
import { formatDuration } from "@/lib/utils";

export function StudyCard({
  character,
  now,
}: {
  character: Character;
  now: number;
}) {
  const startStudy = useGameStore((s) => s.startStudy);
  const completeStudy = useGameStore((s) => s.completeStudy);
  const cancelStudy = useGameStore((s) => s.cancelStudy);
  const addHiddenMs = useGameStore((s) => s.addHiddenMs);

  const session = character.activeSession;
  const hiddenSince = useRef<number | null>(null);

  // 세션 동안 페이지가 숨겨진 시간 추적 (집중 실패 판정용)
  useEffect(() => {
    if (!session) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenSince.current = Date.now();
      } else if (hiddenSince.current != null) {
        addHiddenMs(Date.now() - hiddenSince.current);
        hiddenSince.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (hiddenSince.current != null) {
        addHiddenMs(Date.now() - hiddenSince.current);
        hiddenSince.current = null;
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session, addHiddenMs]);

  const eff = learningEfficiency(character);
  const reasons = efficiencyReasons(character);

  // --- 세션 없음: 시작 가능 / 쿨타임 ---
  if (!session) {
    const ready = isActionReady(character, "study", now);
    const remaining = Math.max(0, (character.cooldowns["study"] ?? 0) - now);
    return (
      <div className="card relative overflow-hidden p-5">
        <Header eff={eff} reasons={reasons} />
        <button
          type="button"
          disabled={!ready}
          onClick={() => startStudy()}
          className="toy-btn mt-3 w-full bg-sky text-ink shadow-soft hover:-translate-y-0.5 disabled:bg-black/10"
        >
          {ready ? "📖 공부 시작 (30분 집중)" : `쿨타임 ${formatDuration(remaining)}`}
        </button>
        <p className="mt-2 text-center text-[11px] text-ink/50">
          시작 후 30분이 지나면 완료 버튼이 열려요. 10분 안에 완료하면 100% 보상!
        </p>
      </div>
    );
  }

  // --- 세션 진행 중 ---
  const ready = isStudyReady(session, now);
  const total = session.availableCompleteAt - session.startedAt;
  const elapsed = Math.min(total, now - session.startedAt);
  const ratio = total > 0 ? elapsed / total : 1;

  if (!ready) {
    const remaining = session.availableCompleteAt - now;
    return (
      <div className="card relative overflow-hidden p-5">
        <Header eff={eff} reasons={reasons} />
        <div className="mt-3 flex items-center justify-between text-sm font-bold">
          <span className="text-ink/70">집중 중…</span>
          <span className="tabular-nums">{formatDuration(remaining)} 남음</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-sky transition-all duration-700"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-ink/50">
          페이지를 너무 오래 떠나 있으면 집중이 흐트러져요 (보상 감소).
        </p>
        <button
          type="button"
          onClick={() => cancelStudy()}
          className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-ink/50 hover:bg-black/5"
        >
          공부 중단
        </button>
      </div>
    );
  }

  // --- 완료 가능 ---
  const sinceReady = now - session.availableCompleteAt;
  const inPerfect = sinceReady <= STUDY_PERFECT_WINDOW_MS;
  const perfectLeft = STUDY_PERFECT_WINDOW_MS - sinceReady;
  return (
    <div className="card relative overflow-hidden p-5 ring-2 ring-mint">
      <Header eff={eff} reasons={reasons} />
      <button
        type="button"
        onClick={() => completeStudy()}
        className="toy-btn mt-3 w-full animate-pop bg-mint text-ink shadow-soft hover:-translate-y-0.5"
      >
        ✅ 공부 완료하기!
      </button>
      <p className="mt-2 text-center text-[11px] font-semibold text-ink/60">
        {inPerfect
          ? `지금 완료하면 100% 보상! (${formatDuration(perfectLeft)} 남음)`
          : "보상이 줄어들고 있어요. 빨리 완료하세요!"}
      </p>
    </div>
  );
}

function Header({ eff, reasons }: { eff: number; reasons: string[] }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-sm font-extrabold text-ink/80">📖 공부하기</h3>
        <p className="text-[11px] text-ink/55">지능 · 성실성 · 집중력 성장</p>
      </div>
      <div className="text-right">
        <span className="pill bg-grape/30 text-ink">효율 {Math.round(eff * 100)}%</span>
        {reasons.length > 0 && (
          <p className="mt-1 text-[10px] text-coral">{reasons.join(", ")} 때문에 ↓</p>
        )}
      </div>
    </div>
  );
}
