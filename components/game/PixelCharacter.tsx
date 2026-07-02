// ---------------------------------------------------------------------------
// PixelCharacter.tsx
// 공개 진입점. 게임 상태(props)를 받아 "어떻게 보일지"를 해석(getCharacterVisualState)
// 한 뒤, CSS 를 직접 들지 않고 하위 렌더러에 VisualState 를 넘긴다.
//   renderer="css"    → CSSPixelCharacter (MVP 기본)
//   renderer="sprite" → SpriteSheetCharacter (추후 PNG 시트 교체)
// 이 분리 덕분에 렌더 방식이 바뀌어도 상태 해석/호출부는 그대로다.
// ---------------------------------------------------------------------------

import type { CharacterAppearance, Gender, LifeStage } from "@/types/character";
import type { BodyShape } from "@/lib/game/weight";
import type { EquippedWardrobe } from "@/lib/game/wardrobe";
import {
  getCharacterVisualState,
  type ActionState,
  type JobType,
} from "@/lib/game/sprite/characterVisualState";
import type { PixelPalette } from "@/lib/game/sprite/characterPalettes";
import { CSSPixelCharacter } from "./CSSPixelCharacter";
import {
  SpriteSheetCharacter,
  type SpriteSheetConfig,
} from "./SpriteSheetCharacter";

export interface PixelCharacterProps {
  lifeStage: LifeStage;
  mood: number;
  hunger: number;
  energy: number;
  health: number;
  burnout: number;
  /** 청결(0~100) — 25 미만이면 냄새 연출 */
  cleanliness?: number;
  actionState?: ActionState;
  jobType?: JobType;
  gender?: Gender;
  appearance?: CharacterAppearance;
  /** 체형(체중 반영) */
  bodyShape?: BodyShape;
  /** 착용 중인 옷/액세서리(옷장) */
  wardrobe?: EquippedWardrobe;
  size?: number;
  /** "css"(기본) | "sprite" */
  renderer?: "css" | "sprite";
  sheet?: SpriteSheetConfig;
  palette?: PixelPalette;
  className?: string;
}

export function PixelCharacter({
  lifeStage,
  mood,
  hunger,
  energy,
  health,
  burnout,
  cleanliness,
  actionState,
  jobType = "none",
  gender,
  appearance,
  bodyShape = "normal",
  wardrobe,
  size = 144,
  renderer = "css",
  sheet,
  palette,
  className,
}: PixelCharacterProps) {
  const visualState = getCharacterVisualState({
    lifeStage,
    mood,
    hunger,
    energy,
    health,
    burnout,
    cleanliness,
    actionState,
    jobType,
  });

  if (renderer === "sprite") {
    return (
      <SpriteSheetCharacter
        visualState={visualState}
        lifeStage={lifeStage}
        jobType={jobType}
        gender={gender}
        appearance={appearance}
        size={size}
        sheet={sheet}
        className={className}
      />
    );
  }

  return (
    <CSSPixelCharacter
      visualState={visualState}
      lifeStage={lifeStage}
      jobType={jobType}
      gender={gender}
      appearance={appearance}
      bodyShape={bodyShape}
      wardrobe={wardrobe}
      size={size}
      palette={palette}
      className={className}
    />
  );
}
