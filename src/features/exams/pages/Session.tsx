// ── Today's session: every step runs here, back to back, without page hops ───
// Built by lib/today-session.ts for the minutes chosen on the hub (?mins=).
// Takes a progress snapshot at the start, then shows exactly what changed.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Award, Check, Flame } from 'lucide-react';
import { loadExamRegistry, loadQuestionsForExam, loadTaskStatementsForExam } from '@/lib/content-loader';
import { getAttempts } from '@/lib/adaptive-quiz';
import { examMastery } from '@/lib/objective-mastery';
import { dueCount } from '@/lib/flashcards';
import { getReadinessBreakdown, recordStudyDay } from '@/lib/study-tracker';
import { getSessions } from '@/lib/storage';
import { getProfile } from '@/lib/prep-profile';
import { buildToday, questionsForStep, type SessionStep } from '@/lib/today-session';
import { diffSnapshots, newMilestones, snapshot, type Change, type Milestone, type Snapshot } from '@/lib/progress-snapshot';
import type { ExamConfig, Question, TaskStatementsFile } from '@/types/content';
import { QuestionStep, type QuestionResult } from '../components/session/QuestionStep';
import { NotesStep } from '../components/session/NotesStep';
import { CardsStep } from '../components/session/CardsStep';
import { ChangeList } from '../components/journey/ChangeList';

interface Loaded { exam: ExamConfig; statements: TaskStatementsFile | null; bank: Question[] }

export default function Session() {
  const { examId = '' } = useParams<{ examId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const minutes = Math.max(5, Math.min(90, Number(params.get('mins')) || 30));
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [steps, setSteps] = useState<SessionStep[] | null>(null);
  const [at, setAt] = useState(0);
  const [tally, setTally] = useState({ right: 0, answered: 0, cards: 0 });
  const before = useRef<Snapshot | null>(null);
  const [result, setResult] = useState<{ changes: Change[]; milestones: Milestone[]; streak: number } | null>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let alive = true;
    loadExamRegistry().then(async (r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (!exam || exam.kind === 'skill-track') { navigate(`/skillup/${examId}`, { replace: true }); return; }
      const [statements, bank] = await Promise.all([
        loadTaskStatementsForExam(examId).catch(() => null),
        loadQuestionsForExam(examId).catch(() => [] as Question[]),
      ]);
      if (!alive) return;
      // Freeze the plan for this run, so answering doesn't reshuffle the steps.
      const attempts = getAttempts(examId);
      const mastery = statements ? examMastery(statements, attempts) : null;
      const readiness = getReadinessBreakdown(examId, exam.domains, getSessions(), exam.questions).overall;
      const plan = buildToday({ exam, profile: getProfile(examId), mastery, attempts, dueCards: dueCount(examId), readiness, minutes });
      before.current = snapshot(exam, statements);
      setData({ exam, statements, bank });
      setSteps(plan.steps);
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [examId, minutes, navigate, run]);

  // Questions for the current step, picked once when the step starts.
  const stepQuestions = useMemo(() => {
    if (!data || !steps || !steps[at]) return [];
    const s = steps[at];
    if (s.kind === 'cards' || s.kind === 'notes') return [];
    return questionsForStep(s, data.bank, data.statements, getAttempts(examId));
  }, [data, steps, at, examId]);

  const advance = () => {
    if (!steps || !data) return;
    if (at + 1 < steps.length) { setAt(at + 1); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    // Finished: count the day, then show what changed.
    const streak = recordStudyDay(examId);
    const after = snapshot(data.exam, data.statements);
    setResult({ changes: before.current ? diffSnapshots(before.current, after) : [], milestones: newMilestones(data.exam, after), streak });
    setAt(steps.length);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const onQuestions = (r: QuestionResult[]) => {
    setTally((t) => ({ ...t, right: t.right + r.filter((x) => x.correct).length, answered: t.answered + r.length }));
    advance();
  };

  const base = `/skillup/${examId}`;
  if (failed) return <p className="text-sm text-slate-300">This session couldn't load. <Link to={base} className="text-brand-lilac">Back to the exam</Link></p>;
  if (!data || !steps) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse" aria-busy="true">
        <div className="h-5 w-56 bg-slate-800 rounded" />
        <div className="h-2 bg-slate-800 rounded-full" />
        <div className="glass-card rounded-2xl h-80" />
      </div>
    );
  }

  const step = steps[at];
  const done = at >= steps.length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* ── Stepper ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={base} className="inline-flex items-center gap-1.5 min-h-10 text-sm text-slate-300 hover:text-white">
          <ArrowLeft size={15} aria-hidden="true" /> {done ? 'Back to' : 'Leave'} {data.exam.shortTitle}
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-lilac">Today's session · {minutes} min</span>
      </div>
      <ol className="flex gap-1.5" aria-label="Session steps">
        {steps.map((s, k) => (
          <li key={k} className="flex-1 min-w-0" aria-current={k === at ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full transition-colors duration-500 ${k < at ? 'bg-emerald-400' : k === at ? 'bg-brand-lilac' : 'bg-slate-700/60'}`} />
            <p className={`mt-1.5 text-[11px] truncate ${k === at ? 'text-white font-semibold' : 'text-slate-400'}`}>{k < at ? '✓ ' : ''}{s.title}</p>
          </li>
        ))}
      </ol>

      {/* ── Current step ──────────────────────────────────────────────────── */}
      {!done && step && (
        <section key={at} className="anim-rise space-y-4" aria-labelledby="step-h">
          <div>
            <h1 id="step-h" className="text-2xl font-bold text-white">{step.title}</h1>
            <p className="text-sm text-slate-400">{step.meta}</p>
          </div>
          {step.kind === 'cards' && (
            <CardsStep exam={data.exam} count={step.count ?? 10} onDone={(knew) => { setTally((t) => ({ ...t, cards: t.cards + knew })); advance(); }} />
          )}
          {step.kind === 'notes' && (
            <NotesStep examId={examId} domain={step.domain ?? data.exam.domains[0].id} heading={step.heading} bank={data.bank} onDone={advance} />
          )}
          {(step.kind === 'drill' || step.kind === 'missed' || step.kind === 'baseline' || step.kind === 'mixed') && (
            stepQuestions.length
              ? <QuestionStep examId={examId} questions={stepQuestions} statements={data.statements} revealAtEnd={step.kind === 'mixed'} onDone={onQuestions} />
              : (
                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <p className="text-sm text-slate-300">Nothing left to practise here right now.</p>
                  <button type="button" onClick={advance} className="min-h-11 px-4 rounded-xl bg-brand-indigo text-white text-sm font-semibold">Next step</button>
                </div>
              )
          )}
        </section>
      )}

      {/* ── What changed ─────────────────────────────────────────────────── */}
      {done && result && (
        <section className="space-y-5" aria-labelledby="done-h">
          <div className="anim-rise rounded-2xl p-6 border border-emerald-400/35 bg-gradient-to-br from-emerald-500/15 to-slate-800/80 space-y-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-200">
              <Flame size={15} aria-hidden="true" /> {result.streak}-day streak
            </p>
            <h1 id="done-h" className="text-3xl font-bold text-white">Session done</h1>
            <p className="text-slate-300">
              {tally.answered > 0 && `${tally.right} of ${tally.answered} questions right`}
              {tally.answered > 0 && tally.cards > 0 && ' · '}
              {tally.cards > 0 && `${tally.cards} card${tally.cards === 1 ? '' : 's'} recalled`}
              {tally.answered === 0 && tally.cards === 0 && 'Reading counts. Your next step is already planned.'}
            </p>
          </div>

          {result.milestones.map((m, k) => (
            <div key={m.id} className="anim-pop flex items-start gap-3 rounded-2xl p-4 border border-amber-300/40 bg-amber-400/10" style={{ animationDelay: `${200 + k * 150}ms` }} role="status">
              <Award size={22} className="text-amber-300 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-amber-100">Milestone: {m.title}</p>
                <p className="text-sm text-amber-100/80">{m.detail}</p>
              </div>
            </div>
          ))}

          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-white">What this session changed</h2>
            {result.changes.length ? (
              <ChangeList changes={result.changes} />
            ) : (
              <p className="text-sm text-slate-300">No status changes yet. Mastery moves once an objective has enough answers; keep going.</p>
            )}
            <p className="text-xs text-slate-400">Tomorrow's session is rebuilt from today: anything you missed comes back first.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to={base} className="inline-flex items-center gap-2 min-h-12 px-5 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">
              <Check size={15} aria-hidden="true" /> Back to today
            </Link>
            <button type="button" onClick={() => { setSteps(null); setAt(0); setResult(null); setTally({ right: 0, answered: 0, cards: 0 }); navigate(`${base}/session?mins=15`, { replace: true }); setRun((n) => n + 1); }} className="inline-flex items-center gap-2 min-h-12 px-5 rounded-xl border border-slate-600/50 text-slate-200 hover:text-white text-sm font-semibold">
              Keep going: 15 more minutes <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

