/** Conic readiness ring — the one progress visual shared by the exam overview and My learning. */
export function ReadinessRing({ pct, size = 64, label }: { pct: number; size?: number; label?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const inset = Math.max(5, Math.round(size * 0.12));
  return (
    <div
      role="img"
      aria-label={label ?? `${p}% ready`}
      className="relative shrink-0 rounded-full"
      style={{
        width: size, height: size,
        background: `conic-gradient(var(--color-brand-lilac) 0 ${p}%, rgba(148,163,184,0.18) ${p}% 100%)`,
      }}
    >
      <div
        className="absolute rounded-full bg-[#16233a] flex items-center justify-center font-bold text-white"
        style={{ inset, fontSize: Math.max(11, Math.round(size * 0.26)) }}
      >
        {p}%
      </div>
    </div>
  );
}
