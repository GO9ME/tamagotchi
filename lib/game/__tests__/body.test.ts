import { describe, it, expect } from "vitest";
import { rollHeightPotential, heightForAge, heightBuild } from "@/lib/game/body";

describe("rollHeightPotential", () => {
  it("남성: rand 0/0.5/1 에서 162 ~ 188 범위(중심 175)", () => {
    expect(rollHeightPotential("male", 0, 0)).toBe(162);
    expect(rollHeightPotential("male", 0.5, 0.5)).toBe(175);
    expect(rollHeightPotential("male", 1, 1)).toBe(188);
  });

  it("여성: rand 0/0.5/1 에서 150 ~ 174 범위(중심 162)", () => {
    expect(rollHeightPotential("female", 0, 0)).toBe(150);
    expect(rollHeightPotential("female", 0.5, 0.5)).toBe(162);
    expect(rollHeightPotential("female", 1, 1)).toBe(174);
  });

  it("rand 2개의 평균으로 중심화된다 (0,1) == (0.5,0.5)", () => {
    expect(rollHeightPotential("male", 0, 1)).toBe(
      rollHeightPotential("male", 0.5, 0.5),
    );
    expect(rollHeightPotential("female", 1, 0)).toBe(
      rollHeightPotential("female", 0.5, 0.5),
    );
  });
});

describe("heightForAge", () => {
  it("0세(이하)는 출생 키 50cm 고정", () => {
    expect(heightForAge(0, 188, "male")).toBe(50);
    expect(heightForAge(0, 150, "female")).toBe(50);
    expect(heightForAge(-1, 175, "male")).toBe(50);
  });

  it("남성은 19세 이상에서 성인 목표키 100% 도달", () => {
    expect(heightForAge(19, 175, "male")).toBe(175);
    expect(heightForAge(30, 188, "male")).toBe(188);
    // 18세에는 아직 99.9% (반올림 전 미달)
    expect(heightForAge(18, 175, "male")).toBe(Math.round(175 * 0.999));
  });

  it("여성 앵커는 19세에 100%, 17세는 99.5%", () => {
    expect(heightForAge(19, 162, "female")).toBe(162);
    expect(heightForAge(17, 162, "female")).toBe(Math.round(162 * 0.995));
  });

  it("앵커 사이는 선형보간된다 (남 5세 = 4~6세 중간)", () => {
    // 남아 앵커: [4, 57.7], [6, 66.6] → 5세는 62.15%
    expect(heightForAge(5, 180, "male")).toBe(Math.round(180 * 0.6215));
  });

  it("나이 증가에 따라 단조 비감소한다", () => {
    for (const gender of ["male", "female"] as const) {
      let prev = heightForAge(0, 180, gender);
      for (let age = 1; age <= 25; age++) {
        const h = heightForAge(age, 180, gender);
        expect(h).toBeGreaterThanOrEqual(prev);
        prev = h;
      }
    }
  });

  it("같은 나이·같은 목표키면 여아가 남아보다 성장 완성도가 높다", () => {
    // 사춘기 구간(12세): 여 93.4% > 남 85.8%
    expect(heightForAge(12, 170, "female")).toBeGreaterThan(
      heightForAge(12, 170, "male"),
    );
  });
});

describe("heightBuild", () => {
  it("남성: 평균 175 기준 ±8 경계", () => {
    expect(heightBuild(183, "male")).toBe("tall"); // avg+8 → tall
    expect(heightBuild(182, "male")).toBe("average");
    expect(heightBuild(175, "male")).toBe("average");
    expect(heightBuild(168, "male")).toBe("average");
    expect(heightBuild(167, "male")).toBe("short"); // avg-8 → short
  });

  it("여성: 평균 162 기준 ±8 경계", () => {
    expect(heightBuild(170, "female")).toBe("tall");
    expect(heightBuild(169, "female")).toBe("average");
    expect(heightBuild(155, "female")).toBe("average");
    expect(heightBuild(154, "female")).toBe("short");
  });
});
