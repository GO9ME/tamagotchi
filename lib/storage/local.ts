// 익명 저장 레이어 (Phase 1).
// 개인정보 없이 브라우저별 익명 guest ID 만 사용한다.
//
// TODO(Phase 3+): 이 모듈을 Supabase Anonymous Auth 어댑터로 교체.
//   - getOrCreateUserId() -> supabase.auth.getUser() / signInAnonymously()
//   - 캐릭터 저장 -> Row Level Security 가 걸린 테이블에 upsert
//   현재는 zustand persist(localStorage) 가 캐릭터 데이터를 보관한다.

const USER_KEY = "lifegotchi:userId";

function randomId(): string {
  // 브라우저 환경 전용. 충돌 가능성 무시 가능한 수준의 짧은 익명 ID.
  const rnd = Math.random().toString(36).slice(2, 10);
  return `guest_${rnd}`;
}

/** 브라우저에 저장된 익명 userId 를 가져오거나 새로 생성 */
export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "guest_server";
  try {
    let id = window.localStorage.getItem(USER_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(USER_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}
