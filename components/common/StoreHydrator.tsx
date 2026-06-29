"use client";

import { useEffect } from "react";

import { useGameStore } from "@/lib/store/useGameStore";

/** 마운트 후 한 번 persist 데이터를 클라이언트에서 복원한다. */
export function StoreHydrator() {
  useEffect(() => {
    useGameStore.persist.rehydrate();
  }, []);
  return null;
}
