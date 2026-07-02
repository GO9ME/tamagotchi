"use client";

// 어느 탭(페이지)에 있든 게임 시간이 흐르도록 하는 공용 tick 훅.
// 대시보드뿐 아니라 성장기록/랭킹에서도 감쇠·연간 결산이 실시간으로 진행되어
// "다른 탭 보는 동안 게임이 몰래 멈췄다가 몰아치는" 문제를 막는다.

import { useEffect } from "react";
import { useGameStore } from "@/lib/store/useGameStore";

export function useGameTick() {
  const characterId = useGameStore((s) => s.character?.id);
  const tick = useGameStore((s) => s.tick);

  useEffect(() => {
    if (!characterId) return;
    tick();
    const id = setInterval(() => tick(), 5000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [characterId, tick]);
}
