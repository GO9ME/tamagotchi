"use client";

// 돌봄 알림 훅 — 탭이 백그라운드일 때 캐릭터 컨디션이 나빠지면 로컬 알림을 띄운다.
// 푸시 서버 없이 동작하므로 "앱(탭)이 열려 있는 동안"만 알림이 온다.
// (탭을 완전히 닫은 상태의 알림은 Push API + 서버가 필요해 범위 밖)

import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@/types/character";

export type NotifyPermission = "default" | "granted" | "denied" | "unsupported";

/** 같은 종류 알림의 최소 간격(ms) — 도배 방지 */
const NOTIFY_COOLDOWN_MS = 20 * 60 * 1000;
const LS_KEY = "lifegotchi:lastNotifyAt";

interface CareAlert {
  key: string;
  title: string;
  body: string;
  when: (c: Character) => boolean;
}

const ALERTS: CareAlert[] = [
  {
    key: "hunger",
    title: "🍚 배고파요!",
    body: "캐릭터가 배가 고파요. 밥을 챙겨주세요.",
    when: (c) => c.status.hunger < 25,
  },
  {
    key: "energy",
    title: "😴 지쳤어요",
    body: "에너지가 바닥이에요. 잠깐 재워주세요.",
    when: (c) => c.status.energy < 20,
  },
  {
    key: "health",
    title: "🤒 아파요",
    body: "건강이 나빠지고 있어요. 돌봐주세요!",
    when: (c) => c.status.health < 30,
  },
];

function readLastNotifyMap(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function markNotified(key: string) {
  const map = readLastNotifyMap();
  map[key] = Date.now();
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

export function useCareNotifications(character: Character | null) {
  const [permission, setPermission] = useState<NotifyPermission>("default");
  const swReady = useRef(false);

  // 서비스워커 등록(1회) + 현재 권한 상태 반영
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        swReady.current = true;
      })
      .catch(() => {
        // 등록 실패(예: 지원 안 함) — 알림 기능만 조용히 비활성
      });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
  }, []);

  // 컨디션 감시: 탭이 숨겨진 상태 + 권한 허용 + 쿨다운 경과 시 알림
  useEffect(() => {
    if (!character || permission !== "granted") return;
    if (typeof document === "undefined" || !document.hidden) return;

    const map = readLastNotifyMap();
    const due = ALERTS.find(
      (a) => a.when(character) && Date.now() - (map[a.key] ?? 0) > NOTIFY_COOLDOWN_MS,
    );
    if (!due) return;

    navigator.serviceWorker.ready
      .then((reg) =>
        reg.showNotification(due.title, {
          body: due.body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: `lifegotchi-${due.key}`, // 같은 종류는 갱신(중복 배너 방지)
        }),
      )
      .then(() => markNotified(due.key))
      .catch(() => {});
  }, [character, permission]);

  return { permission, requestPermission };
}
