// ─── Props ───────────────────────────────────────────────────────────────────
interface PulsingDotProps {
  /** Whether to show the ping animation */
  active?: boolean;
  /** Tailwind bg class e.g. 'bg-emerald-400' */
  color?: string;
  /** Dot diameter */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
} as const;

// ─── Component ───────────────────────────────────────────────────────────────
export function PulsingDot({
  active = false,
  color = 'bg-emerald-400',
  size = 'sm',
  className = '',
}: PulsingDotProps) {
  const dot = SIZE_MAP[size];
  return (
    <span className={`relative flex shrink-0 ${dot} ${className}`}>
      {active && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full ${dot} ${active ? color : 'bg-slate-600'}`}
      />
    </span>
  );
}
