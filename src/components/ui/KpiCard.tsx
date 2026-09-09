import { CATEGORICAL, STATUS } from '@/lib/chart-tokens';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  /**
   * Accepts any hex — Monitoring's per-channel/per-device charts feed a
   * dynamic color keyed off runtime data (ajch_food_for_thoughts#52's
   * scope), so this stays `string` rather than `CategoricalKey`.
   */
  accent?: string;
  icon?: React.ReactNode;
  delta?: string;
  deltaPositive?: boolean;
}

export function KpiCard({ label, value, sub, accent = CATEGORICAL.violet, icon, delta, deltaPositive }: KpiCardProps) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {icon && <span style={{ color: accent }}>{icon}</span>}
      <p className="text-2xl font-bold leading-none tabular-nums" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
      {delta && (
        <p className="text-[10px] font-medium" style={{ color: deltaPositive ? STATUS.good : STATUS.critical }}>
          {deltaPositive ? '↑' : '↓'} {delta} vs prev period
        </p>
      )}
    </div>
  );
}
