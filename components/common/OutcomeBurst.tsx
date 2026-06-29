"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store/useGameStore";

/** 대성공/잭팟 시 화면 중앙에 잠깐 떠오르는 연출 (보이는 도파민) */
export function OutcomeBurst() {
  const fx = useGameStore((s) => s.outcomeFx);
  const [cur, setCur] = useState<typeof fx>(null);

  useEffect(() => {
    if (!fx) return;
    setCur(fx);
    const t = setTimeout(() => setCur(null), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx?.token]);

  if (!cur) return null;
  const jackpot = cur.tier === "jackpot";

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center">
      <div
        key={cur.token}
        className={`outcome-burst flex items-center gap-2 rounded-2xl border-[3px] border-ink px-6 py-3 font-pixel text-2xl font-bold shadow-[5px_5px_0_0_rgba(46,39,34,0.3)] ${
          jackpot ? "bg-butter text-ink" : "bg-mint text-ink"
        }`}
      >
        <span>{jackpot ? "🎉" : "✨"}</span>
        <span>{cur.label}</span>
        <span>{jackpot ? "🎉" : "✨"}</span>
      </div>
    </div>
  );
}
