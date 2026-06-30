// ---------------------------------------------------------------------------
// SpriteSheetCharacter.tsx
// 추후 교체용 렌더러(스텁). MVP 에선 사용하지 않는다.
//
// 같은 입력(VisualState + lifeStage)을 받아 PNG 스프라이트 시트의 한 프레임을
// background-position 으로 잘라 보여줄 수 있도록 인터페이스만 맞춰 둔다.
// 시트가 준비되면 sheet prop 을 넘기고 PixelCharacter 의 renderer 를 "sprite"
// 로 바꾸기만 하면 된다(CSSPixelCharacter 와 props 호환).
//
// ※ 외부 이미지 에셋은 라이선스 확인 후 docs/ASSET_LICENSES.md 기록 전에는 쓰지 않는다.
// ---------------------------------------------------------------------------

import type { Gender, LifeStage } from "@/types/character";
import type { CharacterVisualState, JobType } from "@/lib/game/sprite/characterVisualState";
import { CSSPixelCharacter } from "./CSSPixelCharacter";

/** 시트 좌표 매핑: (lifeStage,state) → 프레임 [열,행] */
export interface SpriteSheetConfig {
  /** 스프라이트 시트 이미지 경로(예: /sprites/character.png) */
  src: string;
  /** 한 프레임의 픽셀 크기 */
  frameW: number;
  frameH: number;
  /** state 키 → 행 인덱스 */
  rowFor: Partial<Record<CharacterVisualState["state"], number>>;
  /** lifeStage → 열 인덱스 */
  colFor: Partial<Record<LifeStage, number>>;
}

export interface SpriteSheetCharacterProps {
  visualState: CharacterVisualState;
  lifeStage: LifeStage;
  jobType?: JobType;
  gender?: Gender;
  size?: number;
  /** 없으면 CSS 렌더러로 자동 폴백 */
  sheet?: SpriteSheetConfig;
  className?: string;
}

export function SpriteSheetCharacter(props: SpriteSheetCharacterProps) {
  const { sheet, visualState, lifeStage, size = 144, className } = props;

  // 시트 미준비 → MVP CSS 렌더러로 폴백(완료 기준: 항상 무언가 보인다)
  if (!sheet) {
    return <CSSPixelCharacter {...props} />;
  }

  const col = sheet.colFor[lifeStage] ?? 0;
  const row = sheet.rowFor[visualState.state] ?? 0;
  const scale = size / sheet.frameW;

  return (
    <div
      className={`pxc-wrap pixelated ${className ?? ""}`}
      role="img"
      aria-label={`${visualState.label} 캐릭터`}
      style={{
        width: size,
        height: sheet.frameH * scale,
        backgroundImage: `url(${sheet.src})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${col * sheet.frameW * scale}px -${row * sheet.frameH * scale}px`,
        backgroundSize: "auto",
        imageRendering: "pixelated",
      }}
    />
  );
}
