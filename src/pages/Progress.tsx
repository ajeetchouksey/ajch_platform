import { useState } from 'react';
import { getSessions, getScoreByDomain, clearSessions } from '../lib/storage';
import { DOMAIN_META } from '../types/content';
import { Trash2 } from 'lucide-react';

export default function Progress() {
  const [sessions, setSessions] = useState(() => getSessions().filter((s) => s.finishedAt));
  const [domainScores, setDomainScores] = useState(() => getScoreByDomain());

  function handleClear() {
    if (!window.confirm('Clear all session history? This cannot be undone.')) return;
    clearSessions();
    setSessions([]);
    setDomainScores(getScoreByDomain());
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-slate-400 text-sm">
          No completed sessions yet. Take a quiz to start tracking your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-400 transition-colors"
        >
          <Trash2 size={13} /> Clear history
        </button>
      </div>

      {/* Domain breakdown */}
      <div className="glass-card rounded-xl p-5">
        <div className="space-y-4">
          {Object.entries(DOMAIN_META).map(([d, meta]) => {
            const stats = domainScores[Number(d)];
            const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
            return (
              <div key={d}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">
                    D{d}: {meta.title}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {pct !== null ? `${pct}%` : 'no data'}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  {pct !== null && (
                    <div
                      className={`h-full rounded-full ${pct >= 72 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                {stats.total > 0 && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {stats.correct}/{stats.total} correct
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Session history */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Session History</h2>
        <div className="space-y-2">
          {[...sessions].reverse().map((s) => {
            const pct = Math.round((s.score / s.total) * 100);
            const passed = pct >= 72;
            const date = new Date(s.finishedAt!).toLocaleDateString();
            return (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm bg-slate-800/40 rounded-lg px-4 py-3"
              >
                <div>
                  <span className="text-slate-300">
                    {s.domainFilter !== null
                      ? `D${s.domainFilter}: ${DOMAIN_META[s.domainFilter].title}`
                      : 'Full Mock Exam'}
                  </span>
                  <span className="text-slate-600 ml-2 text-xs">{date}</span>
                </div>
                <span
                  className={`font-mono font-semibold ${passed ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
