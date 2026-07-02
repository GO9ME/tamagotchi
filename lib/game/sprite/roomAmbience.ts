// ---------------------------------------------------------------------------
// roomAmbience.ts
// 실제(현실) 시각을 방 분위기로 해석하는 순수 함수.
//   - 시간대(SkyPhase): 창밖 하늘 색 (새벽/낮/노을/밤)
//   - 계절(Season): 창밖 계절 연출 (봄 벚꽃/여름 신록/가을 낙엽/겨울 눈)
// SSR 하이드레이션 안전을 위해 컴포넌트가 직접 Date.now() 를 부르지 않고,
// 클라이언트 훅(useNow)이 준 시각을 여기로 넘겨 파생한다.
// ---------------------------------------------------------------------------

export type SkyPhase = "dawn" | "day" | "dusk" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

/** 시(hour) → 하늘 시간대 */
export function skyPhaseAt(ms: number): SkyPhase {
  const h = new Date(ms).getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

/** 월 → 계절 (북반구 기준) */
export function seasonAt(ms: number): Season {
  const m = new Date(ms).getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/** 시간대별 창밖 하늘 색 */
export const SKY_COLOR: Record<SkyPhase, string> = {
  dawn: "#EED9C2",
  day: "#CFE3F2",
  dusk: "#E8C09A",
  night: "#5C6448",
};

/** 계절별 파티클(꽃잎/잎/눈송이) 색 — 창문 안에서만 쓰는 포인트 컬러 */
export const SEASON_PARTICLE: Record<Season, string | null> = {
  spring: "#EFB7C4", // 벚꽃
  summer: null, // 여름은 파티클 없이 해가 쨍쨍
  autumn: "#D89B5E", // 낙엽
  winter: "#FFFFFF", // 눈
};
