interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  title: string;
  items: BarItem[];
  maxValue?: number;
}

export function DashboardChart({ title, items, maxValue }: Props) {
  const max = maxValue || Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="glass-card rounded-xl p-5">
      <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
      <div className="space-y-2.5">
        {items.map((item) => {
          const pct = Math.round((item.value / max) * 100);
          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-28 truncate shrink-0" title={item.label}>
                {item.label}
              </span>
              <div className="flex-1 h-5 bg-slate-800/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color || 'bg-violet-500/70'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-300 w-12 text-right font-mono">
                {item.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
