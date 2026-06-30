// ---------------------------------------------------------------------------
// characterVisualState.ts
// 캐릭터의 게임 상태(배고픔/에너지/건강/기분/번아웃 + 현재 액션 + 직업)를
// "어떻게 보여줄지"(표정·포즈·오버레이·소품·애니메이션)로 해석하는 순수 함수.
//
// 스프라이트 교체 가능 구조의 핵심:
//   PixelCharacter 는 CSS 를 직접 들지 않고, 이 파일이 만든 VisualState 를
//   하위 렌더러(CSSPixelCharacter / SpriteSheetCharacter)에 넘기기만 한다.
//   렌더 방식이 바뀌어도 이 해석 로직은 그대로 재사용된다.
// ---------------------------------------------------------------------------

import type { JobFamilyKey, LifeStage } from "@/types/character";
import type { ToneKey } from "./characterPalettes";

/** 캐릭터가 지금 "하고 있는 일"(있으면 포즈/소품을 결정) */
export type ActionState =
  | "idle"
  | "studying"
  | "working"
  | "sleeping"
  | "exercising"
  | "playing";

/** 직업 대분류 — 직장인/경력직 복장 악센트에만 영향 */
export type JobType =
  | "none"
  | "office" // 사무/관리/영업/HR/CS/법무/공무원
  | "tech" // 개발/데이터/PM
  | "creative" // 디자인/마케팅
  | "physical" // 생산/운동선수
  | "expert"; // 의료/연구

/** 렌더러가 최종적으로 그리는 표정 */
export type ExpressionKey =
  | "neutral"
  | "happy"
  | "sad"
  | "sleepy"
  | "hungry"
  | "sick"
  | "tired"
  | "stressed";

/** 몸 포즈 */
export type PoseKey = "stand" | "sit" | "lie" | "exercise";

/** 머리 위/주변 오버레이 아이콘 */
export type OverlayKey =
  | "zzz" // 졸림/수면
  | "cloud" // 번아웃 먹구름
  | "sweat" // 운동/아픔 땀
  | "hungerBubble" // 배고픔 말풍선
  | "sparkle" // 기분 최고 반짝임
  | "bandage"; // 아픔 밴드(십자)

/** 손/책상에 놓이는 소품 */
export type PropKey =
  | "none"
  | "book" // 공부(연필+노트)
  | "laptop" // 업무 노트북
  | "coffee" // 커피컵
  | "dumbbell" // 운동
  | "bag" // 책가방(초등)
  | "file" // 취준 이력서/파일
  | "badge" // 사원증
  | "toy"; // 아기 장난감

/** 가벼운 CSS 애니메이션 키 */
export type AnimKey =
  | "idle" // 1~2px 위아래(기본)
  | "bounce" // happy: 통통
  | "sway" // tired: 느린 흔들림
  | "nod" // hungry: 고개 숙임
  | "study" // studying: 책 보는 작은 움직임
  | "type" // working: 타이핑
  | "still" // burned_out: 거의 안 움직임
  | "sleep" // sleeping: Z 반복(몸 정지)
  | "pump"; // exercising: 점프/팔

/** 디버깅/접근성 라벨용 상태 키(스펙 §5 의 10가지) */
export type VisualStateKey =
  | "normal"
  | "happy"
  | "tired"
  | "hungry"
  | "sick"
  | "studying"
  | "working"
  | "burned_out"
  | "sleeping"
  | "exercising";

export interface CharacterVisualState {
  /** 대표 상태(라벨/디버깅용) */
  state: VisualStateKey;
  expression: ExpressionKey;
  pose: PoseKey;
  overlays: OverlayKey[];
  prop: PropKey;
  anim: AnimKey;
  tone: ToneKey;
  /** 한글 상태 설명(말풍선/aria-label 용) */
  label: string;
}

export interface VisualStateInput {
  lifeStage: LifeStage;
  mood: number;
  hunger: number;
  energy: number;
  health: number;
  burnout: number;
  actionState?: ActionState;
  jobType?: JobType;
}

// 임계값(스펙 §7)
const LOW = 30; // hunger/energy/health 낮음 기준
const MOOD_HIGH = 70;
const BURNOUT_HIGH = 70;

export function jobTypeFromFamily(family?: JobFamilyKey): JobType {
  switch (family) {
    case "dev":
    case "data":
    case "pm":
      return "tech";
    case "design":
    case "marketing":
      return "creative";
    case "production":
    case "athlete":
      return "physical";
    case "medical":
    case "research":
      return "expert";
    case undefined:
      return "none";
    default:
      return "office";
  }
}

const STATE_LABEL: Record<VisualStateKey, string> = {
  normal: "평온해요",
  happy: "기분 최고!",
  tired: "졸려요",
  hungry: "배고파요",
  sick: "아파요",
  studying: "공부 중",
  working: "업무 중",
  burned_out: "번아웃...",
  sleeping: "쿨쿨 자는 중",
  exercising: "운동 중",
};

/**
 * 상태 해석 규칙(우선순위):
 *  1) 명시적 액션(sleeping/working/studying/exercising)이 있으면 포즈/소품을 결정.
 *     단, 심각한 컨디션(아픔·번아웃)은 표정/오버레이로 함께 덧씌운다.
 *  2) 액션이 없으면 컨디션으로 상태 결정:
 *     sick > burned_out > hungry > tired > happy > normal
 */
export function getCharacterVisualState(
  input: VisualStateInput,
): CharacterVisualState {
  const { mood, hunger, energy, health, burnout } = input;
  const action = input.actionState ?? "idle";

  const sick = health < LOW;
  const starving = hunger < LOW;
  const exhausted = energy < LOW;
  const burned = burnout > BURNOUT_HIGH;
  const cheerful = mood > MOOD_HIGH;

  const tone: ToneKey = sick ? "pale" : "normal";

  // 컨디션에서 파생되는 보조 오버레이(액션 상태에도 덧씌움)
  const conditionOverlays: OverlayKey[] = [];
  if (sick) conditionOverlays.push("sweat", "bandage");
  else if (burned) conditionOverlays.push("cloud");

  // --- 1) 명시적 액션 우선 ---
  if (action === "sleeping") {
    return mk("sleeping", "sleepy", "lie", ["zzz"], "none", "sleep", tone);
  }
  if (action === "working") {
    const ov: OverlayKey[] = burned ? ["cloud"] : [];
    return mk(
      burned ? "burned_out" : "working",
      burned ? "tired" : sick ? "sick" : "neutral",
      "sit",
      sick ? [...ov, "sweat"] : ov,
      "laptop",
      burned ? "still" : "type",
      tone,
    );
  }
  if (action === "studying") {
    return mk(
      "studying",
      sick ? "sick" : exhausted ? "tired" : "neutral",
      "sit",
      sick ? ["sweat"] : [],
      "book",
      "study",
      tone,
    );
  }
  if (action === "exercising") {
    return mk("exercising", "happy", "exercise", ["sweat"], "dumbbell", "pump", tone);
  }

  // --- 2) 컨디션 기반 ---
  if (sick) {
    return mk("sick", "sick", "sit", ["sweat", "bandage"], "none", "sway", "pale");
  }
  if (burned) {
    return mk("burned_out", "tired", "sit", ["cloud"], "none", "still", tone);
  }
  if (starving) {
    return mk("hungry", "hungry", "stand", ["hungerBubble"], "none", "nod", tone);
  }
  if (exhausted) {
    return mk("tired", "sleepy", "sit", ["zzz"], "none", "sway", tone);
  }
  if (cheerful) {
    return mk("happy", "happy", "stand", ["sparkle"], "none", "bounce", tone);
  }
  return mk("normal", "neutral", "stand", [], "none", "idle", tone);
}

function mk(
  state: VisualStateKey,
  expression: ExpressionKey,
  pose: PoseKey,
  overlays: OverlayKey[],
  prop: PropKey,
  anim: AnimKey,
  tone: ToneKey,
): CharacterVisualState {
  return { state, expression, pose, overlays, prop, anim, tone, label: STATE_LABEL[state] };
}
