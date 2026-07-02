import type { CharacterAppearance } from "@/types/character";

/**
 * 캐릭터 생성 시 1회 랜덤 외형 결정(머리 스타일/톤/안경/볼 포인트) — 평생 유지된다.
 * 같은 성장 단계·성별이라도 캐릭터마다 다르게 보이도록 다양성을 준다.
 * 조합 수: 헤어 5 × 톤 2 × 안경 2 × 볼 3 = 60가지.
 */
export function rollAppearance(): CharacterAppearance {
  const hairVariant = Math.floor(Math.random() * 5) as CharacterAppearance["hairVariant"];
  const hairTone: CharacterAppearance["hairTone"] = Math.random() < 0.65 ? "dark" : "light";
  const glasses = Math.random() < 0.25;
  const r = Math.random();
  const faceAccent: CharacterAppearance["faceAccent"] =
    r < 0.15 ? "freckles" : r < 0.3 ? "blush" : "none";
  return { hairVariant, hairTone, glasses, faceAccent };
}
