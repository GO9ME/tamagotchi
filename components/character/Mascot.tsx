import type { CharacterStatus, Gender, LifeStage } from "@/types/character";

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
    eyeY: 6,
    mouthY: 9,
    sil: [
      "................", "................", ".......oo.......", "......oooo......",
      ".....oooooo.....", "....oooooooo....", "....oooooooo....", "....oooooooo....",
      "....oooooooo....", "....oooooooo....", ".....oooooo.....", ".....oooooo.....",
      "......oooo......", ".......oo.......", "................", "................",
    ],
  },
  chick: {
    eyeY: 7,
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
    mouthY: 10,
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

interface FaceMarks {
  dark: [number, number][]; // 눈·입 등 진한 픽셀
  blush: [number, number][]; // 볼터치(분홍) 후보 — 칠해질 수 있는 곳만 적용
}

/**
 * 귀여운 표정: 2×2 큰 눈 + 바깥 위 한 칸을 비워 흰 반짝임(글린트), 작은 입, 볼터치.
 * 여성은 눈 바깥 위에 작은 속눈썹 한 픽셀.
 */
function buildMarks(f: Form, mood: MoodKey, gender?: Gender): FaceMarks {
  const eY = f.eyeY;
  const mY = f.mouthY;

  // 2×2 눈, 바깥 위 모서리는 비워 글린트(흰색)로 남긴다.
  const bigEyes: [number, number][] = [
    [6, eY], [5, eY + 1], [6, eY + 1], // 왼눈 (5,eY) 비움 → 반짝임
    [9, eY], [9, eY + 1], [10, eY + 1], // 오른눈 (10,eY) 비움 → 반짝임
  ];
  const closedEyes: [number, number][] = [
    [5, eY], [6, eY], [9, eY], [10, eY], // 감은 눈 (가로선)
  ];
  const lashes: [number, number][] =
    gender === "female" ? [[4, eY - 1], [11, eY - 1]] : [];

  const mouth: Record<string, [number, number][]> = {
    smile: [[6, mY], [9, mY], [7, mY + 1], [8, mY + 1]],
    tiny: [[7, mY], [8, mY]],
    frown: [[7, mY], [8, mY], [6, mY + 1], [9, mY + 1]],
    open: [[7, mY], [8, mY], [7, mY + 1], [8, mY + 1]],
  };
  // 눈 바로 아래 통통한 볼터치 — 좁은 알(egg) 형태에서도 내부에 들어오도록 안쪽 배치
  const cheeks: [number, number][] = [[5, eY + 2], [10, eY + 2]];

  switch (mood) {
    case "happy":
      return { dark: [...bigEyes, ...lashes, ...mouth.smile], blush: cheeks };
    case "sad":
      return { dark: [...bigEyes, ...mouth.frown], blush: [] };
    case "sleepy":
      return { dark: [...closedEyes, [7, mY], [8, mY]], blush: cheeks };
    case "hungry":
      return { dark: [...bigEyes, ...mouth.open], blush: [] };
    case "sick":
      return { dark: [...closedEyes, ...mouth.frown], blush: [] };
    case "stressed":
      return {
        dark: [...bigEyes, [4, eY - 1], [11, eY - 1], ...mouth.tiny],
        blush: [],
      };
    default: // neutral
      return { dark: [...bigEyes, ...lashes, ...mouth.tiny], blush: cheeks };
  }
}

export const MASCOT_GRID = N;

export interface MascotCell {
  x: number;
  y: number;
  fill: string;
}

/** 마스코트 픽셀 셀(색 포함) 계산 — React(svg)·canvas(공유카드) 공용 순수 함수 */
export function mascotCells(
  status: CharacterStatus,
  stage: LifeStage,
  gender: Gender | undefined,
  colors: { color: string; fill: string; blush: string },
): MascotCell[] {
  const f = FORMS[stageForm(stage)];
  const grid = f.sil.map((r) => r.split("").map((c) => c === "o"));
  const filled = (x: number, y: number) =>
    x >= 0 && x < N && y >= 0 && y < N && grid[y][x];
  const isOutline = (x: number, y: number) =>
    grid[y][x] &&
    (!filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || !filled(x, y + 1));

  const marks = buildMarks(f, getMood(status), gender);
  const block = new Set<string>();
  marks.dark.forEach(([x, y]) => block.add(`${x},${y}`));
  const blushSet = new Set<string>();
  marks.blush.forEach(([x, y]) => blushSet.add(`${x},${y}`));

  const cells: MascotCell[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!grid[y][x]) continue;
      const key = `${x},${y}`;
      const isDark = isOutline(x, y) || block.has(key);
      // 우선순위: 진한색 > 볼터치(내부·외곽선 아닌 칸만) > 흰색
      cells.push({
        x,
        y,
        fill: isDark ? colors.color : blushSet.has(key) ? colors.blush : colors.fill,
      });
    }
  }
  return cells;
}

export function Mascot({
  status,
  stage = "child",
  gender,
  size = 160,
  color = "#3A2A22",
  fill = "#FFFFFF",
  blush = "#FF9FB0",
}: {
  status: CharacterStatus;
  stage?: LifeStage;
  gender?: Gender;
  size?: number;
  color?: string;
  fill?: string;
  blush?: string;
}) {
  const mood = getMood(status);
  const cells = mascotCells(status, stage, gender, { color, fill, blush });

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
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1} fill={c.fill} />
      ))}
    </svg>
  );
}
