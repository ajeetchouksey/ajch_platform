export function SkeletonCard({ rows = 1 }: { rows?: number }) {
  return (
    <div className="rounded-xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="h-7 w-20 rounded bg-slate-700/50 mb-2" />
      <div className="h-3 w-32 rounded bg-slate-700/30" />
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <div key={i} className="h-3 w-full rounded bg-slate-700/20 mt-2" />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-3 py-2">
      <div className="h-3 flex-1 rounded bg-slate-700/40" />
      <div className="h-3 w-16 rounded bg-slate-700/30" />
      <div className="h-3 w-10 rounded bg-slate-700/20" />
    </div>
  );
}
