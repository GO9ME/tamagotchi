"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { AVATARS } from "@/lib/game/character";
import { useGameStore } from "@/lib/store/useGameStore";
import { cn } from "@/lib/utils";

export default function CreatePage() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const existing = useGameStore((s) => s.character);
  const createNew = useGameStore((s) => s.createNew);
  const reset = useGameStore((s) => s.reset);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  const handleStart = () => {
    createNew(name, avatar);
    router.push("/dashboard");
  };

  // 이미 키우는 캐릭터가 있을 때
  if (hydrated && existing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="card w-full p-7">
          <div className="text-5xl">{existing.avatar}</div>
          <h1 className="mt-3 text-xl font-extrabold">
            이미 키우는 캐릭터가 있어요
          </h1>
          <p className="mt-1 text-sm text-ink/60">
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
        <h1 className="text-2xl font-extrabold">아기 캐릭터 만들기</h1>
        <p className="mt-1 text-sm text-ink/60">
          이름과 모습을 정해 주세요. 여기서부터 인생이 시작돼요!
        </p>

        <label className="mt-6 block text-sm font-bold text-ink/70">이름</label>
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

        <div className="mt-5 text-sm font-bold text-ink/70">모습 고르기</div>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl transition-all",
                avatar === a
                  ? "border-coral bg-coral/10 scale-105"
                  : "border-transparent bg-black/[0.03] hover:bg-black/5",
              )}
            >
              {a}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="toy-btn mt-7 w-full bg-coral text-white shadow-toy hover:-translate-y-0.5"
        >
          {avatar} 키우기 시작!
        </button>
      </div>
    </main>
  );
}
