"use client";

import { cn, formatDuration } from "@/lib/utils";
import { PixelIcon } from "@/components/pixel/PixelIcon";

interface CooldownButtonProps {
  icon: string; // 픽셀 아이콘 이름
  label: string;
  desc?: string;
  /** 효과 미리보기 (예: "기분 +8 · 배고픔 +10") */
  effects?: string;
  /** 쿨타임 종료 시각 (epoch ms). 0/과거면 사용 가능 */
  readyAt: number;
  now: number;
  accent?: string;
  locked?: boolean;
  lockLabel?: string;
  onClick: () => void;
}

export function CooldownButton({
  icon,
  label,
  desc,
  effects,
  readyAt,
  now,
  accent = "bg-white",
  locked = false,
  lockLabel,
  onClick,
}: CooldownButtonProps) {
  const remaining = Math.max(0, readyAt - now);
  const onCooldown = remaining > 0;
  const disabled = onCooldown || locked;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "toy-btn relative flex min-h-[68px] w-full flex-col items-start gap-1 overflow-hidden text-left",
        locked ? "bg-black/[0.04]" : accent,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className={cn("text-ink", locked && "opacity-35")}>
          <PixelIcon name={icon} size={22} />
        </span>
        {locked ? (
          <span className="text-ink/45">
            <PixelIcon name="lock" size={15} />
          </span>
        ) : (
          onCooldown && (
            <span className="pill bg-black/10 text-ink/70 tabular-nums">
              {formatDuration(remaining)}
            </span>
          )
        )}
      </div>
      <span className={cn("text-sm font-bold", locked && "text-ink/45")}>{label}</span>
      <span className="font-sans text-[11px] font-medium leading-tight text-ink/55">
        {locked ? lockLabel ?? "잠김" : desc}
      </span>
      {!locked && effects && (
        <span className="font-sans text-[10px] font-semibold leading-tight text-ink/40">
          {effects}
        </span>
      )}

      {onCooldown && !locked && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/45" />
      )}
    </button>
  );
}
