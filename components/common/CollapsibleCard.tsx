"use client";

import type { ReactNode } from "react";

/**
 * 접이식 카드 — 상점류(옷장/방 꾸미기/주거/자동차) 공용.
 * 기본 접힘으로 대시보드 스크롤을 줄인다. 네이티브 <details> 사용(JS 상태 없음).
 */
export function CollapsibleCard({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="card group p-4" open={defaultOpen}>
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <h3 className="font-pixel text-sm font-bold text-ink/80">{title}</h3>
        <span className="flex items-center gap-2">
          {badge}
          <span
            aria-hidden
            className="font-pixel text-xs text-ink/45 transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}
