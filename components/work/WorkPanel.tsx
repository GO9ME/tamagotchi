"use client";

import type { Character } from "@/types/character";
import { COMPANY_TYPES, GRADE_LABEL, JOB_FAMILIES, nextGrade } from "@/lib/game/jobs";
import {
  evaluationScore,
  promotionHold,
  promotionScore,
  workGradeOf,
} from "@/lib/game/work";
import { PROMO_THRESHOLD } from "@/lib/game/constants";
import { StatBar } from "@/components/common/StatBar";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { JobStatsPanel } from "./JobStatsPanel";
import { NegotiateCard } from "./NegotiateCard";
import { WorkActionGrid } from "./WorkActionGrid";

export function WorkPanel({
  character,
  now,
}: {
  character: Character;
  now: number;
}) {
  const job = character.job;
  if (!job) return null;

  const comp = COMPANY_TYPES[job.company];
  const fam = JOB_FAMILIES[job.family];
  const next = nextGrade(job.grade);

  // 올해 평가 추정(고정 rand)으로 승진 진행도 + 보류 사유 계산 (실제 판정식과 동일 입력)
  const recentEval = evaluationScore(character, character.yearCounters, 0.5);
  const pScore = promotionScore(character, recentEval, character.yearCounters);
  const threshold = PROMO_THRESHOLD[job.grade];
  const promoPct = next
    ? Math.max(0, Math.min(100, Math.round((pScore / threshold) * 100)))
    : 100;
  const holdReasons = promotionHold(
    character,
    workGradeOf(recentEval),
    character.yearCounters,
  );

  return (
    <div className="space-y-4">
      {/* 재직 헤더 */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <span className="text-ink">
            <PixelIcon name={fam.icon} size={30} />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-pixel text-base font-bold">{job.title}</span>
              <span className="pill bg-mint text-ink">{GRADE_LABEL[job.grade]}</span>
            </div>
            <div className="font-pixel text-[11px] text-ink/55">
              {comp.label} · 연봉 {job.salaryManwon.toLocaleString()}만원
              {job.lastRaisePct != null && job.lastRaisePct !== 0
                ? ` (${job.lastRaisePct > 0 ? "+" : ""}${job.lastRaisePct}%)`
                : ""}
            </div>
          </div>
        </div>

        {next ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between font-pixel text-[11px] text-ink/60">
              <span>다음 직급 · {GRADE_LABEL[next]}</span>
              <span className="tabular-nums">{promoPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-ink/15 bg-black/[0.06]">
              <div
                className="h-full bg-grape transition-all duration-500"
                style={{ width: `${promoPct}%` }}
              />
            </div>
            <p className="mt-1.5 font-sans text-[11px] text-ink/45">
              연말 업무평가에서 승진이 결정돼요. 자기개발·성과·건강을 챙기세요.
            </p>
            {holdReasons.length > 0 && (
              <p className="mt-1 font-pixel text-[11px] text-coral">
                승진 보류 위험: {holdReasons.join(", ")}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 font-pixel text-[11px] text-ink/55">최고 직급에 올랐어요! 👑</p>
        )}

        {character.status.burnout > 80 && (
          <p className="mt-3 rounded-xl bg-coral/15 px-4 py-2 text-[11px] font-semibold text-coral">
            번아웃이 높아요! 휴식으로 회복하세요.
          </p>
        )}
      </div>

      {/* 컨디션 */}
      <div className="card p-4">
        <h3 className="mb-3 font-pixel text-sm font-bold text-ink/80">업무 컨디션</h3>
        <div className="grid grid-cols-3 gap-x-5 gap-y-3">
          <StatBar label="에너지" value={character.status.energy} />
          <StatBar label="스트레스" value={character.status.stress} higherIsBetter={false} />
          <StatBar label="번아웃" value={character.status.burnout} higherIsBetter={false} />
        </div>
      </div>

      <NegotiateCard character={character} />
      <JobStatsPanel character={character} />
      <WorkActionGrid character={character} now={now} />
    </div>
  );
}
