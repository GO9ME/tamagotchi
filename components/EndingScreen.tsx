"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Character } from "@/types/character";
import { TamaDevice } from "@/components/character/TamaDevice";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { computeLifeScore, formatMoney, lifeEnding } from "@/lib/game/ending";
import { COMPANY_TYPES, JOB_FAMILIES, RARITY_META } from "@/lib/game/jobs";
import {
  computeRankings,
  percentileFor,
  RANK_META,
  RANK_ORDER,
} from "@/lib/game/ranking";
import { getHall, saveHall } from "@/lib/storage/hall";
import { useGameStore } from "@/lib/store/useGameStore";

export function EndingScreen({ character }: { character: Character }) {
  const router = useRouter();
  const reset = useGameStore((s) => s.reset);
  const { title, subtitle } = lifeEnding(character);
  const score = computeLifeScore(character);
  const job = character.job;
  const age = character.deathAge ?? character.ageYears;
  const scores = computeRankings(character);
  const [newBest, setNewBest] = useState<"first" | "best" | null>(null);

  // 사망 회차를 명예의전당에 1회 적재(같은 id 중복 방지) + 역대 최고 비교
  useEffect(() => {
    const prev = getHall().filter((e) => e.id !== character.id);
    const prevBest = prev.reduce((m, e) => Math.max(m, e.scores.overall), -1);
    saveHall({
      id: character.id,
      name: character.name,
      color: character.color,
      ageAtDeath: age,
      scores,
      jobTitle: job?.title,
      endingTitle: title,
      createdAt: Date.now(),
    });
    setNewBest(
      prev.length === 0 ? "first" : scores.overall >= prevBest ? "best" : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

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
            gender={character.gender}
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

        {/* 랭킹 5종 + 추정 퍼센타일 */}
        <div className="mt-4 rounded-2xl border-2 border-ink/10 bg-black/[0.02] p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-pixel text-xs font-bold text-ink/70">
              인생 랭킹
            </span>
            {newBest && (
              <span className="pill bg-grape text-white">
                {newBest === "first" ? "첫 기록!" : "역대 최고 경신!"}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {RANK_ORDER.map((cat) => (
              <div key={cat} className="flex items-center gap-2">
                <PixelIcon name={RANK_META[cat].icon} size={12} />
                <span className="font-pixel text-[11px] text-ink/60">
                  {RANK_META[cat].label}
                </span>
                <span className="ml-auto font-pixel text-[11px] font-bold tabular-nums">
                  {scores[cat]}
                </span>
                <span className="w-20 text-right font-pixel text-[10px] text-ink/45">
                  상위 {percentileFor(cat, scores[cat])}%
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/ranking"
            className="mt-3 block rounded-xl border-2 border-ink/15 bg-white py-2 text-center font-pixel text-[11px] font-bold text-ink/60 hover:border-ink/40"
          >
            명예의전당 보기 →
          </Link>
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
