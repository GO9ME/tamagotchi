// ---------------------------------------------------------------------------
// effectLabel.ts
// 액션 효과(StatusDelta/StatsDelta)를 사람이 읽는 한글 요약으로 변환.
// 버튼 미리보기("어떤 컨디션이 얼마나 오르는지")와 실행 후 토스트에 공용.
// ---------------------------------------------------------------------------

import type { ActionEffect } from "@/types/action";
import type { CharacterStats, CharacterStatus } from "@/types/character";

export const STATUS_LABELS: Record<keyof CharacterStatus, string> = {
  hunger: "배고픔",
  energy: "체력",
  mood: "기분",
  health: "건강",
  stress: "스트레스",
  focus: "집중력",
  sleepQuality: "수면질",
  cleanliness: "청결",
  confidence: "자신감",
  burnout: "번아웃",
  weight: "체중",
};

export const STATS_LABELS: Record<keyof CharacterStats, string> = {
  intelligence: "지능",
  discipline: "성실성",
  creativity: "창의력",
  memory: "기억력",
  fitness: "체력단련",
  stamina: "지구력",
  strength: "근력",
  communication: "소통",
  careerPotential: "커리어",
  employability: "취업력",
  academic: "학업",
  portfolioScore: "포트폴리오",
  interviewScore: "면접",
  certificateScore: "자격증",
  performance: "업무성과",
  luck: "행운",
};

const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return `${r > 0 ? "+" : ""}${r}`;
};

/** 효과를 "기분 +8 · 배고픔 +10 · 체중 +0.15kg · EXP +3" 형태로 요약 (0은 생략) */
export function formatEffect(
  e: ActionEffect,
  opts: { exp?: boolean } = {},
): string {
  const { exp = true } = opts;
  const parts: string[] = [];
  if (e.status) {
    for (const [k, v] of Object.entries(e.status)) {
      if (!v) continue;
      const label = STATUS_LABELS[k as keyof CharacterStatus] ?? k;
      parts.push(`${label} ${fmt(v)}${k === "weight" ? "kg" : ""}`);
    }
  }
  if (e.stats) {
    for (const [k, v] of Object.entries(e.stats)) {
      if (!v) continue;
      parts.push(`${STATS_LABELS[k as keyof CharacterStats] ?? k} ${fmt(v)}`);
    }
  }
  if (exp && e.exp) parts.push(`EXP +${e.exp}`);
  return parts.join(" · ");
}
