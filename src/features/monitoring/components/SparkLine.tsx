interface SparkLineProps {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Index in `points` where a dashed (projected/forecast) style begins — the point at this index is shared by both segments so the line stays continuous. Omit for a plain solid line. */
  dashedFromIndex?: number;
}

export function SparkLine({ points, width = 200, height = 40, color = '#a78bfa', dashedFromIndex }: SparkLineProps) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const hasProjection = dashedFromIndex !== undefined && dashedFromIndex >= 0 && dashedFromIndex < points.length - 1;
  const solidPts = hasProjection ? coords.slice(0, dashedFromIndex! + 1) : coords;
  const dashedPts = hasProjection ? coords.slice(dashedFromIndex!) : [];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={solidPts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {hasProjection && (
        <polyline points={dashedPts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" opacity={0.6} />
      )}
    </svg>
  );
}
