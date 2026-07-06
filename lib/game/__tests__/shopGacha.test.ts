import { describe, expect, it } from "vitest";

import { createCharacter } from "../character";
import { ROOM_ITEMS } from "../roomItems";
import {
  canPullGacha,
  GACHA_CONFIG,
  gachaPool,
  pullShopGacha,
} from "../shopGacha";

const make = (age = 20, savings = 100000) => {
  const c = createCharacter("u_test", "테스트", "blush", "male", 0);
  c.ageYears = age;
  c.savings = savings;
  return c;
};

describe("shopGacha", () => {
  it("옷 풀: 소장품·나이 미달 아이템 제외, 가격 오름차순", () => {
    const c = make(10); // 재킷(13)·정장(17) 미해금
    c.wardrobe = ["ribbon"];
    const pool = gachaPool(c, "wardrobe");
    const keys = pool.map((i) => i.key);
    expect(keys).not.toContain("ribbon");
    expect(keys).not.toContain("jacket");
    expect(keys).not.toContain("suit");
    for (let i = 1; i < pool.length; i++) {
      expect(pool[i].price).toBeGreaterThanOrEqual(pool[i - 1].price);
    }
  });

  it("자동차 풀: 보유 티어보다 높은 차만, 최고 티어 보유 시 뽑기 불가", () => {
    const c = make();
    c.assets = ["carSedan"];
    expect(gachaPool(c, "car").map((i) => i.key)).toEqual([
      "carImport",
      "carImportSuv",
      "carSupercar",
    ]);
    c.assets = ["carImport"];
    expect(gachaPool(c, "car")).toHaveLength(0);
    expect(canPullGacha(c, "car").ok).toBe(false);
  });

  it("저축이 티켓값보다 적으면 뽑기 불가", () => {
    const c = make(20, GACHA_CONFIG.room.price - 1);
    expect(canPullGacha(c, "room").ok).toBe(false);
    c.savings = GACHA_CONFIG.room.price;
    expect(canPullGacha(c, "room").ok).toBe(true);
  });

  it("레어 판정(rand1 낮음)은 상위 가격대, 일반은 하위 가격대", () => {
    const c = make();
    const pool = gachaPool(c, "room"); // 9개 → 레어 3개(상위), 일반 6개
    const rare = pullShopGacha(c, "room", 0, 0.99)!;
    const common = pullShopGacha(c, "room", 0.99, 0)!;
    expect(rare.rare).toBe(true);
    expect(common.rare).toBe(false);
    expect(rare.item.price).toBeGreaterThan(common.item.price);
    expect(pool.slice(-3).map((i) => i.key)).toContain(rare.item.key);
  });

  it("풀이 비면 null", () => {
    const c = make();
    c.assets = ["carImport"];
    expect(pullShopGacha(c, "car", 0.5, 0.5)).toBeNull();
  });

  it("마지막 남은 아이템은 확정 지급이므로 레어 연출 없음", () => {
    const c = make();
    c.roomItems = ROOM_ITEMS.filter((i) => i.key !== "artFrame").map((i) => i.key);
    const pull = pullShopGacha(c, "room", 0.99, 0.5)!;
    expect(pull.item.key).toBe("artFrame");
    expect(pull.rare).toBe(false);
  });
});
