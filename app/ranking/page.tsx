"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RankingPanel } from "@/components/ranking/RankingPanel";
import { BottomNav } from "@/components/common/BottomNav";
import { Toast } from "@/components/common/Toast";
import { YearlyReviewModal } from "@/components/review/YearlyReviewModal";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { useGameStore } from "@/lib/store/useGameStore";
import { useGameTick } from "@/lib/hooks/useGameTick";

export default function RankingPage() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const character = useGameStore((s) => s.character);
  useGameTick();

  useEffect(() => {
    if (hydrated && !character) router.replace("/create");
  }, [hydrated, character, router]);

  if (!hydrated || !character) {
    return (
      <main className="flex min-h-screen items-center justify-center text-ink/60">
        <div className="animate-bob">
          <PixelIcon name="star" size={44} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-pixel text-sm font-bold text-ink/55"
        >
          ← 대시보드
        </Link>
        <h1 className="font-pixel text-base font-bold">랭킹</h1>
        <span className="w-16" />
      </header>

      <RankingPanel character={character} />

      <YearlyReviewModal />
      <Toast />
      <BottomNav />
    </main>
  );
}
