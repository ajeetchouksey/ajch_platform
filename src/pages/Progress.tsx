import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSessions, getScoreByDomain, clearSessions } from '../lib/storage';
import { loadExamRegistry } from '../lib/content-loader';
import type { DomainConfig } from '../types/content';
import { Trash2 } from 'lucide-react';

export default function Progress() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const [sessions, setSessions] = useState(() => getSessions().filter((s) => s.finishedAt));
  const [domainScores, setDomainScores] = useState(() => getScoreByDomain());
  const [examDomains, setExamDomains] = useState<DomainConfig[]>([]);
  const [examShortTitle, setExamShortTitle] = useState('Exam');
  const [passThreshold, setPassThreshold] = useState(72);

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (exam) {
        setExamDomains(exam.domains);
        setExamShortTitle(exam.shortTitle);
        setPassThreshold(exam.passThreshold);
      }
    }).catch(() => {});
  }, [examId]);

  function handleClear() {
    if (!window.confirm('Clear all session history? This cannot be undone.')) return;
    clearSessions();
    setSessions([]);
    setDomainScores(getScoreByDomain());
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-3">
        <p className="page-eyebrow">{examShortTitle} Tracking</p>
        <h1 className="text-2xl font-bold tracking-tight"><span className="heading-gradient">Progress</span></h1>
        <p className="text-slate-400 text-sm">
          No completed sessions yet. Take a quiz to start tracking your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="page-eyebrow">{examShortTitle} Tracking</p>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight"><span className="heading-gradient">Progress</span></h1>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-400 transition-colors"
        >
          <Trash2 size={13} /> Clear history
        </button>
      </div>

      {/* Summary stat cards */}
      {(() => {
        const best = Math.max(...sessions.map((s) => Math.round((s.score / s.total) * 100)));
        const avg = Math.round(sessions.reduce((acc, s) => acc + (s.score / s.total), 0) / sessions.length * 100);
        return (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions', value: sessions.length, color: 'text-sky-400' },
              { label: 'Best Score', value: `${best}%`, color: best >= passThreshold ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'Avg Score', value: `${avg}%`, color: avg >= passThreshold ? 'text-emerald-400' : 'text-amber-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Domain breakdown */}
      <div className="glass-card rounded-xl p-5">
        <div className="space-y-4">
          {examDomains.map((domain) => {
            const stats = domainScores[domain.id];
            const pct = stats?.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
            return (
              <div key={domain.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">
                    D{domain.id}: {domain.title}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {pct !== null ? `${pct}%` : 'no data'}
                  </span>
                </div>
                <div className="h-3.5 bg-slate-800 rounded-full overflow-hidden">
                  {pct !== null && (
                    <div
                      className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
                {stats?.total > 0 && (
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
        <h2 className="section-heading mb-4">Session History</h2>
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
                      ? `D${s.domainFilter}: ${examDomains.find((d) => d.id === s.domainFilter)?.title ?? 'Domain'}`
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
