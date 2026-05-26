import type { ElementType } from 'react';
import { GlassCard } from './GlassCard';
import type { AccentKey } from './GlassCard';

// ─── Stat item ───────────────────────────────────────────────────────────────
export interface StatItem {
  icon: ElementType;
  value: string | number;
  label: string;
  /** Tailwind text color class e.g. 'text-violet-400' */
  color?: string;
  /** Accent key or raw gradient for the card top border */
  accent?: AccentKey | string;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface StatGridProps {
  stats: StatItem[];
  cols?: 2 | 3 | 4;
  className?: string;
}

const COLS_MAP = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
} as const;

// ─── Component ───────────────────────────────────────────────────────────────
export function StatGrid({ stats, cols = 4, className = '' }: StatGridProps) {
  return (
    <div className={`grid ${COLS_MAP[cols]} gap-3 ${className}`}>
      {stats.map(({ icon: Icon, value, label, color = 'text-violet-400', accent }) => (
        <GlassCard
          key={label}
          accent={accent}
          className="glass-stats p-4 text-center"
          rounded="xl"
        >
          <Icon size={16} className={`mx-auto ${color} mb-1.5`} />
          <div className="text-xl font-bold text-white">{value}</div>
          <div className="text-[11px] text-slate-500">{label}</div>
        </GlassCard>
      ))}
    </div>
  );
}
