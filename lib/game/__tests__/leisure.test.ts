import { describe, expect, it } from "vitest";
import { createCharacter } from "@/lib/game/character";
import {
  LEISURE_ACTIVITIES,
  canDoLeisure,
  leisureCooldownKey,
  leisureDef,
} from "@/lib/game/leisure";
import type { Character } from "@/types/character";

/** 기본 캐릭터에 나이/저축만 덮어쓴 테스트 픽스처 */
const withAgeSavings = (ageYears: number, savings: number): Character => ({
  ...createCharacter("u_test", "테스트", "blush", "male", 0),
  ageYears,
  savings,
});

describe("LEISURE_ACTIVITIES — 카탈로그 불변식", () => {
  it("키가 유일하고, 나이 오름차순으로 정렬되어 있다", () => {
    const keys = LEISURE_ACTIVITIES.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (let i = 1; i < LEISURE_ACTIVITIES.length; i++) {
      expect(LEISURE_ACTIVITIES[i].minAge).toBeGreaterThanOrEqual(
        LEISURE_ACTIVITIES[i - 1].minAge,
      );
    }
  });

  it("모든 활동은 양수 비용·양수 행복도·양수 쿨타임을 가진다", () => {
    for (const l of LEISURE_ACTIVITIES) {
      expect(l.cost).toBeGreaterThan(0);
      expect(l.happinessDelta).toBeGreaterThan(0);
      expect(l.cooldownMs).toBeGreaterThan(0);
    }
  });

  it("leisureDef 는 존재하는 키를 찾고, 없는 키는 undefined", () => {
    expect(leisureDef("shopping")?.label).toBe("옷 쇼핑");
    expect(leisureDef("nope")).toBeUndefined();
  });
});

describe("canDoLeisure — 실행 게이트", () => {
  it("나이 미달이면 불가(경계: minAge-1 불가, minAge 가능)", () => {
    expect(canDoLeisure(withAgeSavings(12, 9999), "shopping", 0).ok).toBe(false);
    expect(canDoLeisure(withAgeSavings(13, 9999), "shopping", 0).ok).toBe(true);
  });

  it("저축 부족이면 불가(경계: cost-1 불가, cost 가능)", () => {
    expect(canDoLeisure(withAgeSavings(30, 49), "shopping", 0).ok).toBe(false);
    expect(canDoLeisure(withAgeSavings(30, 50), "shopping", 0).ok).toBe(true);
  });

  it("쿨타임 중이면 불가, 지나면 가능", () => {
    const c = withAgeSavings(30, 9999);
    c.cooldowns = { [leisureCooldownKey("shopping")]: 1000 };
    expect(canDoLeisure(c, "shopping", 999).ok).toBe(false);
    expect(canDoLeisure(c, "shopping", 1000).ok).toBe(true);
  });

  it("알 수 없는 키는 불가", () => {
    expect(canDoLeisure(withAgeSavings(30, 9999), "nope", 0).ok).toBe(false);
  });

  it("해외여행은 25살+저축 400 필요", () => {
    expect(canDoLeisure(withAgeSavings(24, 9999), "overseasTrip", 0).ok).toBe(false);
    expect(canDoLeisure(withAgeSavings(25, 399), "overseasTrip", 0).ok).toBe(false);
    expect(canDoLeisure(withAgeSavings(25, 400), "overseasTrip", 0).ok).toBe(true);
  });
});
