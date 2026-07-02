// ---------------------------------------------------------------------------
// characterPalettes.ts
// 사람형 픽셀 캐릭터의 색 팔레트.
//
// 비주얼 방향(사용자 선택): "단색 LCD 잉크".
//   고전 다마고치 / 게임보이 감성의 흑백(모노) 톤 램프를 쓴다.
//   컬러 휴(hue)가 아니라 4단계 명도 램프(ink → shade → fill → glint)로
//   피부·머리·옷·소품을 명도 차이만으로 구분한다.
//
// 추후 컬러 도트로 확장하고 싶으면 같은 코드(K/S/F/W) 인터페이스를 유지한 채
// CHARACTER_PALETTES 에 휴 팔레트를 추가하면 된다(렌더러 수정 불필요).
// ---------------------------------------------------------------------------

/** 픽셀 코드 → 의미. 매트릭스 문자열에서 사용하는 1글자 코드. */
export type PixelCode = "." | "K" | "S" | "F" | "W";

export interface PixelPalette {
  /** 가장 진한 잉크 — 외곽선, 눈, 머리(진한), 신발, 넥타이 */
  ink: string;
  /** 중간 톤 — 머리카락, 바지, 옷 음영, 책상 소품 */
  shade: string;
  /** 밝은 톤 — 피부, 밝은 옷, 하이라이트 */
  fill: string;
  /** 최상위 하이라이트 — 눈 반짝임, 땀방울, 반짝이 */
  glint: string;
}

/** 기본 LCD 잉크 램프(올리브-크림 LCD 배경 위에서 또렷하게 읽히도록 튜닝) */
export const LCD_INK_PALETTE: PixelPalette = {
  ink: "#2E2722",
  shade: "#6E6452",
  fill: "#FBF7EC",
  glint: "#FFFFFF",
};

/** 아픈 상태(health<30): 대비를 죽여 창백/흐릿하게 — "창백한 색감" 요구 충족 */
export const LCD_PALE_PALETTE: PixelPalette = {
  ink: "#4A4336",
  shade: "#8E8A78",
  fill: "#DAD6C7",
  glint: "#F0EEE4",
};

export type ToneKey = "normal" | "pale";

export function paletteForTone(tone: ToneKey): PixelPalette {
  return tone === "pale" ? LCD_PALE_PALETTE : LCD_INK_PALETTE;
}

// ---------------------------------------------------------------------------
// 컬러(휴) 팔레트 — 캐릭터 생성 시 고른 기기 색(character.color)별 도트 팔레트.
// 같은 K/S/F/W 코드 인터페이스라 렌더러 수정 없이 palette prop 으로만 켜진다.
// (기본은 여전히 단색 LCD — 유저가 🎨 토글로 선택하는 옵션)
// ---------------------------------------------------------------------------

export const CHARACTER_PALETTES: Record<string, PixelPalette> = {
  blush: { ink: "#4A2430", shade: "#C96A82", fill: "#FFE7ED", glint: "#FFFFFF" },
  mint: { ink: "#1F3D33", shade: "#4FA98A", fill: "#E2F7EE", glint: "#FFFFFF" },
  sky: { ink: "#223A4E", shade: "#5B93BC", fill: "#E3F1FB", glint: "#FFFFFF" },
  butter: { ink: "#4A3A18", shade: "#C9A24E", fill: "#FFF3D6", glint: "#FFFFFF" },
  grape: { ink: "#35284A", shade: "#8A6FBC", fill: "#EFE8FB", glint: "#FFFFFF" },
  coral: { ink: "#4A2A22", shade: "#D97B5F", fill: "#FFE9E2", glint: "#FFFFFF" },
};

/** 기기 색 → 컬러 팔레트 (아프면(pale) 컬러 대신 창백 팔레트 유지) */
export function paletteForColor(color: string, tone: ToneKey): PixelPalette {
  if (tone === "pale") return LCD_PALE_PALETTE;
  return CHARACTER_PALETTES[color] ?? LCD_INK_PALETTE;
}

/** 매트릭스 코드 → 팔레트 색. "." 은 투명(배경 LCD가 비침)이라 null. */
export function colorForCode(code: string, p: PixelPalette): string | null {
  switch (code) {
    case "K":
      return p.ink;
    case "S":
      return p.shade;
    case "F":
      return p.fill;
    case "W":
      return p.glint;
    default:
      return null; // "." 또는 미정 → 투명
  }
}

// ---------------------------------------------------------------------------
// 픽셀 방(PixelRoom) 톤 — 캐릭터와 같은 잉크 램프를 공유해 한 화면에서 톤이 통일된다.
// ---------------------------------------------------------------------------

export interface RoomPalette {
  wall: string; // 벽
  wallLine: string; // 벽 몰딩/창틀 라인
  floor: string; // 바닥
  floorLine: string; // 바닥 경계
  ink: string; // 가구 외곽선
  prop: string; // 가구 면(중간 톤)
  propHi: string; // 가구 하이라이트
}

export const LCD_ROOM_PALETTE: RoomPalette = {
  wall: "#E9EDD8",
  wallLine: "#CBD0B4",
  floor: "#D6DBBE",
  floorLine: "#B7BD9C",
  ink: "#2E2722",
  prop: "#6E6452",
  propHi: "#FBF7EC",
};

/** 밤(수면 상태) 방 톤 — "어두운 방 분위기" 요구 충족 */
export const LCD_ROOM_NIGHT_PALETTE: RoomPalette = {
  wall: "#AEB59A",
  wallLine: "#8C9278",
  floor: "#9BA384",
  floorLine: "#7E856A",
  ink: "#2A241D",
  prop: "#544D3E",
  propHi: "#D7D3C3",
};
