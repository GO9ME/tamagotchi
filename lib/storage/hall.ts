// 명예의전당(로컬). 같은 브라우저의 과거 회차 기록만 저장한다.
// 개인정보 없음: 게임 내 가상 닉네임/색/점수/나이뿐. 외부 전송 0건(localStorage only).
// TODO(Phase 3+): Supabase 익명 랭킹 테이블로 교체 가능(percentileFor 단일 격리 지점).

import type { RankingScores } from "@/lib/game/ranking";

const HALL_KEY = "lifegotchi:hall";
const MAX_ENTRIES = 20;

export interface HallEntry {
  id: string; // character.id (중복 방지)
  name: string; // 가상 닉네임
  color: string;
  ageAtDeath: number;
  scores: RankingScores;
  jobTitle?: string;
  endingTitle?: string;
  createdAt: number;
}

export function getHall(): HallEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HALL_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as HallEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** 사망 회차 1건 적재. 같은 id 는 갱신(중복 방지), 종합점수 상위 20건 유지. */
export function saveHall(entry: HallEntry): HallEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getHall().filter((e) => e.id !== entry.id);
    list.push(entry);
    list.sort((a, b) => b.scores.overall - a.scores.overall);
    const trimmed = list.slice(0, MAX_ENTRIES);
    window.localStorage.setItem(HALL_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return getHall();
  }
}
