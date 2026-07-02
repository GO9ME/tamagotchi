// ---------------------------------------------------------------------------
// CSSPixelCharacter.tsx
// MVP 렌더러: 외부 이미지 없이 div 그리드(CSS Grid)로 도트 캐릭터를 그린다.
// 스펙 §4 "div grid 기반 픽셀 캐릭터" 방식. 각 셀 = 단색 div.
// 애니메이션은 래퍼 클래스(.pxc-*)로만 적용(과한 연출 금지, reduced-motion 대응).
// ---------------------------------------------------------------------------

import type { CharacterAppearance, Gender, LifeStage } from "@/types/character";
import type { CharacterVisualState, JobType } from "@/lib/game/sprite/characterVisualState";
import {
  buildCharacterMatrix,
  DEFAULT_APPEARANCE,
  GRID_H,
  GRID_W,
} from "@/lib/game/sprite/characterStageConfig";
import {
  colorForCode,
  paletteForTone,
  type PixelPalette,
} from "@/lib/game/sprite/characterPalettes";

const ANIM_CLASS: Record<CharacterVisualState["anim"], string> = {
  idle: "pxc-idle",
  bounce: "pxc-bounce",
  sway: "pxc-sway",
  nod: "pxc-nod",
  study: "pxc-study",
  type: "pxc-type",
  still: "pxc-still",
  sleep: "pxc-sleep",
  pump: "pxc-pump",
};

export interface CSSPixelCharacterProps {
  visualState: CharacterVisualState;
  lifeStage: LifeStage;
  jobType?: JobType;
  gender?: Gender;
  appearance?: CharacterAppearance;
  /** 캐릭터 폭(px). 높이는 16:20 비율로 자동 */
  size?: number;
  palette?: PixelPalette;
  className?: string;
}

export function CSSPixelCharacter({
  visualState,
  lifeStage,
  jobType = "none",
  gender,
  appearance = DEFAULT_APPEARANCE,
  size = 144,
  palette,
  className,
}: CSSPixelCharacterProps) {
  const pal = palette ?? paletteForTone(visualState.tone);
  const matrix = buildCharacterMatrix(visualState, lifeStage, jobType, gender, appearance);
  const cellPx = size / GRID_W;

  const cells: React.ReactNode[] = [];
  for (let y = 0; y < GRID_H; y++) {
    const row = matrix[y] ?? "";
    for (let x = 0; x < GRID_W; x++) {
      const code = row[x] ?? ".";
      const color = colorForCode(code, pal);
      cells.push(
        <span
          key={`${x}-${y}`}
          style={color ? { backgroundColor: color } : undefined}
          aria-hidden="true"
        />,
      );
    }
  }

  return (
    <div
      className={`pxc-wrap ${ANIM_CLASS[visualState.anim]} ${className ?? ""}`}
      style={{ width: size, height: cellPx * GRID_H }}
      role="img"
      aria-label={`${visualState.label} 캐릭터`}
    >
      <div
        className="pxc-grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_W}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_H}, 1fr)`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
