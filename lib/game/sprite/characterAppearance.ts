import type { CharacterAppearance } from "@/types/character";

/**
 * 캐릭터 생성 시 1회 랜덤 외형 결정(머리 스타일/톤/안경) — 평생 유지된다.
 * 같은 성장 단계·성별이라도 캐릭터마다 다르게 보이도록 다양성을 준다.
 */
export function rollAppearance(): CharacterAppearance {
  const hairVariant = Math.floor(Math.random() * 3) as 0 | 1 | 2;
  const hairTone: CharacterAppearance["hairTone"] = Math.random() < 0.75 ? "dark" : "light";
  const glasses = Math.random() < 0.3;
  return { hairVariant, hairTone, glasses };
}
