import { describe, expect, it } from "vitest";

import { createCharacter } from "../character";
import {
  canPlayMinigame,
  LUCK_CAP,
  LUCK_PER_PLAY,
  luckBonus,
  MINIGAME_ENERGY_COST,
  MINIGAME_MIN_AGE,
  playDarts,
  playFishing,
  playGacha,
  playRoulette,
  playSlots,
} from "../minigame";

const make = () => {
  const c = createCharacter("u_test", "테스트", "blush", "male", 0);
  c.ageYears = 10; // 미니게임 해금 나이 이상
  return c;
};

describe("minigame", () => {
  it("해금 나이 미만이면 플레이 불가", () => {
    const c = make();
    c.ageYears = MINIGAME_MIN_AGE - 1;
    expect(canPlayMinigame(c).ok).toBe(false);
  });

  it("체력이 부족하면 플레이 불가, 충분하면 가능", () => {
    const c = make();
    c.status.energy = MINIGAME_ENERGY_COST - 1;
    expect(canPlayMinigame(c).ok).toBe(false);
    c.status.energy = MINIGAME_ENERGY_COST;
    expect(canPlayMinigame(c).ok).toBe(true);
  });

  it("행운 보너스: 초기값(5)은 0, 상한 15%p", () => {
    const c = make();
    expect(luckBonus(c)).toBe(0);
    c.stats.luck = 100;
    expect(luckBonus(c)).toBe(15);
  });

  it("행운은 상한까지만 쌓인다", () => {
    const c = make();
    expect(playSlots(c, 0.999).effect.stats?.luck).toBe(LUCK_PER_PLAY);
    c.stats.luck = LUCK_CAP;
    expect(playSlots(c, 0.999).effect.stats?.luck).toBe(0);
  });

  it("슬롯: rand 낮으면 잭팟(+저축), 높으면 꽝 — 둘 다 체력 소모", () => {
    const c = make();
    const jackpot = playSlots(c, 0);
    expect(jackpot.fx?.tier).toBe("jackpot");
    expect(jackpot.savingsDelta).toBeGreaterThan(0);
    const miss = playSlots(c, 0.999);
    expect(miss.fx).toBeNull();
    expect(miss.savingsDelta).toBe(0);
    for (const r of [jackpot, miss]) {
      expect(r.effect.status?.energy).toBe(-MINIGAME_ENERGY_COST);
    }
  });

  it("뽑기: 희귀 캡슐은 스탯 포인트 +1, 일반 캡슐은 0", () => {
    const c = make();
    const rare = playGacha(c, 0, 0);
    expect(rare.statPointsDelta).toBe(1);
    const common = playGacha(c, 0.999, 0.5);
    expect(common.statPointsDelta).toBe(0);
    expect(common.effect.status?.energy).toBe(-MINIGAME_ENERGY_COST);
  });

  it("뽑기 보통 캡슐: rand2 로 배분 스탯 하나가 +1", () => {
    const c = make();
    // rareP(4%) 를 넘기고 uncommonP(22%) 안쪽
    const r = playGacha(c, 0.1, 0);
    const gained = Object.entries(r.effect.stats ?? {}).filter(
      ([k, v]) => k !== "luck" && v === 1,
    );
    expect(gained.length).toBe(1);
  });
});

describe("룰렛", () => {
  it("rand 낮으면 대박(+80만원), 높으면 꽝 — 둘 다 체력 소모", () => {
    const c = make();
    const jackpot = playRoulette(c, 0);
    expect(jackpot.fx?.tier).toBe("jackpot");
    expect(jackpot.savingsDelta).toBe(80);
    const miss = playRoulette(c, 0.999);
    expect(miss.fx).toBeNull();
    expect(miss.savingsDelta).toBe(0);
    for (const r of [jackpot, miss]) {
      expect(r.effect.status?.energy).toBe(-MINIGAME_ENERGY_COST);
    }
  });
});

describe("낚시", () => {
  it("rand 낮으면 월척(+60만원), 높으면 헛탕", () => {
    const c = make();
    const big = playFishing(c, 0);
    expect(big.fx?.tier).toBe("great");
    expect(big.savingsDelta).toBe(60);
    const miss = playFishing(c, 0.999);
    expect(miss.fx).toBeNull();
    expect(miss.savingsDelta).toBe(0);
  });
});

describe("다트", () => {
  it("rand 낮으면 불스아이(스탯 포인트 +1), 높으면 완전히 빗나감", () => {
    const c = make();
    const bullseye = playDarts(c, 0);
    expect(bullseye.statPointsDelta).toBe(1);
    expect(bullseye.fx?.tier).toBe("great");
    const miss = playDarts(c, 0.999);
    expect(miss.statPointsDelta).toBe(0);
    expect(miss.effect.status?.stress).toBe(3);
  });
});
