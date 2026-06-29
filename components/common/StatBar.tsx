import { cn } from "@/lib/utils";

interface StatBarProps {
  label: string;
  emoji: string;
  value: number; // 0~100
  higherIsBetter?: boolean;
}

function tone(value: number, higherIsBetter: boolean): string {
  // 좋은 정도(good) 기준으로 색 결정
  const good = higherIsBetter ? value : 100 - value;
  if (good >= 60) return "bg-mint";
  if (good >= 30) return "bg-butter";
  return "bg-coral";
}

export function StatBar({
  label,
  emoji,
  value,
  higherIsBetter = true,
}: StatBarProps) {
  const v = Math.round(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs font-semibold text-ink/70">
        <span>
          {emoji} {label}
        </span>
        <span className="tabular-nums">{v}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={cn("h-full rounded-full transition-all duration-500", tone(v, higherIsBetter))}
          style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
        />
      </div>
    </div>
  );
}
