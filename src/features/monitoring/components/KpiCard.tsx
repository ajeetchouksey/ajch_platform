interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
  delta?: string;
  deltaPositive?: boolean;
}

export function KpiCard({ label, value, sub, accent = '#a78bfa', icon, delta, deltaPositive }: KpiCardProps) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {icon && <span style={{ color: accent }}>{icon}</span>}
      <p className="text-2xl font-bold leading-none tabular-nums" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
      {delta && (
        <p className={`text-[10px] font-medium ${deltaPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {deltaPositive ? '↑' : '↓'} {delta} vs prev period
        </p>
      )}
    </div>
  );
}
