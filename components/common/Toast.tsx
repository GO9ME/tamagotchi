"use client";

import { useEffect, useState } from "react";

import { useGameStore } from "@/lib/store/useGameStore";

export function Toast() {
  const toast = useGameStore((s) => s.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 lg:bottom-6">
      <div className="animate-pop rounded-full bg-ink/90 px-5 py-2.5 text-sm font-semibold text-cream shadow-toy">
        {toast.message}
      </div>
    </div>
  );
}
