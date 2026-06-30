// ---------------------------------------------------------------------------
// CharacterStatusIcon.tsx
// 현재 상태를 한눈에 보여주는 작은 픽셀 상태칩(아이콘 + 라벨).
// 기존 8×8 PixelIcon 스프라이트를 재사용한다.
// ---------------------------------------------------------------------------

import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { VisualStateKey } from "@/lib/game/sprite/characterVisualState";

/** 상태 → (아이콘 이름, 한글 라벨) */
const STATE_ICON: Record<VisualStateKey, { icon: string; label: string }> = {
  normal: { icon: "heart", label: "평온" },
  happy: { icon: "star", label: "기분 최고" },
  tired: { icon: "sleep", label: "졸림" },
  hungry: { icon: "feed", label: "배고픔" },
  sick: { icon: "heart", label: "아픔" },
  studying: { icon: "study", label: "공부 중" },
  working: { icon: "briefcase", label: "업무 중" },
  burned_out: { icon: "coffee", label: "번아웃" },
  sleeping: { icon: "sleep", label: "수면" },
  exercising: { icon: "exercise", label: "운동 중" },
};

export interface CharacterStatusIconProps {
  state: VisualStateKey;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function CharacterStatusIcon({
  state,
  size = 12,
  showLabel = true,
  className,
}: CharacterStatusIconProps) {
  const meta = STATE_ICON[state];
  return (
    <span
      className={`inline-flex items-center gap-1 text-ink/80 ${className ?? ""}`}
      title={meta.label}
    >
      <PixelIcon name={meta.icon} size={size} />
      {showLabel && <span className="font-pixel text-[11px] font-bold">{meta.label}</span>}
    </span>
  );
}
