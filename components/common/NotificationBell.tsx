"use client";

// 돌봄 알림 토글 — 대시보드 헤더의 작은 버튼.
// 권한 미허용이면 클릭으로 요청, 허용되면 상태 표시만 한다(브라우저 설정에서만 해제 가능).

import type { NotifyPermission } from "@/lib/hooks/useCareNotifications";

export function NotificationBell({
  permission,
  onRequest,
}: {
  permission: NotifyPermission;
  onRequest: () => void;
}) {
  if (permission === "unsupported") return null;

  if (permission === "granted") {
    return (
      <span className="pill bg-mint/40 text-ink/60" title="탭이 열려 있는 동안 배고픔/피로/건강 알림을 보내요">
        🔔 알림 ON
      </span>
    );
  }
  if (permission === "denied") {
    return (
      <span className="pill bg-black/10 text-ink/40" title="브라우저 설정에서 알림 권한을 허용해 주세요">
        🔕 알림 차단됨
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onRequest}
      className="pill bg-white text-ink/60 transition-colors hover:bg-cream"
      title="탭이 열려 있는 동안 캐릭터가 배고프거나 아프면 알려드려요"
    >
      🔔 알림 켜기
    </button>
  );
}
