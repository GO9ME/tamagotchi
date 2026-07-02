import { describe, expect, it } from "vitest";
import { ROOM_ITEMS, canBuyRoomItem, roomItemDef } from "@/lib/game/roomItems";
import type { RoomItemKey } from "@/types/character";

describe("ROOM_ITEMS — 상점 목록 불변식", () => {
  it("가격 오름차순으로 정렬돼 있다 (상점 목록 순서 그대로 사용)", () => {
    for (let i = 1; i < ROOM_ITEMS.length; i++) {
      expect(ROOM_ITEMS[i].price).toBeGreaterThanOrEqual(ROOM_ITEMS[i - 1].price);
    }
  });

  it("key 는 중복 없이 유일하다", () => {
    const keys = ROOM_ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("모든 아이템은 양수 가격과 라벨을 가진다", () => {
    for (const item of ROOM_ITEMS) {
      expect(item.price).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

describe("roomItemDef — 키 조회", () => {
  it("존재하는 키면 정의를 돌려준다", () => {
    const def = roomItemDef("puppy");
    expect(def?.label).toBe("강아지");
    expect(def?.price).toBe(500);
  });

  it("없는 키면 undefined", () => {
    expect(roomItemDef("spaceship" as RoomItemKey)).toBeUndefined();
  });
});

describe("canBuyRoomItem — 구매 가능 판정", () => {
  it("알 수 없는 아이템은 사유와 함께 거절", () => {
    const r = canBuyRoomItem("spaceship" as RoomItemKey, [], 99999);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("알 수 없는 아이템이에요.");
  });

  it("이미 보유한 아이템은 저축이 충분해도 거절", () => {
    const r = canBuyRoomItem("rug", ["rug"], 99999);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("이미 가지고 있어요.");
  });

  it("저축이 가격보다 1이라도 모자라면 거절", () => {
    const rug = roomItemDef("rug")!;
    const r = canBuyRoomItem("rug", [], rug.price - 1);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("저축이 부족해요.");
  });

  it("저축이 정확히 가격과 같으면 구매 가능 (사유 없음)", () => {
    const rug = roomItemDef("rug")!;
    const r = canBuyRoomItem("rug", [], rug.price);
    expect(r.ok).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it("다른 아이템을 보유 중이어도 새 아이템 구매엔 영향 없다", () => {
    expect(canBuyRoomItem("lamp", ["rug", "puppy"], 80).ok).toBe(true);
  });
});
