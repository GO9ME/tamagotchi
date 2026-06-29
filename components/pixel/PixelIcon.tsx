import { PIXEL_ICONS } from "@/lib/pixel/icons";

export function PixelIcon({
  name,
  size = 22,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const rows = PIXEL_ICONS[name];
  if (!rows) return null;

  const rects: React.ReactNode[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "x") {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={`pixelated ${className ?? ""}`}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}
