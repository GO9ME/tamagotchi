"use client";

import { cn, formatDuration } from "@/lib/utils";

interface CooldownButtonProps {
  emoji: string;
  label: string;
  desc?: string;
  /** 쿨타임 종료 시각 (epoch ms). 0/과거면 사용 가능 */
  readyAt: number;
  now: number;
  accent?: string; // 배경 tailwind 클래스
  onClick: () => void;
}

export function CooldownButton({
  emoji,
  label,
  desc,
  readyAt,
  now,
  accent = "bg-white",
  onClick,
}: CooldownButtonProps) {
  const remaining = Math.max(0, readyAt - now);
  const onCooldown = remaining > 0;

  return (
    <button
      type="button"
      disabled={onCooldown}
      onClick={onClick}
      className={cn(
        "toy-btn relative flex w-full flex-col items-start gap-0.5 overflow-hidden border border-black/5 text-left shadow-soft",
        accent,
        !onCooldown && "hover:-translate-y-0.5",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-2xl">{emoji}</span>
        {onCooldown && (
          <span className="pill bg-black/10 text-ink/70 tabular-nums">
            {formatDuration(remaining)}
          </span>
        )}
      </div>
      <span className="text-sm font-extrabold">{label}</span>
      {desc && <span className="text-[11px] leading-tight text-ink/55">{desc}</span>}

      {onCooldown && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/45" />
      )}
    </button>
  );
}
