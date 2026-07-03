import { describe, expect, it } from "vitest";

import { assetValue, canBuyAsset, ownedTier } from "../assets";
import type { AssetKey } from "@/types/character";

describe("ownedTier — 같은 티어의 어느 차종을 소유해도 정확한 티어를 돌려준다", () => {
  it("티어2 세 차종(하이브리드/세단/SUV) 모두 티어 2를 반환한다", () => {
    expect(ownedTier(["carHybrid"] as AssetKey[], "car")).toBe(2);
    expect(ownedTier(["carSedan"] as AssetKey[], "car")).toBe(2);
    expect(ownedTier(["carSuv"] as AssetKey[], "car")).toBe(2);
  });
});

describe("assetValue — 실제 소유한 차종의 가격을 반영해야 한다", () => {
  it("같은 티어라도 소유한 차종에 따라 가치가 다르다", () => {
    expect(assetValue(["carHybrid"] as AssetKey[])).toBe(5800);
    expect(assetValue(["carSedan"] as AssetKey[])).toBe(6000);
    expect(assetValue(["carSuv"] as AssetKey[])).toBe(6200);
  });
});

describe("canBuyAsset — 업그레이드 차액은 실제 소유한 차종 기준이어야 한다", () => {
  it("저렴한 하이브리드를 소유했을 때 수입차 업그레이드 비용은 하이브리드 가격 기준 차액이다", () => {
    const result = canBuyAsset("carImport", ["carHybrid"] as AssetKey[], 999999);
    expect(result.cost).toBe(15000 - 5800);
  });

  it("더 비싼 SUV를 소유했을 때는 같은 업그레이드 비용이 더 적다", () => {
    const result = canBuyAsset("carImport", ["carSuv"] as AssetKey[], 999999);
    expect(result.cost).toBe(15000 - 6200);
  });
});
