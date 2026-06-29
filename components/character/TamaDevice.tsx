import type { CharacterStatus, LifeStage } from "@/types/character";
import { getMascotColor } from "@/lib/game/constants";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import { Mascot } from "./Mascot";

const LCD_INK = "#3A2E22"; // 진한 갈색 (외곽선/상태 아이콘)

function Pip({ name, value }: { name: string; value: number }) {
  const lvl = Math.round((Math.max(0, Math.min(100, value)) / 100) * 4);
  return (
    <span className="flex items-center gap-1">
      <PixelIcon name={name} size={11} />
      <span className="flex gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-2 w-1"
            style={{
              backgroundColor: i < lvl ? LCD_INK : "rgba(60,74,43,0.22)",
            }}
          />
        ))}
      </span>
    </span>
  );
}

export function TamaDevice({
  colorKey,
  status,
  stage = "child",
  mascotSize = 148,
  showStatus = true,
}: {
  colorKey: string;
  status: CharacterStatus;
  stage?: LifeStage;
  mascotSize?: number;
  showStatus?: boolean;
}) {
  const c = getMascotColor(colorKey);
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div
        className="rounded-[2rem] border-[3px] border-ink p-4"
        style={{
          backgroundColor: c.body,
          boxShadow: "5px 5px 0 0 rgba(46,39,34,0.2)",
        }}
      >
        {/* 상단 장식 점 */}
        <div className="mb-2 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: c.shade }}
            />
          ))}
        </div>

        {/* LCD 화면 */}
        <div className="lcd relative mx-auto aspect-square w-full overflow-hidden p-3">
          {showStatus && (
            <div className="absolute inset-x-2.5 top-2 flex items-center justify-between text-lcdink">
              <Pip name="heart" value={status.hunger} />
              <Pip name="bolt" value={status.energy} />
            </div>
          )}
          <div className="flex h-full items-center justify-center pt-2">
            <Mascot status={status} stage={stage} size={mascotSize} color={LCD_INK} />
          </div>
        </div>

        {/* 버튼 3개 */}
        <div className="mt-3 flex items-center justify-center gap-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-6 w-6 rounded-full border-[3px] border-ink"
              style={{
                backgroundColor: c.shade,
                boxShadow: "2px 2px 0 0 rgba(46,39,34,0.25)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
