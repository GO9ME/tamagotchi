"use client";

// 8비트 효과음 — 외부 오디오 에셋 없이 WebAudio 구형파로 만드는 다마고치 삐빅음.
// AudioContext 는 반드시 사용자 제스처(버튼 클릭) 이후에만 생성한다.
// 음소거 상태는 localStorage 로 영속.

import type { ActionState } from "@/lib/game/sprite/characterVisualState";

const LS_KEY = "lifegotchi:muted";

export function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(LS_KEY) === "1";
}

export function setMuted(muted: boolean) {
  localStorage.setItem(LS_KEY, muted ? "1" : "0");
}

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** 구형파 짧은 비프 한 음 (freq Hz, dur 초, at 초 뒤 시작) */
function beep(ac: AudioContext, freq: number, dur: number, at: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  // 딸깍 노이즈 방지용 짧은 엔벨로프
  const t0 = ac.currentTime + at;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.04, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** 액션 종류별 짧은 멜로디 (게임보이 감성 2~3음) */
const TUNES: Record<ActionState, [number, number][]> = {
  idle: [],
  playing: [
    [660, 0],
    [880, 0.09],
  ],
  studying: [
    [523, 0],
    [659, 0.09],
  ],
  working: [
    [440, 0],
    [554, 0.09],
  ],
  sleeping: [
    [392, 0],
    [330, 0.12],
  ],
  exercising: [
    [523, 0],
    [523, 0.08],
    [659, 0.16],
  ],
};

/** 액션 발동 시 재생 — 음소거면 무음, 지원 안 하면 조용히 무시 */
export function playActionBeep(state: ActionState) {
  if (isMuted()) return;
  const tune = TUNES[state];
  if (!tune || tune.length === 0) return;
  const ac = ensureCtx();
  if (!ac) return;
  for (const [freq, at] of tune) beep(ac, freq, 0.09, at);
}
