import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSessions, getScoreByDomain, clearSessions } from '@/lib/storage';
import { loadExamRegistry } from '@/lib/content-loader';
import type { DomainConfig } from '@/types/content';
import { Trash2, RotateCcw, TrendingUp, TrendingDown, Minus, BarChart2, Brain } from 'lucide-react';

export default function Progress() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const [sessions, setSessions] = useState(() => getSessions().filter((s) => s.finishedAt && s.skillId === examId));
  const [domainScores, setDomainScores] = useState(() => getScoreByDomain(examId));
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
    setDomainScores(getScoreByDomain(examId));
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-3">
        <p className="page-eyebrow">{examShortTitle} Tracking</p>
        <h1 className="text-2xl font-bold tracking-tight"><span className="heading-gradient">Progress</span></h1>
        <div className="mt-12 flex flex-col items-center text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
            <BarChart2 size={26} className="text-slate-500" />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">No sessions yet</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Complete a quiz to start tracking your progress, domain scores, and readiness over time.
          </p>
          <Link
            to={`/skillup/${examId}/quiz`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/20"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Brain size={15} />
            Take your first quiz
          </Link>
        </div>
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
            const attempted = (stats?.total ?? 0) > 0;
            const pct = attempted ? Math.round((stats.correct / stats.total) * 100) : null;
            // colour: green ≥ threshold, amber = attempted-but-0, red = below threshold
            const barColor = pct === null ? '' : pct >= passThreshold ? 'bg-emerald-500' : pct === 0 ? 'bg-amber-500/60' : 'bg-rose-500';
            const pctLabel = pct !== null ? `${pct}%` : 'not started';
            const labelColor = pct === null ? 'text-slate-600' : pct >= passThreshold ? 'text-emerald-400' : pct === 0 ? 'text-amber-500' : 'text-rose-400';
            return (
              <div key={domain.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">D{domain.id}: {domain.title}</span>
                  <span className={`font-mono text-xs ${labelColor}`}>{pctLabel}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  {/* Always render a bar track; for attempted-but-0 show a 2px pill */}
                  {pct !== null && (
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: pct === 0 ? '2px' : `${pct}%` }}
                    />
                  )}
                </div>
                {attempted && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {stats.correct}/{stats.total} correct
                    {pct === 0 && <span className="text-amber-600/70 ml-1">· attempted</span>}
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
          {(() => {
            const reversed = [...sessions].reverse();
            // Build per-domain score history to compute trend
            const domainHistory: Record<string, number[]> = {};
            for (const s of sessions) {
              const key = s.domainFilter !== null ? String(s.domainFilter) : 'full';
              domainHistory[key] = [...(domainHistory[key] ?? []), Math.round((s.score / s.total) * 100)];
            }
            const seenCount: Record<string, number> = {};
            return reversed.map((s) => {
              const pct = Math.round((s.score / s.total) * 100);
              const passed = pct >= passThreshold;
              const date = new Date(s.finishedAt!).toLocaleDateString();
              const domainLabel = s.domainFilter !== null
                ? `D${s.domainFilter}: ${examDomains.find((d) => d.id === s.domainFilter)?.title ?? 'Domain'}`
                : 'Full Mock Exam';
              const key = s.domainFilter !== null ? String(s.domainFilter) : 'full';
              const history = domainHistory[key] ?? [];
              seenCount[key] = (seenCount[key] ?? 0) + 1;
              const seenIdx = history.length - seenCount[key]; // index from start (oldest = 0)
              const prevPct = seenIdx > 0 ? history[seenIdx - 1] : null;
              const TrendIcon = prevPct === null ? null : pct > prevPct ? TrendingUp : pct < prevPct ? TrendingDown : Minus;
              const trendColor = prevPct === null ? '' : pct > prevPct ? 'text-emerald-400' : pct < prevPct ? 'text-rose-400' : 'text-slate-500';
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm bg-slate-800/40 rounded-lg px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-300">{domainLabel}</span>
                    <span className="text-slate-600 text-xs">{date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {TrendIcon && <TrendIcon size={13} className={trendColor} />}
                    <span className={`font-mono font-semibold ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pct}%
                    </span>
                    <Link
                      to={`/skillup/${examId}/quiz`}
                      className="text-xs text-slate-600 hover:text-violet-400 transition-colors flex items-center gap-1"
                      title="Retry this domain"
                    >
                      <RotateCcw size={11} />
                    </Link>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
