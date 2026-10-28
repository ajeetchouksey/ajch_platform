import { useState } from 'react';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import type { Change } from '@/lib/progress-snapshot';

const SHOWN = 4;

/** Before/after changes, biggest first, animated in; long lists collapse. */
export function ChangeList({ changes }: { changes: Change[] }) {
  const [all, setAll] = useState(false);
  // Readiness and coverage first, then objectives moving up, then the rest.
  const order = (c: Change) => (/^Readiness|^Objectives covered/.test(c.text) ? 0 : c.kind === 'up' ? 1 : c.kind === 'down' ? 2 : 3);
  const sorted = [...changes].sort((a, b) => order(a) - order(b));
  const shown = all ? sorted : sorted.slice(0, SHOWN);
  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {shown.map((c, k) => (
          <li key={c.text} className="anim-rise flex items-start gap-2 text-sm text-slate-200" style={{ animationDelay: `${k * 80}ms` }}>
            {c.kind === 'up' ? <TrendingUp size={16} className="text-emerald-400 shrink-0 mt-0.5" aria-label="Up" />
              : c.kind === 'down' ? <TrendingDown size={16} className="text-rose-400 shrink-0 mt-0.5" aria-label="Down" />
                : <Info size={16} className="text-brand-lilac shrink-0 mt-0.5" aria-hidden="true" />}
            <span>{c.text}</span>
          </li>
        ))}
      </ul>
      {sorted.length > SHOWN && (
        <button type="button" aria-expanded={all} onClick={() => setAll((v) => !v)} className="min-h-10 text-sm font-semibold text-brand-lilac hover:text-white">
          {all ? 'Show less' : `Show ${sorted.length - SHOWN} more`}
        </button>
      )}
    </div>
  );
}
