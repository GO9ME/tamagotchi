import { describe, expect, it } from "vitest";
import { createCharacter } from "@/lib/game/character";
import {
  DEFAULT_HOUSING,
  HOME_APPRECIATION,
  HOUSING_OPTIONS,
  applyMove,
  housingEquity,
  housingHappiness,
  planMove,
  processHousingYear,
} from "@/lib/game/housing";
import { netWorth } from "@/lib/game/assets";
import type { Character, JobState } from "@/types/character";

const withAgeSavings = (ageYears: number, savings: number): Character => ({
  ...createCharacter("u_test", "테스트", "blush", "male", 0),
  ageYears,
  savings,
});

const devJob = (salaryManwon: number): JobState => ({
  family: "dev",
  company: "midsize",
  grade: "newbie",
  title: "개발/IT 사원",
  salaryManwon,
  hiredAt: 0,
  hiredAtAge: 26,
});

describe("HOUSING_OPTIONS — 카탈로그 불변식", () => {
  it("본가가 첫 옵션이고, 대출 옵션에는 한도·이자율이 함께 정의된다", () => {
    expect(HOUSING_OPTIONS[0].key).toBe("parents");
    for (const o of HOUSING_OPTIONS) {
      if (o.loanLtv != null) expect(o.loanRate).toBeGreaterThan(0);
      if (o.kind === "monthly") expect(o.yearlyRent).toBeGreaterThan(0);
    }
  });
});

describe("planMove — 이사 견적", () => {
  it("같은 곳으로는 이사 불가, 나이 미달 불가", () => {
    const c = withAgeSavings(30, 99999);
    expect(planMove(c, "parents").ok).toBe(false); // 이미 본가
    expect(planMove(withAgeSavings(19, 99999), "monthlyOneRoom").ok).toBe(false); // 20살부터
    expect(planMove(withAgeSavings(24, 999999), "aptOwned").ok).toBe(false); // 25살부터
  });

  it("현금이 충분하면 대출 0, 부족하면 부족분만 대출(한도 내)", () => {
    // 전세 3억: 저축 3억 → 무대출
    const rich = planMove(withAgeSavings(30, 30000), "jeonseOfficetel");
    expect(rich).toMatchObject({ ok: true, loan: 0, cashNeeded: 30000 });
    // 저축 1억 → 대출 2억 (한도 2.4억 내)
    const mid = planMove(withAgeSavings(30, 10000), "jeonseOfficetel");
    expect(mid).toMatchObject({ ok: true, loan: 20000, cashNeeded: 10000 });
    // 저축 5천 → 대출 2.5억 필요 > 한도 2.4억 → 불가
    const poor = planMove(withAgeSavings(30, 5000), "jeonseOfficetel");
    expect(poor.ok).toBe(false);
    expect(poor.reason).toContain("부족");
  });

  it("기존 보증금/집은 회수액(equityBack)으로 계산에 포함된다", () => {
    const c = withAgeSavings(30, 0);
    c.housing = { option: "jeonseOfficetel", deposit: 30000, loanBalance: 10000, homeValue: 0 };
    // 회수 2억(보증금3억-대출1억) → 매매 6억: 대출 4억 필요 > LTV 4.2억 → 가능
    const plan = planMove(c, "aptOwned");
    expect(plan.equityBack).toBe(20000);
    expect(plan).toMatchObject({ ok: true, loan: 40000 });
  });
});

describe("applyMove — 이사 실행", () => {
  it("전세 이사: 보증금 기록 + 대출 잔액 + 저축 정산", () => {
    const c = withAgeSavings(30, 10000);
    const moved = applyMove(c, "jeonseOfficetel");
    expect(moved.housing).toEqual({
      option: "jeonseOfficetel",
      deposit: 30000,
      loanBalance: 20000,
      homeValue: 0,
    });
    expect(moved.savings).toBe(0); // 1억 전액 투입
    // 순자산 보존: 이사는 자산 형태만 바뀐다 (저축0 + 보증금3억 - 대출2억 = 1억)
    expect(netWorth(moved)).toBe(netWorth(c));
  });

  it("자가 매매: homeValue 기록, 본가 복귀 시 전부 회수", () => {
    const c = withAgeSavings(30, 60000);
    const owned = applyMove(c, "aptOwned");
    expect(owned.housing.homeValue).toBe(60000);
    expect(owned.savings).toBe(0);
    const back = applyMove(owned, "parents");
    expect(back.housing).toEqual(DEFAULT_HOUSING);
    expect(back.savings).toBe(60000); // 매각 회수
  });
});

describe("processHousingYear — 연간 주거비", () => {
  it("본가는 0원", () => {
    expect(processHousingYear(withAgeSavings(30, 1000)).savingsDelta).toBe(0);
  });

  it("월세는 연 월세 총액만큼 저축 감소", () => {
    const c = withAgeSavings(30, 1000);
    c.housing = { option: "monthlyOneRoom", deposit: 1000, loanBalance: 0, homeValue: 0 };
    const r = processHousingYear(c);
    expect(r.savingsDelta).toBe(-720);
  });

  it("전세대출: 이자(3.8%) + 취업 시 연봉 12% 원금 상환", () => {
    const c = { ...withAgeSavings(30, 5000), job: devJob(5000) };
    c.housing = { option: "jeonseOfficetel", deposit: 30000, loanBalance: 20000, homeValue: 0 };
    const r = processHousingYear(c);
    const interest = Math.round(20000 * 0.038); // 760
    const principal = Math.round(5000 * 0.12); // 600
    expect(r.savingsDelta).toBe(-(interest + principal));
    expect(r.character.housing.loanBalance).toBe(20000 - principal);
  });

  it("무직이면 이자만 내고 원금은 유지", () => {
    const c = withAgeSavings(30, 5000);
    c.housing = { option: "jeonseOfficetel", deposit: 30000, loanBalance: 20000, homeValue: 0 };
    const r = processHousingYear(c);
    expect(r.savingsDelta).toBe(-Math.round(20000 * 0.038));
    expect(r.character.housing.loanBalance).toBe(20000);
  });

  it("자가는 집값이 매년 +2% 오른다", () => {
    const c = withAgeSavings(30, 0);
    c.housing = { option: "aptOwned", deposit: 0, loanBalance: 0, homeValue: 60000 };
    const r = processHousingYear(c);
    expect(r.character.housing.homeValue).toBe(Math.round(60000 * (1 + HOME_APPRECIATION)));
  });
});

describe("유산 연동 — 주거 순자산이 상속에 포함된다", () => {
  it("자가(대출 낀)를 보유한 부모의 유산 = (저축+집값-대출)의 20%", async () => {
    const { inheritanceAmount } = await import("@/lib/game/legacy");
    const c = withAgeSavings(60, 10000);
    c.housing = { option: "aptOwned", deposit: 0, loanBalance: 20000, homeValue: 70000 };
    // netWorth = 10000 + 0(차 없음) + (70000-20000) = 60000 → 20% = 12000
    expect(inheritanceAmount(c)).toBe(12000);
  });
});

describe("housingEquity / housingHappiness", () => {
  it("순자산 = 보증금 + 집값 − 대출", () => {
    expect(
      housingEquity({ option: "aptOwned", deposit: 0, loanBalance: 42000, homeValue: 61200 }),
    ).toBe(19200);
    expect(housingEquity(undefined)).toBe(0);
  });

  it("행복 보너스: 본가/월세 0, 전세 +1, 자가 +2", () => {
    expect(housingHappiness(DEFAULT_HOUSING)).toBe(0);
    expect(housingHappiness({ option: "monthlyOneRoom", deposit: 1000, loanBalance: 0, homeValue: 0 })).toBe(0);
    expect(housingHappiness({ option: "jeonseOfficetel", deposit: 30000, loanBalance: 0, homeValue: 0 })).toBe(1);
    expect(housingHappiness({ option: "aptRiver", deposit: 0, loanBalance: 0, homeValue: 200000 })).toBe(2);
  });
});
