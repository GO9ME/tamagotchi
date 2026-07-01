"use client";

import type { Gender, JobFamilyKey, LifeStage, CharacterStatus } from "@/types/character";
import { PixelRoom } from "@/components/game/PixelRoom";
import { PixelCharacter } from "@/components/game/PixelCharacter";
import { jobTypeFromFamily } from "@/lib/game/sprite/characterVisualState";

/** 대시보드 밖(생성 화면·랜딩·엔딩)에서도 실제 캐릭터와 같은 모습을 보여주는 미리보기 카드 */
export function CharacterPreviewCard({
  lifeStage,
  status,
  gender,
  jobFamily,
  width = 220,
  charSize,
  className,
}: {
  lifeStage: LifeStage;
  status: CharacterStatus;
  gender?: Gender;
  jobFamily?: JobFamilyKey;
  width?: number;
  charSize?: number;
  className?: string;
}) {
  return (
    <PixelRoom stage={lifeStage} width={width} className={className}>
      <PixelCharacter
        lifeStage={lifeStage}
        mood={status.mood}
        hunger={status.hunger}
        energy={status.energy}
        health={status.health}
        burnout={status.burnout}
        jobType={jobTypeFromFamily(jobFamily)}
        gender={gender}
        size={charSize ?? Math.round(width * 0.52)}
      />
    </PixelRoom>
  );
}
