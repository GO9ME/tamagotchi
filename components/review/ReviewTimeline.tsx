import type { YearlyReview } from "@/types/character";
import { stageLabel } from "@/lib/game/growth";
import { DEGREE_LABEL } from "@/lib/game/degree";
import { formatMoney } from "@/lib/game/ending";
import { GRADE_LABEL } from "@/lib/game/jobs";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { gradeMeta } from "./gradeMeta";

export function ReviewTimeline({ reviews }: { reviews: YearlyReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <span className="text-ink/50">
          <PixelIcon name="study" size={40} />
        </span>
        <p className="font-pixel font-bold text-ink/70">아직 기록이 없어요</p>
        <p className="text-sm text-ink/50">
          나이를 한 살 더 먹으면 그 해의 결산이 여기에 쌓여요.
        </p>
      </div>
    );
  }

  // 최신순
  const ordered = [...reviews].reverse();

  return (
    <div className="flex flex-col gap-2.5">
      {ordered.map((r) =>
        r.kind === "neglected" ? (
          <div key={r.id} className="card flex items-center gap-3 p-3.5">
            <span className="text-ink/50">
              <PixelIcon name="sleep" size={26} />
            </span>
            <div className="flex-1">
              <div className="font-pixel text-sm font-bold">
                약 {r.neglectedYears}년간 방치
              </div>
              <div className="font-pixel text-[11px] text-ink/50">
                ~만 {r.age}살 · 성장 정체
              </div>
            </div>
          </div>
        ) : (
          <ReviewRow key={r.id} review={r} />
        ),
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: YearlyReview }) {
  const g = gradeMeta(review.grade);
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-[3px] border-ink font-pixel text-base font-bold ${g.badge}`}
        >
          {review.grade}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-sm font-bold">만 {review.age}살</span>
            <span className={`pill ${g.badge}`}>{g.label}</span>
          </div>
          <div className="font-pixel text-[11px] text-ink/50">
            {stageLabel(review.stage)} · 종합 {review.score}점
            {review.exam && ` · 시험 ${review.exam.tier}`}
          </div>
        </div>
        <div className="flex items-center gap-2 text-ink/60">
          <span className="flex items-center gap-1 font-pixel text-[11px]">
            <PixelIcon name="study" size={12} />
            {review.counters.study}
          </span>
          <span className="flex items-center gap-1 font-pixel text-[11px]">
            <PixelIcon name="selfDev" size={12} />
            {review.counters.selfDev}
          </span>
        </div>
      </div>
      {review.event && (
        <div className="mt-2 rounded-xl bg-butter/25 px-3 py-1.5 text-[12px] text-ink/70">
          {review.event.emoji} <b className="font-pixel text-[11px]">{review.event.label}</b>{" "}
          — {review.event.detail}
        </div>
      )}

      {/* 그 해의 마일스톤/변동 — 모달에서만 보이고 사라지던 기록을 연대기에 남긴다 */}
      {(review.work || review.incident || review.death || review.degreeChange ||
        review.savingsDelta !== 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.work && (
            <span className="pill bg-mint/25 text-[10px] text-ink/70">
              💼 평가 {review.work.grade}
              {review.work.raisePct !== 0 &&
                ` · 연봉 ${review.work.raisePct > 0 ? "+" : ""}${review.work.raisePct}%`}
            </span>
          )}
          {review.work?.promoted && review.work.gradeTo && (
            <span className="pill bg-grape/25 text-[10px] font-bold text-ink/80">
              🎉 {GRADE_LABEL[review.work.gradeTo]} 승진
            </span>
          )}
          {review.degreeChange && (
            <span className="pill bg-grape/20 text-[10px] text-ink/70">
              🎓 {DEGREE_LABEL[review.degreeChange.to]} 취득
            </span>
          )}
          {review.incident && (
            <span className="pill bg-coral/20 text-[10px] text-coral">
              🤕 {review.incident.cause} (건강 -{review.incident.healthHit})
            </span>
          )}
          {review.death && (
            <span className="pill bg-ink/15 text-[10px] font-bold text-ink/70">
              🕊️ {review.death.cause}으로 영면
            </span>
          )}
          {review.savingsDelta !== 0 && (
            <span
              className={`pill text-[10px] tabular-nums ${
                review.savingsDelta > 0 ? "bg-butter/40 text-ink/70" : "bg-coral/15 text-coral"
              }`}
            >
              💰 {review.savingsDelta > 0 ? "+" : ""}
              {formatMoney(review.savingsDelta)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
