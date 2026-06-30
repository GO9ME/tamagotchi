// ---------------------------------------------------------------------------
// PixelRoom.tsx
// 캐릭터를 단독으로 두지 않고 작은 픽셀 방 안에 배치한다(스펙 §8).
// 외부 이미지 없이 CSS(하드보더 박스 + 단색 면)만으로 바닥/벽/창문/침대/책상/
// 책장·화분 + 단계별 소품을 구성한다. 캐릭터와 같은 LCD 잉크 톤을 공유한다.
//
// 사용: <PixelRoom stage={stage} night={sleeping}>{<PixelCharacter .../>}</PixelRoom>
// ---------------------------------------------------------------------------

import type { ReactNode } from "react";
import type { LifeStage } from "@/types/character";
import {
  LCD_ROOM_NIGHT_PALETTE,
  LCD_ROOM_PALETTE,
  type RoomPalette,
} from "@/lib/game/sprite/characterPalettes";
import { roomThemeForStage, type RoomTheme } from "@/lib/game/sprite/characterStageConfig";

export interface PixelRoomProps {
  stage: LifeStage;
  /** 수면 등 어두운 분위기 */
  night?: boolean;
  /** 방 전체 폭(px) */
  width?: number;
  children?: ReactNode;
  className?: string;
}

/** 하드보더 픽셀 가구 박스 */
function Furn({
  left,
  bottom,
  w,
  h,
  bg,
  ink,
  z = 1,
  children,
}: {
  left: string;
  bottom: string;
  w: string;
  h: string;
  bg: string;
  ink: string;
  z?: number;
  children?: ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        left,
        bottom,
        width: w,
        height: h,
        background: bg,
        border: `2px solid ${ink}`,
        zIndex: z,
      }}
    >
      {children}
    </div>
  );
}

function FurnSet({ theme, pal }: { theme: RoomTheme; pal: RoomPalette }) {
  const { ink, prop, propHi } = pal;
  const pieces: ReactNode[] = [];

  // 공통: 침대(좌) — nursery 는 아기침대(난간)
  if (theme === "nursery") {
    pieces.push(
      <Furn key="crib" left="4%" bottom="6%" w="30%" h="26%" bg={propHi} ink={ink}>
        <div className="flex h-full w-full items-stretch justify-around px-[2px] py-[2px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 2, background: ink }} />
          ))}
        </div>
      </Furn>,
    );
  } else {
    pieces.push(
      <Furn key="bed" left="3%" bottom="6%" w="30%" h="20%" bg={prop} ink={ink}>
        <div style={{ height: "45%", background: propHi, borderBottom: `2px solid ${ink}` }} />
      </Furn>,
    );
  }

  // 공통: 책상(우) + 의자/소품
  pieces.push(
    <Furn key="desk" left="60%" bottom="6%" w="33%" h="22%" bg={prop} ink={ink}>
      {(theme === "office" || theme === "jobseekerRoom" || theme === "seniorOffice") && (
        // 노트북/모니터
        <div
          className="absolute"
          style={{ left: "18%", bottom: "100%", width: "46%", height: "60%", background: propHi, border: `2px solid ${ink}` }}
        />
      )}
      {theme === "studyRoom" && (
        // 책 더미
        <div
          className="absolute"
          style={{ left: "20%", bottom: "100%", width: "40%", height: "45%", background: propHi, border: `2px solid ${ink}` }}
        />
      )}
    </Furn>,
  );

  // 책장(중앙 뒤) 또는 화분
  if (theme === "studyRoom" || theme === "kidRoom" || theme === "jobseekerRoom") {
    pieces.push(
      <Furn key="shelf" left="40%" bottom="30%" w="20%" h="34%" bg={propHi} ink={ink} z={0}>
        {[70, 40, 10].map((b) => (
          <span
            key={b}
            className="absolute"
            style={{ left: 0, right: 0, bottom: `${b}%`, height: 2, background: ink }}
          />
        ))}
      </Furn>,
    );
  } else {
    // 화분
    pieces.push(
      <Furn key="plant" left="45%" bottom="29%" w="10%" h="16%" bg={prop} ink={ink} z={0}>
        <div
          className="absolute"
          style={{ left: "-30%", right: "-30%", bottom: "90%", height: "120%", background: propHi, border: `2px solid ${ink}`, borderRadius: "40% 40% 0 0" }}
        />
      </Furn>,
    );
  }

  // 단계 소품 악센트
  if (theme === "kidRoom" || theme === "nursery") {
    // 장난감 블록
    pieces.push(
      <Furn key="toy" left="36%" bottom="6%" w="9%" h="9%" bg={propHi} ink={ink} z={2} />,
    );
  }
  if (theme === "jobseekerRoom") {
    // 이력서/파일 더미
    pieces.push(
      <Furn key="files" left="36%" bottom="6%" w="11%" h="8%" bg={propHi} ink={ink} z={2} />,
    );
  }
  if (theme === "seniorOffice") {
    // 서류 트레이
    pieces.push(
      <Furn key="papers" left="34%" bottom="6%" w="13%" h="7%" bg={propHi} ink={ink} z={2} />,
    );
  }

  return <>{pieces}</>;
}

export function PixelRoom({
  stage,
  night = false,
  width = 260,
  children,
  className,
}: PixelRoomProps) {
  const theme = roomThemeForStage(stage);
  const pal = night ? LCD_ROOM_NIGHT_PALETTE : LCD_ROOM_PALETTE;
  const height = Math.round(width * 0.82);

  return (
    <div
      className={`lcd relative overflow-hidden ${className ?? ""}`}
      style={{ width, height, background: pal.wall }}
      role="img"
      aria-label={`${stage} 단계 캐릭터의 방`}
    >
      {/* 바닥 */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: "34%", background: pal.floor, borderTop: `2px solid ${pal.floorLine}` }}
      />
      {/* 창문 */}
      <div
        className="absolute"
        style={{
          left: "12%",
          top: "12%",
          width: "26%",
          height: "30%",
          background: night ? "#5C6448" : "#CFE3F2",
          border: `3px solid ${pal.ink}`,
        }}
      >
        <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2" style={{ background: pal.ink }} />
        <span className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2" style={{ background: pal.ink }} />
        {night && (
          <span className="absolute right-[14%] top-[14%] h-[22%] w-[22%] rounded-full" style={{ background: "#E9ECD8" }} />
        )}
      </div>

      {/* 가구 */}
      <FurnSet theme={theme} pal={pal} />

      {/* 캐릭터 (바닥 중앙) */}
      <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2" style={{ zIndex: 3 }}>
        {children}
      </div>
    </div>
  );
}
