// ---------------------------------------------------------------------------
// CharacterSpeechBubble.tsx
// 캐릭터 머리 위 픽셀풍 말풍선. 배고픔/번아웃 등 상태 메시지나 한마디를 띄운다.
// 순수 표시용(외부 이미지 없음). 레트로 하드보더 + 작은 꼬리.
// ---------------------------------------------------------------------------

export interface CharacterSpeechBubbleProps {
  text: string;
  /** 강조 톤(배고픔/아픔 등) */
  tone?: "default" | "warn";
  className?: string;
}

export function CharacterSpeechBubble({
  text,
  tone = "default",
  className,
}: CharacterSpeechBubbleProps) {
  const bg = tone === "warn" ? "bg-butter" : "bg-white";
  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <div
        className={`rounded-lg border-[3px] border-ink px-2.5 py-1 font-pixel text-[11px] font-bold leading-tight text-ink ${bg}`}
        style={{ boxShadow: "2px 2px 0 0 rgba(46,39,34,0.18)" }}
      >
        {text}
      </div>
      {/* 꼬리 */}
      <span
        className={`absolute left-1/2 top-full block h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b-[3px] border-r-[3px] border-ink ${bg}`}
        aria-hidden="true"
      />
    </div>
  );
}
