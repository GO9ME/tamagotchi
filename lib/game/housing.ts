// ---------------------------------------------------------------------------
// housing.ts
// 주거 시스템 — 본가 → 원룸 월세 → 오피스텔 전세 → 아파트 매매(한강뷰까지).
// 실제 한국 주거 구조를 본뜬 현실적 수치(만원):
//   월세: 보증금 1,000 + 월 60 (연 720)
//   전세: 보증금 3억, 전세자금대출 한도 80% · 연 3.8% (이자만, 원금은 연봉 비례 상환)
//   매매: 6억/20억, 주택담보대출 LTV 70% · 연 4.2%, 집값 연 +2% 상승
// 이사 시 기존 보증금/집을 회수·매각해 대출을 갚고, 모자란 만큼 새 대출을 받는다.
// ---------------------------------------------------------------------------

import type { Character, HousingOptionKey, HousingState } from "@/types/character";

export interface HousingDef {
  key: HousingOptionKey;
  label: string;
  emoji: string;
  minAge: number;
  kind: "free" | "monthly" | "jeonse" | "owned";
  /** 보증금(월세/전세) 또는 매매가(자가) — 만원 */
  price: number;
  /** 연 월세 총액(월세만) */
  yearlyRent?: number;
  /** 대출 한도 비율 (전세 80% / 매매 LTV 70%) */
  loanLtv?: number;
  /** 대출 연 이자율 */
  loanRate?: number;
  desc: string;
}

export const HOUSING_OPTIONS: HousingDef[] = [
  { key: "parents", label: "본가", emoji: "👨‍👩‍👧", minAge: 0, kind: "free", price: 0, desc: "부모님 집 — 주거비 0원, 눈칫밥은 덤" },
  { key: "monthlyOneRoom", label: "원룸 월세", emoji: "🚪", minAge: 20, kind: "monthly", price: 1000, yearlyRent: 720, desc: "보증금 1천 · 월 60만원 — 독립의 시작" },
  { key: "jeonseOfficetel", label: "오피스텔 전세", emoji: "🏢", minAge: 20, kind: "jeonse", price: 30000, loanLtv: 0.8, loanRate: 0.038, desc: "보증금 3억 · 전세대출 최대 80% (연 3.8%)" },
  { key: "aptOwned", label: "아파트 매매", emoji: "🏡", minAge: 25, kind: "owned", price: 60000, loanLtv: 0.7, loanRate: 0.042, desc: "6억 · 주담대 LTV 70% (연 4.2%) · 집값 연 +2%" },
  { key: "aptRiver", label: "한강뷰 아파트", emoji: "🌉", minAge: 30, kind: "owned", price: 200000, loanLtv: 0.7, loanRate: 0.042, desc: "20억 · 주담대 LTV 70% (연 4.2%) · 집값 연 +2%" },
];

/** 자가 집값 연 상승률 */
export const HOME_APPRECIATION = 0.02;
/** 취업 중일 때 연간 대출 원금 자동 상환 = 연봉의 12% */
export const LOAN_REPAY_SALARY_RATE = 0.12;

export function housingDef(key: HousingOptionKey): HousingDef {
  return HOUSING_OPTIONS.find((h) => h.key === key) ?? HOUSING_OPTIONS[0];
}

export const DEFAULT_HOUSING: HousingState = {
  option: "parents",
  deposit: 0,
  loanBalance: 0,
  homeValue: 0,
};

/** 현재 주거의 순자산 기여분 = 보증금 + 집 시세 − 대출 잔액 */
export function housingEquity(h: HousingState | undefined): number {
  if (!h) return 0;
  return h.deposit + h.homeValue - h.loanBalance;
}

/** 주거 안정감의 연간 행복 보너스 — 전세 +1, 자가 +2 */
export function housingHappiness(h: HousingState | undefined): number {
  const kind = housingDef(h?.option ?? "parents").kind;
  return kind === "owned" ? 2 : kind === "jeonse" ? 1 : 0;
}

export function housingLabel(h: HousingState | undefined): string {
  const def = housingDef(h?.option ?? "parents");
  return `${def.emoji} ${def.label}`;
}

export interface MovePlan {
  ok: boolean;
  reason?: string;
  /** 필요 총액(보증금/매매가) */
  required: number;
  /** 새로 받는 대출 */
  loan: number;
  /** 실제로 나가는 현금(회수 자산 반영 전 기준의 부족분) */
  cashNeeded: number;
  /** 기존 주거 회수액(보증금/매각 − 기존 대출 상환) */
  equityBack: number;
}

/**
 * 이사 견적 — 기존 보증금/집을 회수해 대출을 갚고, 새 집 비용의 부족분은
 * 한도 내에서 자동으로 대출을 받는다(대출 최소화: 현금 우선).
 */
export function planMove(c: Character, key: HousingOptionKey, ageYears = c.ageYears): MovePlan {
  const def = housingDef(key);
  const cur = c.housing ?? DEFAULT_HOUSING;
  const equityBack = housingEquity(cur);
  const base: MovePlan = { ok: false, required: def.price, loan: 0, cashNeeded: 0, equityBack };

  if (cur.option === key) return { ...base, reason: "이미 여기 살고 있어요." };
  if (ageYears < def.minAge) return { ...base, reason: `${def.minAge}살부터 가능해요.` };

  const cashAvailable = Math.max(0, c.savings) + equityBack;
  const maxLoan = Math.round(def.price * (def.loanLtv ?? 0));
  const loan = Math.max(0, def.price - cashAvailable);
  if (loan > maxLoan) {
    const shortage = loan - maxLoan;
    return { ...base, loan: maxLoan, reason: `대출 한도를 채워도 현금 ${shortage.toLocaleString()}만원이 부족해요.` };
  }
  return { ...base, ok: true, loan, cashNeeded: def.price - loan };
}

/** 이사 실행 — planMove 가 ok 일 때만 호출 */
export function applyMove(c: Character, key: HousingOptionKey): Character {
  const plan = planMove(c, key);
  const def = housingDef(key);
  const next: HousingState = {
    option: key,
    deposit: def.kind === "monthly" || def.kind === "jeonse" ? def.price : 0,
    loanBalance: plan.loan,
    homeValue: def.kind === "owned" ? def.price : 0,
  };
  return {
    ...c,
    savings: c.savings + plan.equityBack - plan.cashNeeded,
    housing: next,
  };
}

/**
 * 연간 주거비 처리(리뷰 시점) — 월세 납부, 대출 이자, 원금 자동 상환, 집값 상승.
 * 원금 상환은 현금 유출이지만 부채도 함께 줄어 순자산은 불변(이자·월세만 순손실).
 */
export function processHousingYear(c: Character): {
  character: Character;
  savingsDelta: number;
} {
  const h = c.housing ?? DEFAULT_HOUSING;
  const def = housingDef(h.option);
  let cost = 0;
  let loanBalance = h.loanBalance;
  let homeValue = h.homeValue;

  if (def.kind === "monthly") cost += def.yearlyRent ?? 0;

  if (loanBalance > 0 && def.loanRate) {
    cost += Math.round(loanBalance * def.loanRate); // 이자
    if (c.job) {
      const principal = Math.min(loanBalance, Math.round(c.job.salaryManwon * LOAN_REPAY_SALARY_RATE));
      cost += principal;
      loanBalance -= principal;
    }
  }

  if (def.kind === "owned" && homeValue > 0) {
    homeValue = Math.round(homeValue * (1 + HOME_APPRECIATION));
  }

  if (cost === 0 && loanBalance === h.loanBalance && homeValue === h.homeValue) {
    return { character: c, savingsDelta: 0 };
  }
  return {
    character: {
      ...c,
      savings: c.savings - cost,
      housing: { ...h, loanBalance, homeValue },
    },
    savingsDelta: -cost,
  };
}
