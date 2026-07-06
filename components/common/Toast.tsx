"use client";

import { useEffect, useState } from "react";

import { useGameStore } from "@/lib/store/useGameStore";

export function Toast() {
  const toast = useGameStore((s) => s.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    // 효과 수치가 붙어 길어진 메시지는 읽을 시간을 더 준다
    const duration = Math.min(6000, 2200 + toast.message.length * 25);
    const id = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 lg:bottom-6">
      <div className="animate-pop max-w-xl rounded-2xl bg-ink/90 px-5 py-2.5 text-center text-sm font-semibold text-cream shadow-toy">
        {toast.message}
      </div>
    </div>
  );
}
