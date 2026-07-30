interface Segment { label: string; value: number; color: string; }

interface DonutChartProps {
  segments: Segment[];
  size?: number;
}

export function DonutChart({ segments, size = 120 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 44;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const arcs = segments.map((seg, i) => {
    const offset = segments.slice(0, i).reduce((s, s2) => s + s2.value / total, 0);
    const pct = seg.value / total;
    const dash = pct * circumference;
    return { ...seg, dashArray: `${dash} ${circumference - dash}`, dashOffset: -offset * circumference };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={14}
            strokeDasharray={arc.dashArray} strokeDashoffset={arc.dashOffset} />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-slate-400">{seg.label}</span>
            <span className="text-slate-200 font-medium tabular-nums ml-1">
              {total > 0 ? `${Math.round((seg.value / total) * 100)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
