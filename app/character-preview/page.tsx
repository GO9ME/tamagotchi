import { notFound } from "next/navigation";
import type { LifeStage } from "@/types/character";
import { PixelCharacter } from "@/components/game/PixelCharacter";
import { PixelRoom } from "@/components/game/PixelRoom";
import type { ActionState, JobType } from "@/lib/game/sprite/characterVisualState";
import { STAGE_CONFIG } from "@/lib/game/sprite/characterStageConfig";
import { rollAppearance } from "@/lib/game/sprite/characterAppearance";

// 미리보기/QA 갤러리: 모든 성장 단계 × 모든 상태가 시각적으로 구분되는지 한눈에 확인.

const STAGES: LifeStage[] = [
  "baby",
  "child",
  "elementary",
  "middle",
  "high",
  "university",
  "jobseeker",
  "employee",
  "senior",
  "retirement",
];

type Mid = { mood: number; hunger: number; energy: number; health: number; burnout: number; actionState?: ActionState };
const M: Mid = { mood: 55, hunger: 70, energy: 75, health: 85, burnout: 10 };

const STATES: { key: string; label: string; props: Mid }[] = [
  { key: "normal", label: "normal", props: { ...M } },
  { key: "happy", label: "happy", props: { ...M, mood: 92 } },
  { key: "tired", label: "tired", props: { ...M, energy: 12 } },
  { key: "hungry", label: "hungry", props: { ...M, hunger: 12 } },
  { key: "sick", label: "sick", props: { ...M, health: 12 } },
  { key: "burned_out", label: "burned_out", props: { ...M, burnout: 92 } },
  { key: "studying", label: "studying", props: { ...M, actionState: "studying" } },
  { key: "working", label: "working", props: { ...M, actionState: "working" } },
  { key: "sleeping", label: "sleeping", props: { ...M, actionState: "sleeping" } },
  { key: "exercising", label: "exercising", props: { ...M, actionState: "exercising" } },
];

function Tile({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="lcd flex h-[120px] w-[100px] items-end justify-center p-1">{children}</div>
      <span className="font-pixel text-[10px] text-ink/60">{label}</span>
    </div>
  );
}

export default function CharacterPreviewPage() {
  // 개발용 QA 갤러리 — 프로덕션 배포에서는 숨긴다
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-pixel text-xl font-bold">픽셀 캐릭터 미리보기</h1>
      <p className="mt-1 font-pixel text-xs text-ink/55">
        단색 LCD 잉크 · CSS 도트 · 외부 이미지 없음
      </p>

      {/* 랜덤 외형 다양성 데모 — 같은 조건, 다른 캐릭터마다 다른 헤어스타일/톤/안경/볼 포인트 */}
      <h2 className="mt-8 font-pixel text-sm font-bold">랜덤 외형 다양성 (동일 조건, 12명)</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {Array.from({ length: 12 }, (_, i) => (
          <Tile key={i} label={`#${i + 1}`}>
            <PixelCharacter
              lifeStage="employee"
              {...M}
              gender={i % 2 === 0 ? "male" : "female"}
              appearance={rollAppearance()}
              size={80}
            />
          </Tile>
        ))}
      </div>

      {/* 단계별 방 */}
      <h2 className="mt-8 font-pixel text-sm font-bold">성장 단계별 방 (PixelRoom)</h2>
      <div className="mt-3 flex flex-wrap gap-4">
        {STAGES.map((stage) => (
          <div key={stage} className="flex flex-col items-center gap-1">
            <PixelRoom stage={stage} width={150}>
              <PixelCharacter lifeStage={stage} {...M} size={84} />
            </PixelRoom>
            <span className="font-pixel text-[11px] text-ink/60">
              {STAGE_CONFIG[stage].label} ({stage})
            </span>
          </div>
        ))}
      </div>

      {/* 직업별 사무실 — 직장인 방이 직업 대분류에 따라 달라지는지 확인 */}
      <h2 className="mt-8 font-pixel text-sm font-bold">직업별 방 변화 (직장인)</h2>
      <div className="mt-3 flex flex-wrap gap-4">
        {(
          [
            ["office", "사무직"],
            ["tech", "개발/IT"],
            ["creative", "디자인/마케팅"],
            ["physical", "생산/운동"],
            ["expert", "의료/연구"],
          ] as [JobType, string][]
        ).map(([job, label]) => (
          <div key={job} className="flex flex-col items-center gap-1">
            <PixelRoom stage="employee" jobType={job} width={150}>
              <PixelCharacter lifeStage="employee" {...M} jobType={job} size={84} />
            </PixelRoom>
            <span className="font-pixel text-[11px] text-ink/60">
              {label} ({job})
            </span>
          </div>
        ))}
      </div>

      {/* 단계 × 상태 매트릭스 */}
      <h2 className="mt-10 font-pixel text-sm font-bold">단계 × 상태 매트릭스</h2>
      {STAGES.map((stage) => (
        <div key={stage} className="mt-4">
          <div className="mb-2 font-pixel text-xs font-bold text-ink/70">
            {STAGE_CONFIG[stage].label} · {stage}
          </div>
          <div className="flex flex-wrap gap-3">
            {STATES.map((s) => (
              <Tile key={s.key} label={s.label}>
                <PixelCharacter lifeStage={stage} {...s.props} size={80} />
              </Tile>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
