interface BarRow { label: string; value: number; }

interface HBarChartProps {
  rows: BarRow[];
  accent?: string;
  formatValue?: (v: number) => string;
  maxRows?: number;
  onRowClick?: (row: BarRow) => void;
}

export function HBarChart({ rows, accent = '#a78bfa', formatValue, maxRows = 10, onRowClick }: HBarChartProps) {
  const display = rows.slice(0, maxRows);
  const max = Math.max(...display.map(r => r.value), 1);
  return (
    <div className="flex flex-col gap-2">
      {display.map((row, i) => {
        const formatted = formatValue ? formatValue(row.value) : row.value.toLocaleString();
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-xs ${onRowClick ? 'cursor-pointer rounded hover:bg-white/[0.03] -mx-1 px-1' : ''}`}
            title={`${row.label}: ${formatted}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <span className="text-slate-400 truncate w-40 shrink-0">{row.label}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(row.value / max) * 100}%`, background: accent }} />
            </div>
            <span className="text-slate-300 tabular-nums w-10 text-right shrink-0">
              {formatted}
            </span>
          </div>
        );
      })}
    </div>
  );
}
