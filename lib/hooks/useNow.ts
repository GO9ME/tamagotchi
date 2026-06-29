"use client";

import { useEffect, useState } from "react";

/** 일정 주기로 현재 시각(ms)을 갱신해 카운트다운/타이머에 사용 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
