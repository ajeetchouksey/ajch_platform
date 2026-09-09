import { useId } from 'react';

interface CircularProgressProps {
  pct: number;
  readTime: number;
}

/**
 * Circular reading-progress ring, shown in an article's sticky sidebar.
 * Was defined byte-for-byte identically in both Notes.tsx and BlogPost.tsx
 * (ajch_food_for_thoughts#52) — unified here. Uses useId() for the SVG
 * gradient id so two instances can safely coexist on one page (neither
 * original call site needed that, but a shared component shouldn't assume
 * it's always alone).
 */
export function CircularProgress({ pct, readTime }: CircularProgressProps) {
  const gradientId = useId();
  const r = 18;
  const c = 2 * Math.PI * r;
  const remaining = Math.max(0, Math.round(readTime * (1 - pct / 100)));
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
      <div className="relative w-11 h-11 shrink-0">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(71,85,105,0.25)" strokeWidth="2.5" />
          <circle cx="22" cy="22" r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
          {Math.round(pct)}%
        </span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-200">Reading</p>
        <p className="text-[10px] text-slate-500">
          {pct >= 99 ? 'Complete ✓' : `${remaining} min left`}
        </p>
      </div>
    </div>
  );
}
