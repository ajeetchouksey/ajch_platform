import { useState } from 'react';

interface SparkLineProps {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Index in `points` where a dashed (projected/forecast) style begins — the point at this index is shared by both segments so the line stays continuous. Omit for a plain solid line. */
  dashedFromIndex?: number;
  /** Parallel array to `points` (dates or other labels) shown in the hover tooltip. Omit to disable the tooltip. */
  labels?: string[];
  /** Value formatter for the tooltip — defaults to a plain number. */
  formatValue?: (v: number) => string;
  /** Indices in `points` to mark with a dot (e.g. anomalous days) */
  markers?: number[];
  markerColor?: string;
}

export function SparkLine({
  points, width = 200, height = 40, color = '#a78bfa', dashedFromIndex,
  labels, formatValue, markers, markerColor = '#fb923c',
}: SparkLineProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const xAt = (i: number) => pad + (i / (points.length - 1)) * w;
  const yAt = (v: number) => pad + h - ((v - min) / range) * h;

  const coords = points.map((v, i) => `${xAt(i)},${yAt(v)}`);

  const hasProjection = dashedFromIndex !== undefined && dashedFromIndex >= 0 && dashedFromIndex < points.length - 1;
  const solidPts = hasProjection ? coords.slice(0, dashedFromIndex! + 1) : coords;
  const dashedPts = hasProjection ? coords.slice(dashedFromIndex!) : [];

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!labels) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((relX - pad) / w) * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, i)));
  }

  const tooltip = hoverIndex !== null && labels?.[hoverIndex] !== undefined ? {
    x: xAt(hoverIndex),
    y: yAt(points[hoverIndex]),
    label: labels[hoverIndex],
    value: formatValue ? formatValue(points[hoverIndex]) : String(points[hoverIndex]),
  } : null;

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        onMouseMove={labels ? handleMove : undefined}
        onMouseLeave={labels ? () => setHoverIndex(null) : undefined}
        style={{ cursor: labels ? 'crosshair' : undefined }}
      >
        <polyline points={solidPts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {hasProjection && (
          <polyline points={dashedPts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" opacity={0.6} />
        )}
        {markers?.map(i => (
          <circle key={i} cx={xAt(i)} cy={yAt(points[i])} r={3} fill={markerColor} stroke="#0f172a" strokeWidth={1} />
        ))}
        {tooltip && (
          <line x1={tooltip.x} y1={pad} x2={tooltip.x} y2={pad + h} stroke={color} strokeWidth={1} opacity={0.25} />
        )}
      </svg>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-[10px] text-slate-200 shadow-lg whitespace-nowrap"
          style={{
            left: tooltip.x, top: Math.max(0, tooltip.y - 32),
            transform: tooltip.x > width - 60 ? 'translateX(-100%)' : 'translateX(-50%)',
          }}
        >
          <div className="text-slate-500">{tooltip.label}</div>
          <div className="font-semibold">{tooltip.value}</div>
        </div>
      )}
    </div>
  );
}
