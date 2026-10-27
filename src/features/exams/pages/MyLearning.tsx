// ── My learning: one place for every exam the learner has started ─────────────
// Everything here is derived from local progress (attempts, notes read, cards,
// streaks) — nothing is stored by this page itself.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Circle, Flame, Layers, Target, GraduationCap } from 'lucide-react';
import { loadExamRegistry, loadTaskStatementsForExam } from '@/lib/content-loader';
import { getAttempts } from '@/lib/adaptive-quiz';
import { examMastery, type ExamMastery, type ObjectiveMastery } from '@/lib/objective-mastery';
import { getReadinessBreakdown, getResumeState, getStreak, getDomainCompletion, resumeLabel } from '@/lib/study-tracker';
import { getNotesSeen, getSessions } from '@/lib/storage';
import { dueCount, getCardStates } from '@/lib/flashcards';
import type { ExamConfig, QuestionAttempt } from '@/types/content';
import { ReadinessRing } from '../components/ReadinessRing';

const DAY = 86_400_000;
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

interface ExamProgress {
  exam: ExamConfig;
  attempts: QuestionAttempt[];
  readiness: number;
  started: boolean;
  lastActive: number;
  due: number;
  mastery: ExamMastery | null;
}

/** The single most useful next step for an exam — mirrors the overview's path. */
function nextStep(p: ExamProgress): { label: string; to: string } {
  const base = `/skillup/${p.exam.id}`;
  if (!p.attempts.length) return { label: 'Take a baseline quiz', to: `${base}/quiz?mode=review` };
  const sessions = getSessions();
  const unread = p.exam.domains.find((d) => !getDomainCompletion(p.exam.id, d.id, sessions).notesRead);
  if (unread) return { label: `Read D${unread.id} notes`, to: `${base}/notes?d=${unread.id}` };
  const w = p.mastery?.weakest;
  if (w) return { label: `Practise objective ${w.task.id}`, to: `${base}/quiz?task=${encodeURIComponent(w.task.id)}` };
  return { label: 'Take the timed exam', to: `${base}/quiz?mode=timed` };
}

function StatusChip({ p }: { p: ExamProgress }) {
  const [label, cls] = p.started
    ? ['In progress', 'bg-brand-indigo/25 text-[#d4ccff]']
    : ['Not started', 'bg-slate-500/15 text-slate-300'];
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function MyLearning() {
  const [exams, setExams] = useState<ExamConfig[] | null>(null);
  const [masteries, setMasteries] = useState<Record<string, ExamMastery>>({});
  const [filter, setFilter] = useState<'progress' | 'all'>('progress');
  const requested = useRef(new Set<string>());
  const [now] = useState(() => Date.now());

  useEffect(() => {
    loadExamRegistry()
      .then((r) => setExams(r.exams.filter((e) => e.available && !e.deprecatedAt && e.kind !== 'skill-track')))
      .catch(() => setExams([]));
  }, []);

  const progress = useMemo<ExamProgress[]>(() => {
    if (!exams) return [];
    const sessions = getSessions();
    const seen = getNotesSeen();
    return exams.map((exam) => {
      const attempts = getAttempts(exam.id);
      const notesTimes = Object.entries(seen).filter(([k]) => k.startsWith(`${exam.id}:`)).map(([, v]) => Date.parse(v) || 0);
      const resume = getResumeState(exam.id);
      const lastActive = Math.max(0, ...attempts.map((a) => a.attemptedAt), ...notesTimes, resume?.ts ?? 0);
      return {
        exam, attempts, lastActive,
        readiness: getReadinessBreakdown(exam.id, exam.domains, sessions, exam.questions).overall,
        started: lastActive > 0,
        due: dueCount(exam.id),
        mastery: masteries[exam.id] ?? null,
      };
    }).sort((a, b) => b.lastActive - a.lastActive);
  }, [exams, masteries]);

  // Objective mastery needs each started exam's task statements.
  useEffect(() => {
    if (!exams) return;
    for (const p of progress) {
      if (!p.started || requested.current.has(p.exam.id)) continue;
      requested.current.add(p.exam.id);
      loadTaskStatementsForExam(p.exam.id)
        .then((ts) => { if (ts) setMasteries((m) => ({ ...m, [p.exam.id]: examMastery(ts, getAttempts(p.exam.id)) })); })
        .catch(() => {});
    }
  }, [exams, progress]);

  if (!exams) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-9 w-64 bg-slate-800 rounded-lg" />
        <div className="glass-card rounded-2xl h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[0, 1].map((i) => <div key={i} className="glass-card rounded-2xl h-40" />)}</div>
      </div>
    );
  }

  const started = progress.filter((p) => p.started);
  const focus = started[0] ?? null;
  const streak = Math.max(0, ...progress.map((p) => getStreak(p.exam.id)));
  const totalDue = progress.reduce((n, p) => n + p.due, 0);
  const mostDue = [...progress].sort((a, b) => b.due - a.due)[0];
  const shown = filter === 'all' || !started.length ? progress : started;

  const weakest: { p: ExamProgress; o: ObjectiveMastery }[] = started
    .flatMap((p) => (p.mastery?.objectives ?? []).filter((o) => o.attempted > 0 && o.status !== 'strong').map((o) => ({ p, o })))
    .sort((a, b) => a.o.mastery - b.o.mastery)
    .slice(0, 3);

  // ── Today's plan: three tasks that tick themselves off from real activity ──
  const today = dayKey(now);
  const tasks: { label: string; meta: string; to: string; done: boolean }[] = [];
  if (focus) {
    const resume = getResumeState(focus.exam.id);
    const sessions = getSessions();
    const unread = focus.exam.domains.find((d) => !getDomainCompletion(focus.exam.id, d.id, sessions).notesRead);
    const notesD = resume?.domainId ?? unread?.id ?? focus.exam.domains[0]?.id;
    const readToday = Object.entries(getNotesSeen()).some(([k, v]) => k.startsWith(`${focus.exam.id}:`) && v.slice(0, 10) === today);
    tasks.push({
      label: resumeLabel(resume) ? `Read on from “${resumeLabel(resume)}”` : `Read D${notesD} notes`,
      meta: `${focus.exam.shortTitle} · about 10 min`, to: `/skillup/${focus.exam.id}/notes?d=${notesD}`, done: readToday,
    });
    const inReview = Object.keys(getCardStates(focus.exam.id)).length;
    tasks.push({
      label: focus.due > 0 ? `Review ${focus.due} flashcard${focus.due === 1 ? '' : 's'}` : inReview ? 'Flashcards are clear' : 'Make your first flashcards',
      meta: focus.due > 0 ? `Due now · about ${Math.max(2, Math.ceil(focus.due / 2))} min` : inReview ? 'Nothing due until later' : 'Built from the notes · 5 min',
      to: `/skillup/${focus.exam.id}/flashcards`, done: focus.due === 0 && inReview > 0,
    });
    const answeredToday = focus.attempts.filter((a) => new Date(a.attemptedAt).toISOString().slice(0, 10) === today).length;
    const w = focus.mastery?.weakest;
    tasks.push({
      label: w ? `Drill objective ${w.task.id}` : 'Answer 10 practice questions',
      meta: `${focus.exam.shortTitle} · ${Math.min(answeredToday, 10)}/10 answered today`,
      to: w ? `/skillup/${focus.exam.id}/quiz?task=${encodeURIComponent(w.task.id)}` : `/skillup/${focus.exam.id}/quiz`,
      done: answeredToday >= 10,
    });
  }
  const doneCount = tasks.filter((t) => t.done).length;

  // ── This week: questions answered per day, all exams ──
  const allAttempts = progress.flatMap((p) => p.attempts);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString('en-GB', { weekday: 'short' }), n: allAttempts.filter((a) => new Date(a.attemptedAt).toISOString().slice(0, 10) === key).length };
  });
  const weekTotal = days.reduce((n, d) => n + d.n, 0);
  const weekMax = Math.max(1, ...days.map((d) => d.n));
  const cardsInReview = progress.reduce((n, p) => n + Object.keys(getCardStates(p.exam.id)).length, 0);

  const focusResume = focus ? getResumeState(focus.exam.id) : null;
  const focusResumeDomain = focus && focusResume ? focus.exam.domains.find((d) => d.id === focusResume.domainId) : null;
  const focusNext = focus ? nextStep(focus) : null;

  return (
    <div className="space-y-6 max-w-[1180px]">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-[1_1_420px] space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-lilac">SkillUp · My learning</p>
          <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight text-white">{focus ? 'Welcome back' : 'Start learning'}</h1>
          <p className="text-slate-300 text-[15px] max-w-2xl">
            {focus
              ? `You're ${focus.readiness}% ready for ${focus.exam.shortTitle}. The pass mark is ${focus.exam.passThreshold}%; the plan below is the quickest way up.`
              : 'Pick an exam below. Your readiness, streak and review cards will build up here as you study. Progress is kept in this browser.'}
          </p>
        </div>
        {(streak > 0 || totalDue > 0) && (
          <div className="flex flex-wrap gap-2">
            {streak > 0 && (
              <span className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-full bg-amber-400/10 border border-amber-400/30 text-sm font-semibold text-amber-200">
                <Flame size={15} aria-hidden="true" /> {streak}-day streak
              </span>
            )}
            {totalDue > 0 && mostDue && (
              <Link to={`/skillup/${mostDue.exam.id}/flashcards`} className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-full bg-slate-800/80 border border-slate-600/40 hover:border-brand-lilac/55 text-sm font-semibold text-slate-100 transition-colors">
                <Layers size={15} aria-hidden="true" className="text-brand-lilac" /> {totalDue} card{totalDue === 1 ? '' : 's'} due for review
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── Continue ──────────────────────────────────────────────────────── */}
      {focus && focusNext && (
        <section aria-labelledby="continue-h" className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border border-brand-lilac/35 bg-gradient-to-br from-brand-indigo/30 to-slate-800/60">
          <div className="min-w-0 flex-[1_1_320px] space-y-1">
            <p id="continue-h" className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-lilac">Continue where you left off</p>
            <h2 className="text-xl font-bold text-white">
              {focus.exam.shortTitle} · {focusResumeDomain ? `D${focusResumeDomain.id} ${resumeLabel(focusResume) ?? focusResumeDomain.title}` : focusNext.label}
            </h2>
            <p className="text-sm text-slate-300">
              {focusResumeDomain ? `Study notes · ${focusResumeDomain.title}` : focus.exam.title}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {focusResumeDomain && (
              <Link to={`/skillup/${focus.exam.id}/notes?d=${focusResumeDomain.id}`} className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold transition-colors">
                <BookOpen size={15} aria-hidden="true" /> Resume reading
              </Link>
            )}
            <Link
              to={focusNext.to}
              className={`inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-sm font-semibold transition-colors ${
                focusResumeDomain ? 'border border-brand-lilac/45 text-brand-tint hover:bg-brand-indigo/20' : 'bg-brand-indigo hover:bg-brand-indigo-deep text-white'
              }`}
            >
              {focusNext.label} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-6 items-start">
        {/* ── Exams + weakest objectives ─────────────────────────────────── */}
        <div className="flex-[999_1_560px] min-w-0 space-y-6">
          <section aria-labelledby="exams-h" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="exams-h" className="text-xl font-bold text-white">{started.length ? 'My exams' : 'Exams'}</h2>
              {started.length > 0 && (
                <div role="group" aria-label="Filter exams" className="inline-flex p-1 rounded-xl bg-slate-800/70 border border-slate-600/30">
                  {([['progress', 'In progress'], ['all', 'All exams']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={filter === id}
                      onClick={() => setFilter(id)}
                      className={`min-h-9 px-3 rounded-lg text-sm font-semibold transition-colors ${filter === id ? 'bg-brand-indigo text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
              {shown.map((p) => {
                const next = nextStep(p);
                const cov = Math.round((p.mastery?.coverage ?? 0) * 100);
                return (
                  <li key={p.exam.id} className="glass-card rounded-2xl p-4 flex flex-col gap-3 border border-slate-600/20 hover:border-brand-lilac/45 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold tracking-wider text-brand-lilac">{p.exam.shortTitle}</span>
                      <StatusChip p={p} />
                    </div>
                    <Link to={`/skillup/${p.exam.id}`} className="flex items-center gap-3 group">
                      {p.started ? <ReadinessRing pct={p.readiness} size={56} /> : (
                        <span className="w-14 h-14 shrink-0 rounded-full border-2 border-dashed border-slate-600/60 flex items-center justify-center" aria-hidden="true">
                          <GraduationCap size={20} className="text-slate-400" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-white leading-snug group-hover:text-brand-tint">{p.exam.title}</span>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          {p.started ? (p.mastery ? `${cov}% of objectives covered` : `${p.attempts.length} questions answered`) : `${p.exam.domains.length} domains · ${p.exam.duration}`}
                        </span>
                      </span>
                    </Link>
                    <Link to={next.to} className="mt-auto inline-flex items-center gap-1.5 min-h-10 text-sm font-semibold text-brand-lilac hover:text-white transition-colors">
                      <ArrowRight size={14} aria-hidden="true" /> {next.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link to="/skillup" className="inline-flex items-center gap-1.5 min-h-10 text-sm text-slate-300 hover:text-white transition-colors">
              <GraduationCap size={15} aria-hidden="true" /> Browse the full catalog
            </Link>
          </section>

          {weakest.length > 0 && (
            <section aria-labelledby="weak-h" className="space-y-3">
              <h2 id="weak-h" className="text-xl font-bold text-white">Weakest objectives</h2>
              <ul className="glass-card rounded-2xl px-4 divide-y divide-slate-700/40">
                {weakest.map(({ p, o }) => (
                  <li key={`${p.exam.id}-${o.task.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <span className="text-xs font-bold text-brand-lilac w-24 shrink-0">{p.exam.shortTitle} {o.task.id}</span>
                    <span className="flex-[1_1_220px] min-w-0 text-sm text-slate-200">{o.task.title}</span>
                    <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                      <span className="h-1.5 w-16 rounded-full bg-slate-700/60 overflow-hidden" aria-hidden="true">
                        <span className="block h-full rounded-full bg-rose-400" style={{ width: `${Math.round(o.mastery * 100)}%` }} />
                      </span>
                      {Math.round(o.mastery * 100)}% mastery
                    </span>
                    <Link
                      to={`/skillup/${p.exam.id}/quiz?task=${encodeURIComponent(o.task.id)}`}
                      className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-lg border border-brand-lilac/35 text-sm font-semibold text-brand-lilac hover:text-white hover:border-brand-lilac/70 transition-colors"
                    >
                      <Target size={13} aria-hidden="true" /> Drill it
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Today + this week ──────────────────────────────────────────── */}
        {focus && (
          <aside className="flex-[1_1_300px] min-w-0 space-y-4">
            <section aria-labelledby="today-h" className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="today-h" className="text-lg font-bold text-white">Today's plan</h2>
                <span className="text-xs text-slate-400">{doneCount} of {tasks.length} done</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-brand-lilac transition-all" style={{ width: `${(doneCount / Math.max(1, tasks.length)) * 100}%` }} />
              </div>
              <ul className="space-y-1">
                {tasks.map((t) => (
                  <li key={t.label}>
                    <Link to={t.to} className="flex items-start gap-3 min-h-11 py-2 rounded-lg hover:bg-slate-800/50 px-1 -mx-1 transition-colors">
                      {t.done
                        ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" aria-label="Done" />
                        : <Circle size={18} className="text-slate-500 shrink-0 mt-0.5" aria-label="To do" />}
                      <span className="min-w-0">
                        <span className={`block text-sm ${t.done ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{t.label}</span>
                        <span className="block text-xs text-slate-400">{t.meta}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-400">
                {doneCount === tasks.length ? 'Plan done for today. Nice work.' : 'Each task ticks itself off when you do it.'}
              </p>
            </section>

            <section aria-labelledby="week-h" className="glass-card rounded-2xl p-5 space-y-3">
              <h2 id="week-h" className="text-lg font-bold text-white">This week</h2>
              <div
                role="img"
                aria-label={`Questions answered per day: ${days.map((d) => `${d.label} ${d.n}`).join(', ')}`}
                className="flex items-end gap-2 h-24"
              >
                {days.map((d, i) => (
                  <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className={`w-full rounded-md ${i === 6 ? 'bg-brand-lilac' : d.n ? 'bg-brand-lilac/45' : 'bg-slate-600/30'}`}
                      style={{ height: `${Math.max(6, Math.round((d.n / weekMax) * 100))}%` }}
                    />
                    <span className="text-[11px] text-slate-400" aria-hidden="true">{d.label.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-300">
                {weekTotal} question{weekTotal === 1 ? '' : 's'} answered · {cardsInReview} card{cardsInReview === 1 ? '' : 's'} in review
              </p>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
