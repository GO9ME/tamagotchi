"use client";

import { useRouter } from "next/navigation";

import type { Character } from "@/types/character";
import { TamaDevice } from "@/components/character/TamaDevice";
import { computeLifeScore, formatMoney, lifeEnding } from "@/lib/game/ending";
import { COMPANY_TYPES, JOB_FAMILIES, RARITY_META } from "@/lib/game/jobs";
import { useGameStore } from "@/lib/store/useGameStore";

export function EndingScreen({ character }: { character: Character }) {
  const router = useRouter();
  const reset = useGameStore((s) => s.reset);
  const { title, subtitle } = lifeEnding(character);
  const score = computeLifeScore(character);
  const job = character.job;
  const age = character.deathAge ?? character.ageYears;

  const restart = () => {
    reset();
    router.push("/create");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="card p-7 text-center">
        <span className="pill mx-auto bg-ink/10 text-ink/70">인생 결산</span>

        <div className="my-4 opacity-80">
          <TamaDevice
            colorKey={character.color}
            status={character.status}
            stage="retirement"
            mascotSize={104}
            showStatus={false}
          />
        </div>

        <h1 className="font-pixel text-xl font-bold">{character.name}의 인생</h1>
        <p className="font-pixel text-xs text-ink/55">
          만 {age}세 · {character.deathCause ?? "노환"}으로 영면
        </p>

        <div className="mt-4 rounded-2xl border-[3px] border-ink bg-butter/30 p-4">
          <div className="font-pixel text-xl font-bold">{title}</div>
          <p className="mt-1 font-sans text-[13px] text-ink/60">{subtitle}</p>
        </div>

        <div className="mt-4 space-y-2 text-left">
          <Row label="수명" value={`만 ${age}세`} />
          <Row
            label="최종 직업"
            value={
              job
                ? `${RARITY_META[JOB_FAMILIES[job.family].rarity].label} · ${job.title}`
                : "무직 (자유인)"
            }
          />
          <Row label="저축" value={formatMoney(character.savings)} strong />
          <Row label="행복도" value={`${character.happiness} / 100`} />
          <Row label="인생 점수" value={`${score} / 100`} />
          {job && (
            <Row
              label="마지막 직장"
              value={`${COMPANY_TYPES[job.company].label}`}
            />
          )}
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

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-black/[0.03] px-4 py-2.5">
      <span className="font-pixel text-xs text-ink/60">{label}</span>
      <span className={`font-pixel font-bold ${strong ? "text-base text-coral" : "text-sm"}`}>
        {value}
      </span>
    </div>
  );
}
