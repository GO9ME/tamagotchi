"use client";

import type { Character } from "@/types/character";
import { useGameStore } from "@/lib/store/useGameStore";
import { formatMoney } from "@/lib/game/ending";
import {
  canChooseUniversity,
  UNIVERSITY_ORDER,
  UNIVERSITY_TIERS,
} from "@/lib/game/university";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils";

export function UniversityPanel({ character }: { character: Character }) {
  const chooseUniversity = useGameStore((s) => s.chooseUniversity);
  const u = character.university;

  if (u) {
    const tier = UNIVERSITY_TIERS[u.tier];
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-sm font-bold text-ink/80">대학</h3>
          <span className="pill bg-grape/20 text-ink/70">{tier.label}</span>
        </div>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-ink/55">
          연 등록금 {formatMoney(tier.tuitionPerYear)} · 취업률{" "}
          {tier.hiringBonus >= 0 ? "+" : ""}
          {tier.hiringBonus} · 초봉 ×{tier.salaryMult}
        </p>
        <div className="mt-3 flex items-center justify-between rounded-xl border-2 border-ink/10 bg-black/[0.03] px-4 py-2.5">
          <span className="flex items-center gap-1.5 font-pixel text-xs font-bold text-ink/70">
            <PixelIcon name="coin" size={14} /> 학자금대출
          </span>
          <span className={cn("font-pixel text-sm font-bold", u.loanBalance > 0 && "text-coral")}>
            {u.loanBalance > 0 ? formatMoney(u.loanBalance) : "없음"}
          </span>
        </div>
        {u.loanBalance > 0 && (
          <p className="mt-2 font-sans text-[11px] leading-relaxed text-ink/50">
            등록금이 모자란 만큼 대출로 처리돼요(재학 중 연 3% 이자). 취업하면 매년
            연봉의 8%만큼 자동으로 갚아요.
          </p>
        )}
      </div>
    );
  }

  if (!canChooseUniversity(character)) return null;

  return (
    <div className="card p-4">
      <h3 className="mb-1 font-pixel text-sm font-bold text-ink/80">대학 선택</h3>
      <p className="mb-3 font-sans text-[11px] leading-relaxed text-ink/55">
        등록금과 학업 커트라인은 대학마다 달라요. 저축이 모자라면 학자금대출로
        처리돼요(재학 중 연 3% 이자, 취업 후 연봉의 8%씩 자동 상환).
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {UNIVERSITY_ORDER.map((key) => {
          const t = UNIVERSITY_TIERS[key];
          const qualified = character.stats.academic >= t.academicBar;
          return (
            <button
              key={key}
              type="button"
              disabled={!qualified}
              onClick={() => chooseUniversity(key)}
              className="toy-btn flex flex-col items-start gap-1 bg-white text-left disabled:bg-black/[0.04]"
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-pixel text-sm font-bold">{t.label}</span>
                {!qualified && (
                  <span className="text-ink/45">
                    <PixelIcon name="lock" size={13} />
                  </span>
                )}
              </div>
              <span className="font-sans text-[11px] leading-tight text-ink/55">{t.desc}</span>
              <span className="font-pixel text-[11px] font-bold text-ink/70">
                등록금 {formatMoney(t.tuitionPerYear)}/년 · 학업 {t.academicBar}+ 필요
              </span>
              <span className="font-pixel text-[11px] text-ink/55">
                취업률 {t.hiringBonus >= 0 ? "+" : ""}
                {t.hiringBonus} · 초봉 ×{t.salaryMult}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
