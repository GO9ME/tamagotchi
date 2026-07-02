import { describe, it, expect } from "vitest";
import {
  healthyRangeForAge,
  weightVerdict,
  bodyShapeForWeight,
  weightTickPenalty,
  weightEfficiencyMultiplier,
} from "@/lib/game/weight";
import { HEALTHY_WEIGHT } from "@/lib/game/constants";
import { createCharacter } from "@/lib/game/character";
import type { Character } from "@/types/character";

/** 원하는 몸무게/나이를 가진 캐릭터 생성 헬퍼 */
function charWithWeight(weight: number, age: number): Character {
  const c = createCharacter("user1", "테스트", "blush", "male", Date.now());
  return { ...c, ageYears: age, status: { ...c.status, weight } };
}

describe("healthyRangeForAge", () => {
  it("나이 → 성장 단계별 적정 범위를 반환한다", () => {
    expect(healthyRangeForAge(0)).toEqual(HEALTHY_WEIGHT.baby); // [8, 15]
    expect(healthyRangeForAge(20)).toEqual(HEALTHY_WEIGHT.university); // [52, 82]
    expect(healthyRangeForAge(26)).toEqual(HEALTHY_WEIGHT.employee); // [55, 85]
  });
});

describe("weightVerdict", () => {
  it("대학생(20세, 52~82kg): 경계값 포함 판정", () => {
    expect(weightVerdict(51.9, 20)).toBe("low"); // lo 미만
    expect(weightVerdict(52, 20)).toBe("healthy"); // lo 포함
    expect(weightVerdict(82, 20)).toBe("healthy"); // hi 포함
    expect(weightVerdict(82.1, 20)).toBe("high"); // hi 초과
  });

  it("아기(0세, 8~15kg): 경계값 포함 판정", () => {
    expect(weightVerdict(7, 0)).toBe("low");
    expect(weightVerdict(8, 0)).toBe("healthy");
    expect(weightVerdict(15, 0)).toBe("healthy");
    expect(weightVerdict(16, 0)).toBe("high");
  });
});

describe("bodyShapeForWeight", () => {
  it("판정 → 체형 매핑: low=slim / healthy=normal / high=heavy", () => {
    expect(bodyShapeForWeight(40, 20)).toBe("slim");
    expect(bodyShapeForWeight(70, 20)).toBe("normal");
    expect(bodyShapeForWeight(90, 20)).toBe("heavy");
  });
});

describe("weightTickPenalty", () => {
  it("적정 체중이면 페널티 없음", () => {
    expect(weightTickPenalty(70, 20, 5)).toEqual({
      health: 0,
      focus: 0,
      energy: 0,
    });
  });

  it("과체중: health/energy 감소, focus 는 유지", () => {
    const p = weightTickPenalty(90, 20, 2);
    expect(p.health).toBeCloseTo(-2.0);
    expect(p.focus).toBe(0);
    expect(p.energy).toBeCloseTo(-0.6);
  });

  it("저체중: health/focus/energy 모두 감소 (과체중보다 health 페널티가 크다)", () => {
    const p = weightTickPenalty(40, 20, 2);
    expect(p.health).toBeCloseTo(-2.4);
    expect(p.focus).toBeCloseTo(-1.2);
    expect(p.energy).toBeCloseTo(-1.2);
    expect(p.health).toBeLessThan(weightTickPenalty(90, 20, 2).health);
  });

  it("경과 시간(hours)에 비례해 스케일된다", () => {
    const one = weightTickPenalty(90, 20, 1);
    const three = weightTickPenalty(90, 20, 3);
    expect(three.health).toBeCloseTo(one.health * 3);
    expect(three.energy).toBeCloseTo(one.energy * 3);
  });
});

describe("weightEfficiencyMultiplier", () => {
  it("적정 체중이면 1, 범위 밖(과체중/저체중)이면 0.9", () => {
    expect(weightEfficiencyMultiplier(charWithWeight(70, 20))).toBe(1);
    expect(weightEfficiencyMultiplier(charWithWeight(90, 20))).toBe(0.9);
    expect(weightEfficiencyMultiplier(charWithWeight(40, 20))).toBe(0.9);
  });
});
