import { describe, expect, it } from "vitest";
import {
  ageFromBornAt,
  cappedStageForAge,
  msUntilNextAge,
  nextStageInfo,
  stageForAge,
} from "@/lib/game/growth";
import { clamp, round2 } from "@/lib/game/clamp";
import { GAME_YEAR_MS, LIFE_STAGES, MAX_AGE } from "@/lib/game/constants";

const BORN = 1_000_000; // 임의의 출생 시각(ms)

describe("ageFromBornAt", () => {
  it("출생 직후에는 0살", () => {
    expect(ageFromBornAt(BORN, BORN)).toBe(0);
  });

  it("1년 경과 직전까지는 0살, 정확히 1년이면 1살 (floor)", () => {
    expect(ageFromBornAt(BORN, BORN + GAME_YEAR_MS - 1)).toBe(0);
    expect(ageFromBornAt(BORN, BORN + GAME_YEAR_MS)).toBe(1);
    expect(ageFromBornAt(BORN, BORN + 2.9 * GAME_YEAR_MS)).toBe(2);
  });

  it("now가 bornAt보다 과거여도 음수가 아닌 0으로 클램프", () => {
    expect(ageFromBornAt(BORN, BORN - 5 * GAME_YEAR_MS)).toBe(0);
  });
});

describe("stageForAge — LIFE_STAGES 경계", () => {
  it("각 단계의 minAge에서 해당 단계로 전환되고, minAge-1은 이전 단계", () => {
    // LIFE_STAGES 자체를 진실의 원천으로 삼아 모든 전환 경계를 검사
    for (let i = 1; i < LIFE_STAGES.length; i++) {
      const prev = LIFE_STAGES[i - 1];
      const cur = LIFE_STAGES[i];
      expect(stageForAge(cur.minAge)).toBe(cur.stage);
      expect(stageForAge(cur.minAge - 1)).toBe(prev.stage);
    }
  });

  it("0살은 baby, 최고 단계 이후 나이도 마지막 단계 유지", () => {
    expect(stageForAge(0)).toBe("baby");
    const last = LIFE_STAGES[LIFE_STAGES.length - 1];
    expect(stageForAge(last.minAge + 30)).toBe(last.stage);
  });
});

describe("cappedStageForAge — 취업 게이트", () => {
  it("직장인(26) 이상 나이라도 미취업이면 jobseeker로 캡", () => {
    expect(cappedStageForAge(26, false)).toBe("jobseeker");
    expect(cappedStageForAge(38, false)).toBe("jobseeker"); // senior 나이
    expect(cappedStageForAge(60, false)).toBe("jobseeker"); // retirement 나이
  });

  it("취업했으면 나이에 따른 자연 단계 그대로", () => {
    expect(cappedStageForAge(26, true)).toBe("employee");
    expect(cappedStageForAge(38, true)).toBe("senior");
    expect(cappedStageForAge(60, true)).toBe("retirement");
  });

  it("employee 미만 단계는 취업 여부와 무관", () => {
    expect(cappedStageForAge(20, false)).toBe("university");
    expect(cappedStageForAge(25, false)).toBe("jobseeker");
    expect(cappedStageForAge(25, true)).toBe("jobseeker");
  });
});

describe("msUntilNextAge", () => {
  it("MAX_AGE 도달 시 null", () => {
    expect(msUntilNextAge(BORN, MAX_AGE, BORN + MAX_AGE * GAME_YEAR_MS)).toBeNull();
    expect(msUntilNextAge(BORN, MAX_AGE + 5, BORN)).toBeNull();
  });

  it("한 해의 중간이면 남은 ms 반환", () => {
    const halfYear = GAME_YEAR_MS / 2;
    expect(msUntilNextAge(BORN, 0, BORN + halfYear)).toBe(GAME_YEAR_MS - halfYear);
    // 2.25년 경과 → 다음 생일까지 0.75년
    expect(msUntilNextAge(BORN, 2, BORN + 2.25 * GAME_YEAR_MS)).toBe(
      0.75 * GAME_YEAR_MS,
    );
  });

  it("생일 정각(나머지 0)에는 꽉 찬 1년 반환, now가 과거면 elapsed=0으로 처리", () => {
    expect(msUntilNextAge(BORN, 1, BORN + GAME_YEAR_MS)).toBe(GAME_YEAR_MS);
    expect(msUntilNextAge(BORN, 0, BORN - 12345)).toBe(GAME_YEAR_MS);
  });
});

describe("nextStageInfo", () => {
  it("현재 나이보다 큰 첫 minAge 단계의 라벨과 남은 년수 반환", () => {
    expect(nextStageInfo(0)).toEqual({ label: "유아", inYears: 4 });
    expect(nextStageInfo(25)).toEqual({ label: "직장인", inYears: 1 });
    expect(nextStageInfo(54)).toEqual({ label: "은퇴 준비", inYears: 1 });
  });

  it("단계 minAge와 같은 나이면 그 단계는 건너뛰고 다음 단계", () => {
    expect(nextStageInfo(4)).toEqual({ label: "초등학생", inYears: 4 });
  });

  it("마지막 단계 이후에는 null", () => {
    const lastMinAge = LIFE_STAGES[LIFE_STAGES.length - 1].minAge;
    expect(nextStageInfo(lastMinAge)).toBeNull();
    expect(nextStageInfo(lastMinAge + 10)).toBeNull();
  });
});

describe("clamp", () => {
  it("기본 범위 [0, 100]으로 제한", () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(42)).toBe(42);
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });

  it("커스텀 min/max 적용", () => {
    expect(clamp(3, 6, 120)).toBe(6);
    expect(clamp(200, 6, 120)).toBe(120);
  });

  it("NaN은 min으로 처리", () => {
    expect(clamp(NaN)).toBe(0);
    expect(clamp(NaN, 6, 120)).toBe(6);
  });
});

describe("round2", () => {
  it("소수 둘째 자리 반올림", () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.236)).toBe(1.24);
    expect(round2(5)).toBe(5);
  });

  it("부동소수점 오차 정리 (0.1 + 0.2 → 0.3)", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it("음수도 처리", () => {
    expect(round2(-1.236)).toBe(-1.24);
  });
});
