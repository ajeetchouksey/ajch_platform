import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Flame, CheckCircle2, TrendingUp, Clock, ArrowRight, CalendarCheck, GraduationCap } from 'lucide-react';
import { getSessions } from '@/lib/storage';
import { getBookmarks } from '@/lib/bookmarks';
import { createEmptyProgress } from '@/lib/progress-schema';
import { computeSchedule, getDueDomains } from '@/lib/scheduler';
import type { ExamDomainRef, ScheduleEntry } from '@/lib/scheduler';
import { loadExamRegistry } from '@/lib/content-loader';
import type { QuizSession } from '@/types/content';

// ── Helpers ────────────────────────────────────────────────────────────────

function calcStreak(sessions: QuizSession[]): number {
  const days = new Set(
    sessions
      .filter((s) => s.finishedAt)
      .map((s) => new Date(s.finishedAt!).toISOString().slice(0, 10))
  );
  if (days.size === 0) return 0;

  const sorted = [...days].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

function avgPct(sessions: QuizSession[]): number {
  const done = sessions.filter((s) => s.finishedAt && s.total > 0);
  if (done.length === 0) return 0;
  return Math.round(done.reduce((sum, s) => sum + (s.score / s.total) * 100, 0) / done.length);
}

function fmtDate(ts: number | string): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [mounted, setMounted] = useState(false);
  const [dueDomains, setDueDomains] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    const localSessions = getSessions().filter((s) => s.finishedAt);
    setSessions(localSessions);
    setTimeout(() => setMounted(true), 0);

    // Build scheduler from manifest whitelist + local sessions
    loadExamRegistry().then((registry) => {
      const refs: ExamDomainRef[] = registry.exams.flatMap((exam) =>
        exam.domains.map((d) => ({
          examId: exam.id,
          domainId: d.id,
          examTitle: exam.shortTitle,
          domainTitle: d.title,
        }))
      );
      // Sessions mapped to scheduler format (domain-filtered only)
      // QuizSession timestamps are Unix ms numbers — convert to ISO8601 strings for Session type
      const schedulerSessions = localSessions
        .filter((s) => s.domainFilter !== null)
        .map((s) => ({
          id: s.id,
          examId: 'ccaf',
          domain: s.domainFilter,
          startedAt: new Date(s.startedAt).toISOString(),
          finishedAt: s.finishedAt ? new Date(s.finishedAt).toISOString() : null,
          score: s.score,
          total: s.total,
        }));
      const schedule = computeSchedule(schedulerSessions, refs);
      setDueDomains(getDueDomains(schedule));
    }).catch(() => {});
  }, []);

  // Bookmarks come from ProgressV2; use empty until Gist sync is wired (Sprint 4+)
  const emptyProgress = createEmptyProgress();
  const bookmarks = getBookmarks(emptyProgress);

  const streak = calcStreak(sessions);
  const avg = avgPct(sessions);
  const totalQ = sessions.reduce((s, q) => s + q.total, 0);

  const stats = [
    { label: 'Sessions', value: sessions.length, icon: CheckCircle2, color: '#a78bfa' },
    { label: 'Avg Score', value: `${avg}%`, icon: TrendingUp, color: '#34d399' },
    { label: 'Questions', value: totalQ, icon: Clock, color: '#60a5fa' },
    { label: 'Streak', value: `${streak}d`, icon: Flame, color: '#fb923c' },
  ];

  const recent = [...sessions].sort((a, b) =>
    new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime()
  ).slice(0, 5);

  return (
    <div
      className="space-y-8"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Header */}
      <div>
        <p className="page-eyebrow">My Learning</p>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="heading-gradient">Dashboard</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Your progress at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Icon size={16} style={{ color }} />
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Recent Sessions</h2>
          <Link
            to="/skillup"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors"
          >
            Start quiz <ArrowRight size={12} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No sessions yet.{' '}
            <Link to="/skillup" className="text-violet-400 hover:underline">Take a quiz</Link> to start.
          </p>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400">Exam</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s, i) => {
                  const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
                  const pass = pct >= 72;
                  return (
                    <tr
                      key={s.id}
                      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                    >
                      <td className="px-4 py-2.5 text-slate-300 capitalize">
                        {s.domainFilter !== null ? `Domain ${s.domainFilter}` : 'Mixed'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {fmtDate(s.finishedAt!)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span style={{ color: pass ? '#34d399' : '#f87171' }}>
                          {pct}%
                        </span>
                        <span className="text-slate-600 ml-1">({s.score}/{s.total})</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Due for Review */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck size={14} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300">Due for Review</h2>
            {dueDomains.length > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#fb923c22', color: '#fb923c' }}>
                {dueDomains.length}
              </span>
            )}
          </div>
          <Link to="/skillup" className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors">
            All exams <ArrowRight size={12} />
          </Link>
        </div>

        {dueDomains.length === 0 ? (
          <p className="text-slate-500 text-sm">
            All caught up! Complete a domain quiz to start spaced repetition tracking.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {dueDomains.slice(0, 6).map((entry) => {
              const overdueDays = Math.round(
                (new Date().getTime() - new Date(entry.dueDate).getTime()) / 86_400_000
              );
              return (
                <Link
                  key={`${entry.examId}-${entry.domainId}`}
                  to={`/skillup/${entry.examId}/quiz?domain=${entry.domainId}`}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                >
                  <GraduationCap size={14} className="mt-0.5 shrink-0" style={{ color: '#34d399' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{entry.examTitle}</p>
                    <p className="text-sm text-slate-200 truncate">{entry.domainTitle}</p>
                    <p className="text-xs mt-0.5" style={{ color: overdueDays > 0 ? '#fb923c' : '#34d399' }}>
                      {overdueDays > 0 ? `${overdueDays}d overdue` : 'Due today'}
                    </p>
                  </div>
                  <ArrowRight size={12} className="mt-1 shrink-0 text-slate-600" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Bookmarks */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookMarked size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300">Bookmarks</h2>
          <span className="text-xs text-slate-600">({bookmarks.length})</span>
        </div>

        {bookmarks.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No bookmarks yet — bookmark posts and notes to find them here.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {bookmarks.map((id) => (
              <li key={id}>
                <Link
                  to={`/${id}`}
                  className="text-sm text-violet-400 hover:underline"
                >
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
