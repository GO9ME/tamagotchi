import type { CharacterStatus } from "@/types/character";

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

// 16x16 본체 실루엣 (o = 픽셀). 눈/입은 아래 CARVE 로 파낸다.
const BODY = [
  "       oo       ",
  "      o  o      ",
  "      oooo      ",
  "    oooooooo    ",
  "   oooooooooo   ",
  "  oooooooooooo  ",
  "  oooooooooooo  ",
  " oooooooooooooo ",
  " oooooooooooooo ",
  " oooooooooooooo ",
  " oooooooooooooo ",
  "  oooooooooooo  ",
  "  oooooooooooo  ",
  "   oooooooooo   ",
  "    oooooooo    ",
  "   oo  oo  oo   ",
];

// 표정별로 본체에서 비워낼 셀 [x, y]
const CARVE: Record<MoodKey, [number, number][]> = {
  neutral: [[5, 8], [10, 8], [7, 11], [8, 11]],
  happy: [[5, 8], [10, 8], [6, 11], [9, 11], [7, 12], [8, 12]],
  sad: [[5, 8], [10, 8], [7, 11], [8, 11], [6, 12], [9, 12]],
  sleepy: [[4, 8], [5, 8], [6, 8], [9, 8], [10, 8], [11, 8], [7, 11]],
  hungry: [[5, 8], [10, 8], [7, 11], [8, 11], [7, 12], [8, 12]],
  sick: [[4, 7], [6, 7], [5, 8], [9, 7], [11, 7], [10, 8], [6, 11], [7, 12], [8, 11], [9, 12]],
  stressed: [[5, 8], [10, 8], [4, 6], [5, 7], [11, 6], [10, 7], [6, 12], [7, 11], [8, 12], [9, 11]],
};

function buildGrid(mood: MoodKey): boolean[][] {
  const g = BODY.map((row) => row.split("").map((ch) => ch === "o"));
  for (const [x, y] of CARVE[mood]) {
    if (g[y] && x >= 0 && x < 16) g[y][x] = false;
  }
  return g;
}

export function Mascot({
  status,
  size = 160,
  color = "#3C4A2B",
}: {
  status: CharacterStatus;
  size?: number;
  color?: string;
}) {
  const mood = getMood(status);
  const grid = buildGrid(mood);
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x]) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      fill={color}
      className="pixelated"
      role="img"
      aria-label={`마스코트 (${moodLabel(mood)})`}
    >
      {rects}
    </svg>
  );
}
