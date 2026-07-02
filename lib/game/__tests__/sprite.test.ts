import { describe, expect, it } from "vitest";
import { seasonAt, skyPhaseAt } from "@/lib/game/sprite/roomAmbience";
import { rollAppearance } from "@/lib/game/sprite/characterAppearance";
import {
  actionStateForActionKey,
  getCharacterVisualState,
  jobTypeFromFamily,
  type VisualStateInput,
} from "@/lib/game/sprite/characterVisualState";
import {
  buildCharacterMatrix,
  DEFAULT_APPEARANCE,
  GRID_H,
  GRID_W,
  matrixToCells,
} from "@/lib/game/sprite/characterStageConfig";
import type { LifeStage } from "@/types/character";

// 로컬 시각 기준 결정적 타임스탬프 헬퍼
const at = (hour: number) => new Date(2026, 0, 15, hour, 0, 0).getTime();
const inMonth = (month1to12: number) => new Date(2026, month1to12 - 1, 15).getTime();

describe("roomAmbience: skyPhaseAt 시각 경계", () => {
  it("5/8/17/20시 경계에서 시간대가 바뀐다", () => {
    expect(skyPhaseAt(at(4))).toBe("night");
    expect(skyPhaseAt(at(5))).toBe("dawn"); // 새벽 시작
    expect(skyPhaseAt(at(7))).toBe("dawn");
    expect(skyPhaseAt(at(8))).toBe("day"); // 낮 시작
    expect(skyPhaseAt(at(16))).toBe("day");
    expect(skyPhaseAt(at(17))).toBe("dusk"); // 노을 시작
    expect(skyPhaseAt(at(19))).toBe("dusk");
    expect(skyPhaseAt(at(20))).toBe("night"); // 밤 시작
    expect(skyPhaseAt(at(0))).toBe("night");
  });
});

describe("roomAmbience: seasonAt 월 경계", () => {
  it("3-5월 봄 / 6-8월 여름 / 9-11월 가을 / 12-2월 겨울", () => {
    expect(seasonAt(inMonth(2))).toBe("winter");
    expect(seasonAt(inMonth(3))).toBe("spring");
    expect(seasonAt(inMonth(5))).toBe("spring");
    expect(seasonAt(inMonth(6))).toBe("summer");
    expect(seasonAt(inMonth(8))).toBe("summer");
    expect(seasonAt(inMonth(9))).toBe("autumn");
    expect(seasonAt(inMonth(11))).toBe("autumn");
    expect(seasonAt(inMonth(12))).toBe("winter");
    expect(seasonAt(inMonth(1))).toBe("winter");
  });
});

describe("characterAppearance: rollAppearance 값 범위", () => {
  it("여러 번 굴려도 항상 정의된 범위 안의 값을 낸다", () => {
    for (let i = 0; i < 300; i++) {
      const a = rollAppearance();
      expect(Number.isInteger(a.hairVariant)).toBe(true);
      expect(a.hairVariant).toBeGreaterThanOrEqual(0);
      expect(a.hairVariant).toBeLessThanOrEqual(4);
      expect(["dark", "light"]).toContain(a.hairTone);
      expect(typeof a.glasses).toBe("boolean");
      expect(["none", "freckles", "blush"]).toContain(a.faceAccent);
    }
  });
});

// 기본 컨디션(모두 양호) — 필요한 항목만 덮어쓴다
const baseInput: VisualStateInput = {
  lifeStage: "employee",
  mood: 50,
  hunger: 80,
  energy: 80,
  health: 80,
  burnout: 0,
};

describe("characterVisualState: getCharacterVisualState 우선순위", () => {
  it("sleeping 액션은 컨디션과 무관하게 lie/zzz/sleep", () => {
    const vs = getCharacterVisualState({ ...baseInput, health: 10, actionState: "sleeping" });
    expect(vs.state).toBe("sleeping");
    expect(vs.pose).toBe("lie");
    expect(vs.overlays).toEqual(["zzz"]);
    expect(vs.anim).toBe("sleep");
  });

  it("sick(health<30)이 hungry(hunger<30)보다 우선한다", () => {
    const vs = getCharacterVisualState({ ...baseInput, health: 10, hunger: 10 });
    expect(vs.state).toBe("sick");
    expect(vs.tone).toBe("pale");
    expect(vs.overlays).toEqual(["sweat", "bandage"]);
  });

  it("mood>70 이면 happy, 정확히 70 은 normal (경계)", () => {
    expect(getCharacterVisualState({ ...baseInput, mood: 71 }).state).toBe("happy");
    expect(getCharacterVisualState({ ...baseInput, mood: 71 }).anim).toBe("bounce");
    expect(getCharacterVisualState({ ...baseInput, mood: 70 }).state).toBe("normal");
  });

  it("working + burnout>70 → burned_out, still 애니메이션, 먹구름", () => {
    const vs = getCharacterVisualState({ ...baseInput, burnout: 80, actionState: "working" });
    expect(vs.state).toBe("burned_out");
    expect(vs.anim).toBe("still");
    expect(vs.overlays).toEqual(["cloud"]);
    expect(vs.prop).toBe("laptop");
  });

  it("jobTypeFromFamily 매핑", () => {
    expect(jobTypeFromFamily("dev")).toBe("tech");
    expect(jobTypeFromFamily("design")).toBe("creative");
    expect(jobTypeFromFamily("athlete")).toBe("physical");
    expect(jobTypeFromFamily("medical")).toBe("expert");
    expect(jobTypeFromFamily("management")).toBe("office");
    expect(jobTypeFromFamily(undefined)).toBe("none");
  });

  it("actionStateForActionKey 매핑", () => {
    expect(actionStateForActionKey("cardio")).toBe("exercising");
    expect(actionStateForActionKey("nap")).toBe("sleeping");
    expect(actionStateForActionKey("read")).toBe("studying");
    expect(actionStateForActionKey("focusWork")).toBe("working");
    expect(actionStateForActionKey("resume")).toBe("studying"); // 취준 액션도 공부 포즈
    expect(actionStateForActionKey("snack")).toBe("playing"); // 그 외는 가벼운 기쁨
  });
});

describe("characterStageConfig: buildCharacterMatrix 불변식", () => {
  const normalVs = getCharacterVisualState(baseInput); // normal/stand
  const ALL_STAGES: LifeStage[] = [
    "baby", "child", "elementary", "middle", "high", "university",
    "jobseeker", "employee", "senior", "retirement",
  ];

  it("모든 단계에서 20행 × 16열, 코드는 .KSFW 만 사용", () => {
    for (const stage of ALL_STAGES) {
      const m = buildCharacterMatrix(normalVs, stage);
      expect(m).toHaveLength(GRID_H);
      for (const row of m) {
        expect(row).toHaveLength(GRID_W);
        expect(row).toMatch(/^[.KSFW]+$/);
      }
    }
  });

  it("hairVariant 0 과 3 은 high 단계에서 다른 매트릭스를 만든다", () => {
    const m0 = buildCharacterMatrix(normalVs, "high", "none", "male", {
      ...DEFAULT_APPEARANCE, hairVariant: 0,
    });
    const m3 = buildCharacterMatrix(normalVs, "high", "none", "male", {
      ...DEFAULT_APPEARANCE, hairVariant: 3,
    });
    expect(m0).not.toEqual(m3);
  });

  it("glasses=true 면 눈 행(row 3)의 5~10열이 전부 K 로 채워진다", () => {
    const m = buildCharacterMatrix(normalVs, "high", "none", "male", {
      ...DEFAULT_APPEARANCE, glasses: true,
    });
    expect(m[3].slice(5, 11)).toBe("KKKKKK");
    const bare = buildCharacterMatrix(normalVs, "high", "none", "male", DEFAULT_APPEARANCE);
    expect(bare[3].slice(5, 11)).not.toBe("KKKKKK"); // 안경 없으면 눈 2점만 K
  });

  it("bodyShape heavy 는 employee 단계에서 normal 과 다르다", () => {
    const normal = buildCharacterMatrix(normalVs, "employee", "office", "male", DEFAULT_APPEARANCE, "normal");
    const heavy = buildCharacterMatrix(normalVs, "employee", "office", "male", DEFAULT_APPEARANCE, "heavy");
    expect(heavy).not.toEqual(normal);
  });

  it("matrixToCells 는 '.' 이 아닌 셀 수와 정확히 일치한다", () => {
    const m = buildCharacterMatrix(normalVs, "employee");
    const nonDot = m.join("").split("").filter((c) => c !== ".").length;
    const cells = matrixToCells(m);
    expect(cells).toHaveLength(nonDot);
    for (const cell of cells) expect(m[cell.y][cell.x]).toBe(cell.code);
  });

  it("옷장 의상은 각각 기본 복장·서로와 다른 매트릭스를 만든다", () => {
    const outfits = [
      "stripeTee", "hoodie", "jacket", "suit",
      "training", "dress", "padding", "leather",
    ] as const;
    // high 단계: 기본 복장(교복 깃+넥타이)이 어떤 옷장 의상과도 겹치지 않는다
    const bare = buildCharacterMatrix(normalVs, "high", "none", "male");
    const seen = new Set<string>([bare.join("\n")]);
    for (const outfit of outfits) {
      const m = buildCharacterMatrix(
        normalVs, "high", "none", "male", DEFAULT_APPEARANCE, "normal",
        { outfit, accessory: null },
      );
      const key = m.join("\n");
      expect(seen.has(key), `${outfit} 가 다른 복장과 구분되지 않음`).toBe(false);
      seen.add(key);
      for (const row of m) expect(row).toMatch(/^[.KSFW]+$/);
    }
  });

  it("옷장 액세서리는 각각 미착용과 다른 매트릭스를 만든다", () => {
    const accessories = [
      "ribbon", "cap", "beanie", "scarf",
      "sunglasses", "headphones", "necklace", "crown",
    ] as const;
    const bare = buildCharacterMatrix(normalVs, "university", "none", "male");
    for (const accessory of accessories) {
      const m = buildCharacterMatrix(
        normalVs, "university", "none", "male", DEFAULT_APPEARANCE, "normal",
        { outfit: null, accessory },
      );
      expect(m, `${accessory} 가 외형을 바꾸지 않음`).not.toEqual(bare);
      for (const row of m) expect(row).toMatch(/^[.KSFW]+$/);
    }
  });
});
