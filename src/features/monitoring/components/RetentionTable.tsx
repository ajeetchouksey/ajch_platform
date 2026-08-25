export interface RetentionWeek {
  week: number;
  activeUsers: number;
  totalUsers: number;
  pct: number; // 0-1
}

/**
 * Renders as a retention curve (Week 0-4, % of the original cohort still
 * active), not a multi-cohort grid — the backing query defines a single wide
 * cohort spanning the whole "since" window, not one cohort per join-week.
 * See runCohortReport() in workers/ga4-proxy.ts.
 */
export function RetentionTable({ weeks }: { weeks: RetentionWeek[] }) {
  if (weeks.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {weeks.map(w => (
        <div key={w.week}>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Week {w.week}{w.week === 0 ? ' (joined)' : ''}</span>
            <span className="tabular-nums">
              {w.activeUsers.toLocaleString()} / {w.totalUsers.toLocaleString()}
              <span className="text-slate-200 font-medium ml-2">{(w.pct * 100).toFixed(1)}%</span>
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(w.pct * 100, w.pct > 0 ? 1.5 : 0)}%`, background: w.week === 0 ? '#4ade80' : '#818cf8' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
