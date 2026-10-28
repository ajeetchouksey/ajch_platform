import type { Forecast } from '@/lib/prep-profile';
import { PASS_LINE } from '@/lib/prep-profile';

/** Readiness forecast line against the pass mark. Points glide when inputs change. */
export function ForecastChart({ f, endLabel, muted = false }: { f: Forecast; endLabel: string; muted?: boolean }) {
  const X = (w: number) => (w / f.horizonWeeks) * 290 + 5;
  const Y = (r: number) => 120 - r * 1.1;
  const line = f.curve.map(([w, r]) => `${X(w).toFixed(1)},${Y(r).toFixed(1)}`).join(' ');
  const area = `${line} ${X(f.horizonWeeks).toFixed(1)},120 5,120`;
  const [ew, er] = f.curve[f.curve.length - 1];
  const tone = muted ? '#56657c' : er >= PASS_LINE ? '#34d399' : er >= PASS_LINE - 8 ? '#fbbf24' : '#fb7185';
  return (
    <svg viewBox="0 0 300 130" role="img" aria-label={`Forecast: about ${f.end}% ready at ${endLabel}; pass mark ${PASS_LINE}%`} className="w-full h-auto overflow-visible">
      <line x1="0" x2="300" y1={Y(PASS_LINE)} y2={Y(PASS_LINE)} stroke="rgba(52,211,153,0.55)" strokeDasharray="4 4" />
      <text x="298" y={Y(PASS_LINE) - 4} textAnchor="end" fill="#6ee7b7" fontSize="10">pass {PASS_LINE}%</text>
      <polygon points={area} fill="rgba(169,155,255,0.14)" style={{ transition: 'all .45s' }} />
      <polyline points={line} fill="none" stroke={muted ? '#56657c' : 'var(--color-brand-lilac)'} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" style={{ transition: 'all .45s' }} />
      <circle cx={X(ew)} cy={Y(er)} r="6" fill={tone} stroke="#0e1a2d" strokeWidth="2" style={{ transition: 'all .45s' }} />
      <text x="5" y="129" fill="#8796ad" fontSize="10">today</text>
      <text x="295" y="129" textAnchor="end" fill="#8796ad" fontSize="10">{endLabel}</text>
    </svg>
  );
}
