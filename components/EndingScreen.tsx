"use client";

import { useRouter } from "next/navigation";

import type { Character } from "@/types/character";
import { TamaDevice } from "@/components/character/TamaDevice";
import { lifeEnding } from "@/lib/game/ending";
import { COMPANY_TYPES } from "@/lib/game/jobs";
import { useGameStore } from "@/lib/store/useGameStore";

export function EndingScreen({ character }: { character: Character }) {
  const router = useRouter();
  const reset = useGameStore((s) => s.reset);
  const { score, title, subtitle } = lifeEnding(character);

  const restart = () => {
    reset();
    router.push("/create");
  };

  const job = character.job;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="card p-7 text-center">
        <span className="pill mx-auto bg-grape/30 text-ink">인생 결산</span>

        <div className="my-4">
          <TamaDevice
            colorKey={character.color}
            status={character.status}
            stage="retirement"
            mascotSize={110}
            showStatus={false}
          />
        </div>

        <h1 className="font-pixel text-xl font-bold">{character.name}의 인생</h1>
        <p className="font-pixel text-xs text-ink/55">
          만 {character.ageYears}세 · 정년퇴직
        </p>

        <div className="mt-4 rounded-2xl border-[3px] border-ink bg-butter/30 p-4">
          <div className="font-pixel text-2xl font-bold">{title}</div>
          <p className="mt-1 font-sans text-[13px] text-ink/60">{subtitle}</p>
          <div className="mt-3 font-pixel text-sm font-bold text-ink/70">
            인생 점수 <span className="text-coral">{score}</span> / 100
          </div>
        </div>

        <div className="mt-4 space-y-2 text-left">
          <Row
            label="최종 직업"
            value={job ? `${COMPANY_TYPES[job.company].label} ${job.title}` : "무직 (자유인)"}
          />
          <Row
            label="마지막 연봉"
            value={job ? `${job.salaryManwon.toLocaleString()}만원` : "-"}
          />
          <Row label="레벨" value={`Lv. ${character.level}`} />
          <Row label="학업" value={`${Math.round(character.stats.academic)}`} />
          <Row label="커리어" value={`${Math.round(character.stats.careerPotential)}`} />
        </div>

        <button
          type="button"
          onClick={restart}
          className="toy-btn mt-6 w-full bg-coral text-white"
        >
          다시 태어나기
        </button>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-black/[0.03] px-4 py-2.5">
      <span className="font-pixel text-xs text-ink/60">{label}</span>
      <span className="font-pixel text-sm font-bold">{value}</span>
    </div>
  );
}
