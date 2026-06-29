import Link from "next/link";

import type { Character } from "@/types/character";
import { COMPANY_TYPES, JOB_FAMILIES } from "@/lib/game/jobs";
import { PixelIcon } from "@/components/pixel/PixelIcon";

export function CareerCard({ character }: { character: Character }) {
  // 취업 완료 — 재직 요약
  if (character.job) {
    const fam = JOB_FAMILIES[character.job.family];
    const comp = COMPANY_TYPES[character.job.company];
    return (
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-pixel text-sm font-bold text-ink/80">직장</h3>
          <span className="pill bg-mint text-ink">재직 중</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-ink">
            <PixelIcon name={fam.icon} size={26} />
          </span>
          <div className="flex-1">
            <div className="font-pixel text-sm font-bold">{character.job.title}</div>
            <div className="font-pixel text-[11px] text-ink/55">
              {comp.label} · 연봉 {character.job.salaryManwon.toLocaleString()}만원
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 취준생 — 취업 화면 진입
  if (character.lifeStage === "jobseeker") {
    return (
      <Link
        href="/career"
        className="card flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
      >
        <span className="text-ink">
          <PixelIcon name="briefcase" size={26} />
        </span>
        <div className="flex-1">
          <h3 className="font-pixel text-sm font-bold text-ink/80">취업 준비</h3>
          <p className="font-sans text-[11px] text-ink/55">
            취준생이 됐어요! 스펙을 쌓고 회사에 지원해 보세요.
          </p>
        </div>
        <span className="font-pixel text-xs text-coral">→</span>
      </Link>
    );
  }

  // 아직 어림 — 잠금
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="text-ink/40">
        <PixelIcon name="briefcase" size={26} />
      </span>
      <div className="flex-1">
        <h3 className="font-pixel text-sm font-bold text-ink/55">취업</h3>
        <p className="font-sans text-[11px] text-ink/50">취준생 단계부터 가능해요.</p>
      </div>
      <span className="text-ink/45">
        <PixelIcon name="lock" size={18} />
      </span>
    </div>
  );
}
