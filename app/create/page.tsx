"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import type { CharacterStatus } from "@/types/character";
import { TamaDevice } from "@/components/character/TamaDevice";
import { MASCOT_COLORS } from "@/lib/game/constants";
import { useGameStore } from "@/lib/store/useGameStore";
import { cn } from "@/lib/utils";

// 미리보기용 기분 좋은 상태
const PREVIEW_STATUS: CharacterStatus = {
  hunger: 80,
  energy: 85,
  mood: 85,
  health: 90,
  stress: 8,
  focus: 60,
  sleepQuality: 85,
  cleanliness: 85,
  confidence: 50,
  burnout: 0,
  weight: 10,
};

export default function CreatePage() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const existing = useGameStore((s) => s.character);
  const createNew = useGameStore((s) => s.createNew);
  const reset = useGameStore((s) => s.reset);

  const [name, setName] = useState("");
  const [color, setColor] = useState(MASCOT_COLORS[0].key);

  const handleStart = () => {
    createNew(name, color);
    router.push("/dashboard");
  };

  // 이미 키우는 캐릭터가 있을 때
  if (hydrated && existing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="card w-full p-7">
          <div className="mx-auto max-w-[180px]">
            <TamaDevice
              colorKey={existing.color}
              status={existing.status}
              mascotSize={92}
              showStatus={false}
            />
          </div>
          <h1 className="mt-4 font-pixel text-xl font-bold">
            이미 키우는 캐릭터가 있어요
          </h1>
          <p className="mt-1 font-pixel text-sm text-ink/60">
            {existing.name} · 만 {existing.ageYears}살
          </p>
          <Link
            href="/dashboard"
            className="toy-btn mt-5 block w-full bg-coral text-white shadow-soft"
          >
            이어서 키우기 →
          </Link>
          <button
            type="button"
            onClick={() => {
              if (confirm("정말 새로 시작할까요? 지금 캐릭터는 사라져요.")) reset();
            }}
            className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-ink/45 hover:bg-black/5"
          >
            처음부터 새로 시작
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-6 text-sm font-semibold text-ink/50">
        ← 홈으로
      </Link>
      <div className="card p-7">
        <h1 className="font-pixel text-2xl font-bold">아기 캐릭터 만들기</h1>
        <p className="mt-1 text-sm text-ink/60">
          이름과 색을 정해 주세요. 여기서부터 인생이 시작돼요!
        </p>

        {/* 미리보기 */}
        <div className="my-5 max-w-[220px] mx-auto">
          <TamaDevice colorKey={color} status={PREVIEW_STATUS} mascotSize={112} showStatus={false} />
        </div>

        <label className="block font-pixel text-sm font-bold text-ink/70">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          placeholder="예: 콩이"
          className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-coral"
        />
        <p className="mt-1 text-[11px] text-ink/40">
          실명·개인정보가 담긴 이름은 피해 주세요. 랭킹엔 닉네임만 표시돼요.
        </p>

        <div className="mt-5 font-pixel text-sm font-bold text-ink/70">색 고르기</div>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {MASCOT_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              aria-label={c.label}
              className={cn(
                "h-12 w-12 rounded-full border-4 transition-all",
                color === c.key
                  ? "border-ink/70 scale-110"
                  : "border-white shadow-soft hover:scale-105",
              )}
              style={{ backgroundColor: c.body }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="toy-btn mt-7 w-full bg-coral text-white"
        >
          키우기 시작!
        </button>
      </div>
    </main>
  );
}
