import { describe, expect, it } from "vitest";
import { createCharacter } from "@/lib/game/character";
import {
  WARDROBE_ITEMS,
  canBuyWardrobe,
  equippedOf,
  wardrobeDef,
} from "@/lib/game/wardrobe";
import { buildCharacterMatrix, DEFAULT_APPEARANCE } from "@/lib/game/sprite/characterStageConfig";
import { getCharacterVisualState } from "@/lib/game/sprite/characterVisualState";
import type { Character, WardrobeItemKey } from "@/types/character";

const withAgeSavings = (ageYears: number, savings: number): Character => ({
  ...createCharacter("u_test", "테스트", "blush", "male", 0),
  ageYears,
  savings,
});

const normalVs = getCharacterVisualState({
  lifeStage: "university",
  mood: 55,
  hunger: 70,
  energy: 75,
  health: 85,
  burnout: 10,
});

/** 대학생(기본 후드) 기준 매트릭스 — 착용 조합만 바꿔 비교 */
const matrixWith = (outfit?: WardrobeItemKey | null, accessory?: WardrobeItemKey | null) =>
  buildCharacterMatrix(normalVs, "university", "none", "male", DEFAULT_APPEARANCE, "normal", {
    outfit,
    accessory,
  }).join("\n");

describe("WARDROBE_ITEMS — 카탈로그 불변식", () => {
  it("키 유일 + kind별 가격 오름차순", () => {
    const keys = WARDROBE_ITEMS.map((w) => w.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const kind of ["outfit", "accessory"] as const) {
      const prices = WARDROBE_ITEMS.filter((w) => w.kind === kind).map((w) => w.price);
      expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    }
  });

  it("wardrobeDef 조회", () => {
    expect(wardrobeDef("suit")?.kind).toBe("outfit");
    expect(wardrobeDef("cap")?.kind).toBe("accessory");
  });
});

describe("canBuyWardrobe — 구매 게이트", () => {
  it("이미 소장한 아이템은 불가", () => {
    const c = withAgeSavings(20, 9999);
    c.wardrobe = ["cap"];
    expect(canBuyWardrobe(c, "cap").ok).toBe(false);
    expect(canBuyWardrobe(c, "beanie").ok).toBe(true);
  });

  it("나이/저축 경계", () => {
    expect(canBuyWardrobe(withAgeSavings(16, 9999), "suit").ok).toBe(false); // 정장 17살부터
    expect(canBuyWardrobe(withAgeSavings(17, 9999), "suit").ok).toBe(true);
    expect(canBuyWardrobe(withAgeSavings(20, 29), "stripeTee").ok).toBe(false);
    expect(canBuyWardrobe(withAgeSavings(20, 30), "stripeTee").ok).toBe(true);
  });
});

describe("스프라이트 반영 — 착용하면 매트릭스가 실제로 바뀐다", () => {
  it("의상 4종은 기본 복장과 다르고 서로도 다르다", () => {
    const base = matrixWith(null, null);
    const outfits: WardrobeItemKey[] = ["stripeTee", "hoodie", "jacket", "suit"];
    const rendered = outfits.map((o) => matrixWith(o, null));
    // hoodie 는 대학생 기본 복장과 동일 정의(base S + hood)이므로 제외하고 비교
    expect(rendered[0]).not.toBe(base); // stripeTee
    expect(rendered[2]).not.toBe(base); // jacket
    expect(rendered[3]).not.toBe(base); // suit
    expect(new Set(rendered).size).toBe(outfits.length); // 서로 전부 다름
  });

  it("정장은 넥타이(7열 세로 K)를, 재킷은 지퍼 손잡이(W)를 그린다", () => {
    expect(matrixWith("suit", null)).toContain("K"); // sanity
    const jacket = buildCharacterMatrix(
      normalVs, "university", "none", "male", DEFAULT_APPEARANCE, "normal",
      { outfit: "jacket" },
    );
    expect(jacket.some((row) => row.includes("W"))).toBe(true);
  });

  it("모자(캡/비니)는 머리 윗줄(row 0)을 덮고, 리본/목도리도 매트릭스를 바꾼다", () => {
    const base = matrixWith(null, null);
    const cap = buildCharacterMatrix(
      normalVs, "university", "none", "male", DEFAULT_APPEARANCE, "normal",
      { accessory: "cap" },
    );
    // row 0 cols 5-10 이 모두 S(크라운)
    expect(cap[0].slice(5, 11)).toBe("SSSSSS");
    expect(matrixWith(null, "beanie")).not.toBe(base);
    expect(matrixWith(null, "ribbon")).not.toBe(base);
    expect(matrixWith(null, "scarf")).not.toBe(base);
  });

  it("아기(tiny)는 옷장 착용이 무시된다(전용 조립 경로)", () => {
    const babyVs = getCharacterVisualState({
      lifeStage: "baby", mood: 55, hunger: 70, energy: 75, health: 85, burnout: 10,
    });
    const plain = buildCharacterMatrix(babyVs, "baby").join("\n");
    const dressed = buildCharacterMatrix(
      babyVs, "baby", "none", "male", DEFAULT_APPEARANCE, "normal",
      { outfit: "suit", accessory: "cap" },
    ).join("\n");
    expect(dressed).toBe(plain);
  });
});

describe("equippedOf", () => {
  it("미설정이면 null 로 정규화", () => {
    const c = withAgeSavings(20, 0);
    delete (c as Partial<Character>).equippedOutfit;
    delete (c as Partial<Character>).equippedAccessory;
    expect(equippedOf(c)).toEqual({ outfit: null, accessory: null });
  });
});
