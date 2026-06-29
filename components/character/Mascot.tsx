import type { CharacterStatus, LifeStage } from "@/types/character";

export type MoodKey =
  | "happy"
  | "neutral"
  | "sad"
  | "sleepy"
  | "hungry"
  | "sick"
  | "stressed";

export function getMood(status: CharacterStatus): MoodKey {
  if (status.health < 25) return "sick";
  if (status.hunger < 20) return "hungry";
  if (status.energy < 20) return "sleepy";
  if (status.stress > 80) return "stressed";
  if (status.mood > 70) return "happy";
  if (status.mood < 30) return "sad";
  return "neutral";
}

export function moodLabel(mood: MoodKey): string {
  switch (mood) {
    case "happy":
      return "기분 최고";
    case "sad":
      return "시무룩";
    case "sleepy":
      return "졸려요";
    case "hungry":
      return "배고파요";
    case "sick":
      return "아파요";
    case "stressed":
      return "스트레스";
    default:
      return "평온해요";
  }
}

// 성장 단계별 진화 형태 (실루엣 o=채움, 외곽선 자동 추출 + 흰 속칠)
interface Form {
  sil: string[];
  eyeY: number;
  mouthY: number;
}

const FORMS: Record<string, Form> = {
  egg: {
    eyeY: 7,
    mouthY: 9,
    sil: [
      "................", "................", ".......oo.......", "......oooo......",
      ".....oooooo.....", "....oooooooo....", "....oooooooo....", "....oooooooo....",
      "....oooooooo....", "....oooooooo....", ".....oooooo.....", ".....oooooo.....",
      "......oooo......", ".......oo.......", "................", "................",
    ],
  },
  chick: {
    eyeY: 8,
    mouthY: 11,
    sil: [
      "................", ".......oo.......", "......oooo......", ".....oooooo.....",
      "....oooooooo....", "...oooooooooo...", "...oooooooooo...", "..oooooooooooo..",
      "..oooooooooooo..", "..oooooooooooo..", "..oooooooooooo..", "...oooooooooo...",
      "...oooooooooo...", "....oooooooo....", ".....o....o.....", "....oo....oo....",
    ],
  },
  round: {
    eyeY: 7,
    mouthY: 9,
    sil: [
      "................", "....oo....oo....", "...oooo..oooo...", "..oooooooooooo..",
      "..oooooooooooo..", ".oooooooooooooo.", ".oooooooooooooo.", ".oooooooooooooo.",
      ".oooooooooooooo.", ".oooooooooooooo.", "..oooooooooooo..", "..oooooooooooo..",
      "...oooooooooo...", "....oooooooo....", ".....o....o.....", "....oo....oo....",
    ],
  },
  tall: {
    eyeY: 7,
    mouthY: 10,
    sil: [
      "................", "......oooo......", ".....oooooo.....", ".....oooooo.....",
      "....oooooooo....", "....oooooooo....", "....oooooooo....", "....oooooooo....",
      "....oooooooo....", "....oooooooo....", "....oooooooo....", "....oooooooo....",
      "....oooooooo....", "....oooooooo....", ".....o....o.....", "....oo....oo....",
    ],
  },
};

export function stageForm(stage: LifeStage): string {
  switch (stage) {
    case "baby":
      return "egg";
    case "child":
    case "elementary":
      return "chick";
    case "middle":
    case "high":
    case "university":
    case "jobseeker":
      return "round";
    default:
      return "tall"; // employee, senior, retirement
  }
}

const N = 16;

function buildMarks(f: Form, mood: MoodKey): [number, number][] {
  const eY = f.eyeY;
  const mY = f.mouthY;
  const eyes: Record<string, [number, number][]> = {
    normal: [[6, eY], [9, eY]],
    sleepy: [[5, eY], [6, eY], [9, eY], [10, eY]],
    sick: [[5, eY - 1], [6, eY], [9, eY], [10, eY - 1]],
  };
  const mouth: Record<string, [number, number][]> = {
    smile: [[6, mY], [9, mY], [7, mY + 1], [8, mY + 1]],
    frown: [[6, mY + 1], [9, mY + 1], [7, mY], [8, mY]],
    flat: [[7, mY], [8, mY]],
    open: [[7, mY], [8, mY], [7, mY + 1], [8, mY + 1]],
  };
  switch (mood) {
    case "happy":
      return [...eyes.normal, ...mouth.smile];
    case "sad":
      return [...eyes.normal, ...mouth.frown];
    case "sleepy":
      return [...eyes.sleepy, [7, mY]];
    case "hungry":
      return [...eyes.normal, ...mouth.open];
    case "sick":
      return [...eyes.sick, ...mouth.frown];
    case "stressed":
      return [...eyes.normal, [5, eY - 1], [10, eY - 1], ...mouth.flat];
    default:
      return [...eyes.normal, ...mouth.flat];
  }
}

export function Mascot({
  status,
  stage = "child",
  size = 160,
  color = "#3A2A22",
  fill = "#FFFFFF",
}: {
  status: CharacterStatus;
  stage?: LifeStage;
  size?: number;
  color?: string;
  fill?: string;
}) {
  const mood = getMood(status);
  const f = FORMS[stageForm(stage)];
  const grid = f.sil.map((r) => r.split("").map((c) => c === "o"));
  const filled = (x: number, y: number) =>
    x >= 0 && x < N && y >= 0 && y < N && grid[y][x];
  const isOutline = (x: number, y: number) =>
    grid[y][x] &&
    (!filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || !filled(x, y + 1));

  const block = new Set<string>();
  buildMarks(f, mood).forEach(([x, y]) => block.add(`${x},${y}`));

  const rects: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!grid[y][x]) continue;
      const dark = isOutline(x, y) || block.has(`${x},${y}`);
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={dark ? color : fill} />,
      );
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="pixelated"
      role="img"
      aria-label={`마스코트 (${moodLabel(mood)})`}
    >
      {rects}
    </svg>
  );
}
