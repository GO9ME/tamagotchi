"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "홈" },
  { href: "/history", label: "성장기록" },
  { href: "/ranking", label: "랭킹" },
  { href: "/", label: "정보" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-white lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const active = path === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 font-pixel text-xs font-bold transition-colors",
                active ? "text-coral" : "text-ink/45",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  active ? "bg-coral" : "bg-transparent",
                )}
              />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
