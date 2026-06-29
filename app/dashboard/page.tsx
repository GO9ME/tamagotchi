"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CharacterAvatar } from "@/components/character/CharacterAvatar";
import { StatusPanel } from "@/components/character/StatusPanel";
import { StatsPanel } from "@/components/character/StatsPanel";
import { WeightCard } from "@/components/character/WeightCard";
import { ActionGrid } from "@/components/actions/ActionGrid";
import { FoodSelector } from "@/components/actions/FoodSelector";
import { StudyCard } from "@/components/actions/StudyCard";
import { Toast } from "@/components/common/Toast";
import { OutcomeBurst } from "@/components/common/OutcomeBurst";
import { BottomNav } from "@/components/common/BottomNav";
import { SaveNotice } from "@/components/common/SaveNotice";
import { YearlyReviewModal } from "@/components/review/YearlyReviewModal";
import { CareerCard } from "@/components/dashboard/CareerCard";
import { EndingScreen } from "@/components/EndingScreen";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { nextStageInfo } from "@/lib/game/growth";
import { useGameStore } from "@/lib/store/useGameStore";
import { useNow } from "@/lib/hooks/useNow";

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useGameStore((s) => s.hydrated);
  const character = useGameStore((s) => s.character);
  const tick = useGameStore((s) => s.tick);
  const now = useNow(1000);

  // 캐릭터가 없으면 생성 화면으로
  useEffect(() => {
    if (hydrated && !character) router.replace("/create");
  }, [hydrated, character, router]);

  // 시간 경과 반영: 마운트 시 1번 + 주기적 + 다시 보일 때
  useEffect(() => {
    if (!character) return;
    tick();
    const id = setInterval(() => tick(), 5000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id, tick]);

  if (!hydrated || !character) {
    return (
      <main className="flex min-h-screen items-center justify-center text-ink/60">
        <div className="animate-bob">
          <PixelIcon name="heart" size={44} />
        </div>
      </main>
    );
  }

  // 사망 → 인생 결산 엔딩
  if (character.deathAge != null) {
    return <EndingScreen character={character} />;
  }

  const next = nextStageInfo(character.ageYears);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* 상단 바 */}
      <header className="mb-4 flex items-center justify-between gap-2">
        <Link href="/" className="font-pixel text-sm font-bold text-ink/55">
          ← LifeGotchi
        </Link>
        <div className="flex items-center gap-2">
          {next && (
            <span className="pill bg-white text-ink/60">
              다음: {next.label}까지 {next.inYears}살
            </span>
          )}
          <Link
            href="/history"
            className="pill hidden bg-white text-ink/60 hover:bg-cream lg:inline-flex"
          >
            성장기록
          </Link>
        </div>
      </header>

      <div className="mb-4">
        <SaveNotice />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* 왼쪽: 캐릭터 + 컨디션 */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="card flex flex-col items-center p-6">
            <CharacterAvatar character={character} />
          </div>
          <StatusPanel character={character} />
          <WeightCard character={character} />
        </div>

        {/* 오른쪽: 액션 + 스탯 */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <StudyCard character={character} now={now} />
          <CareerCard character={character} />
          <div className="card p-4">
            <h3 className="mb-3 font-pixel text-sm font-bold text-ink/80">식사</h3>
            <FoodSelector character={character} now={now} />
          </div>
          <ActionGrid character={character} now={now} />
          <StatsPanel character={character} />
        </div>
      </div>

      <YearlyReviewModal />
      <Toast />
      <OutcomeBurst />
      <BottomNav />
    </main>
  );
}
