import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ChevronLeft, GraduationCap, Lock, RefreshCw } from 'lucide-react';
import { useAuth, useIsOwner } from '@/lib/auth';
import { fetchSkillUpLearnerStats, type SkillUpLearnerStats } from '@/lib/skillup-learners';

interface CatalogExam { id: string; code: string; title: string }

/** Exam codes and names from SkillUp's own catalog script (a few KB), so rows read "AB-731" rather than "ab731". */
function useExamNames(): Record<string, CatalogExam> {
  const [names, setNames] = useState<Record<string, CatalogExam>>({});
  useEffect(() => {
    const read = () => {
      const exams = (window as { SKILLUP?: { catalog?: { exams?: CatalogExam[] } } }).SKILLUP?.catalog?.exams ?? [];
      setNames(Object.fromEntries(exams.map((e) => [e.id, e])));
    };
    if ((window as { SKILLUP?: unknown }).SKILLUP) { read(); return; }
    const s = document.createElement('script');
    s.src = '/skillup-assets/skillup-data.js';
    s.onload = read;
    document.body.appendChild(s);
  }, []);
  return names;
}

export default function SkillUpLearners() {
  const { token, isLoading: authLoading } = useAuth();
  const isOwner = useIsOwner();
  const names = useExamNames();
  const [stats, setStats] = useState<SkillUpLearnerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped by Refresh; the effect below reloads whenever it (or the token) changes.
  const [requested, setRequested] = useState(0);
  const [loaded, setLoaded] = useState(-1);
  const loading = !!token && loaded !== requested;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchSkillUpLearnerStats(token)
      .then((s) => { if (!cancelled) { setStats(s); setError(null); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoaded(requested); });
    return () => { cancelled = true; };
  }, [token, requested]);
  const load = () => setRequested((n) => n + 1);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Checking auth…</div>;
  if (!isOwner) return <Navigate to="/" replace />;

  // Rows for exams in the catalog; anything else (ids no exam uses) is summarised in one line below.
  const known = Object.keys(names).length > 0;
  const all = stats?.exams ?? [];
  const rows = known ? all.filter((r) => names[r.exam_id]) : all;
  const other = known ? all.length - rows.length : 0;
  const summary = [
    { label: 'Unique learners', value: stats?.overall?.learners ?? 0, hint: 'across all exams' },
    { label: 'Active in 7 days', value: stats?.overall?.active7 ?? 0, hint: 'opened an exam' },
    { label: 'Exams with learners', value: rows.length, hint: `of ${Object.keys(names).length || '—'} in the catalog` },
  ];
  const th = 'px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Link to="/admin" className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Back to Admin">
          <ChevronLeft size={16} />
        </Link>
        <GraduationCap size={16} className="text-violet-400" />
        <h1 className="text-lg font-bold text-slate-100 tracking-tight">SkillUp Learners</h1>
        <Lock size={12} className="text-slate-600 ml-1" />
        <button onClick={load} disabled={loading || !token}
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      <p className="text-slate-500 text-sm mb-6 ml-7">
        Signed-in learners counted once per exam, the first time they open it. Only an anonymous ID is stored.
      </p>

      {!token && <p className="text-sm text-amber-300 mb-6">Sign in to load the numbers.</p>}
      {error && <p className="text-sm text-rose-300 mb-6">Couldn&rsquo;t load learner numbers. {error}</p>}

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">{s.value}</div>
            <div className="text-xs text-slate-300">{s.label}</div>
            <div className="text-[11px] text-slate-500">{s.hint}</div>
          </div>
        ))}
      </div>

      {stats && rows.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(71,85,105,0.15)' }}>
          No learners recorded yet. Counting starts when a signed-in learner opens an exam.
        </div>
      ) : rows.length > 0 && (
        <div className="rounded-2xl overflow-x-auto" style={{ border: '1px solid rgba(71,85,105,0.18)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(71,85,105,0.18)' }}>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Exam</th>
                <th className={th}>Learners</th>
                <th className={th}>New 7 d</th>
                <th className={th}>New 30 d</th>
                <th className={th}>Active 7 d</th>
                <th className={th}>Google</th>
                <th className={th}>GitHub</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const exam = names[r.exam_id];
                return (
                  <tr key={r.exam_id} style={{
                    background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.6)',
                    borderBottom: i < rows.length - 1 ? '1px solid rgba(71,85,105,0.1)' : undefined,
                  }}>
                    <td className="px-4 py-2.5">
                      <Link to={`/skillup/${r.exam_id}`} className="text-xs font-semibold text-slate-200 hover:text-violet-300 transition-colors">
                        {exam?.code ?? r.exam_id}
                      </Link>
                      {exam && <div className="text-[11px] text-slate-500 truncate max-w-[260px]">{exam.title}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-100 font-semibold tabular-nums">{r.total}</td>
                    <td className="px-3 py-2.5 text-right text-slate-300 tabular-nums">{r.new7}</td>
                    <td className="px-3 py-2.5 text-right text-slate-300 tabular-nums">{r.new30}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-300 tabular-nums">{r.active7}</td>
                    <td className="px-3 py-2.5 text-right text-slate-400 tabular-nums">{r.google}</td>
                    <td className="px-3 py-2.5 text-right text-slate-400 tabular-nums">{r.github}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {other > 0 && (
        <p className="text-[11px] text-slate-500 mt-3">
          {other} other exam {other === 1 ? 'ID' : 'IDs'} not in the catalog were recorded and are left out above.
        </p>
      )}
      {stats && <p className="text-[11px] text-slate-600 mt-3">Updated {new Date(stats.generatedAt).toLocaleString()}</p>}
    </div>
  );
}
