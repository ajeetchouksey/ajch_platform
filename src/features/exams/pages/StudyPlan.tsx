import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronRight, BookOpen, Brain, AlertTriangle, CheckCircle2, Circle, ArrowLeft, RefreshCw, Clock, Zap } from 'lucide-react';
import { loadExamRegistry } from '@/lib/content-loader';
import { getSessions } from '@/lib/storage';
import {
  loadPlan,
  savePlan,
  toggleActivity,
  generatePlan,
  isPlanCompressed,
  nextIncompleteSession,
  defaultTargetDate,
  isValidExamId,
} from '@/lib/plan-generator';
import type { StudyPlan as StudyPlanType, StudySession, Activity } from '@/lib/plan-generator';
import type { ExamConfig } from '@/types/content';

// ── Activity icon ─────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: Activity['type'] }) {
  if (type === 'notes')  return <BookOpen  size={13} className="text-blue-400   shrink-0" />;
  if (type === 'quiz')   return <Brain      size={13} className="text-violet-400 shrink-0" />;
  return                        <AlertTriangle size={13} className="text-rose-400   shrink-0" />;
}

// ── Session card ──────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: StudySession;
  onToggle: (day: number, actIdx: number) => void;
  defaultOpen?: boolean;
}

function SessionCard({ session, onToggle, defaultOpen = false }: SessionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const doneCount = session.activities.filter((a) => a.completed).length;
  const total = session.activities.length;

  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${session.completed ? 'opacity-60' : ''}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/30 transition-colors"
        aria-expanded={open}
      >
        {session.completed ? (
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
        ) : (
          <Circle size={18} className="text-slate-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Day {session.day}</span>
            <span className="text-sm font-semibold text-white truncate">{session.domainTitle}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={10} />{session.estimatedMinutes} min</span>
            <span>{doneCount}/{total} done</span>
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? Math.round((doneCount / total) * 100) : 0}%` }}
          />
        </div>
        {open ? <ChevronDown size={16} className="text-slate-500 shrink-0" /> : <ChevronRight size={16} className="text-slate-500 shrink-0" />}
      </button>

      {/* Activities */}
      {open && (
        <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
          {session.activities.map((activity, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${activity.completed ? 'opacity-50' : 'hover:bg-slate-800/20'}`}
            >
              <button
                onClick={() => onToggle(session.day, idx)}
                className="shrink-0 text-slate-400 hover:text-white transition-colors"
                aria-label={activity.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {activity.completed
                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                  : <Circle size={16} />
                }
              </button>
              <ActivityIcon type={activity.type} />
              <Link
                to={activity.link}
                className={`flex-1 text-sm transition-colors ${activity.completed ? 'line-through text-slate-600' : 'text-slate-300 hover:text-white'}`}
              >
                {activity.label}
              </Link>
              <span className="text-xs text-slate-600 shrink-0">{activity.estimatedMinutes} min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface PlanState {
  plan: StudyPlanType | null;
  targetDate: string;
}
type PlanAction =
  | { type: 'loaded'; plan: StudyPlanType }
  | { type: 'regenerated'; plan: StudyPlanType; targetDate: string }
  | { type: 'toggled'; plan: StudyPlanType };

function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'loaded':      return { plan: action.plan, targetDate: action.plan.targetDate };
    case 'regenerated': return { plan: action.plan, targetDate: action.targetDate };
    case 'toggled':     return { ...state, plan: action.plan };
  }
}

export default function StudyPlan() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [{ plan, targetDate }, dispatch] = useReducer(planReducer, {
    plan: null,
    targetDate: defaultTargetDate(),
  });
  const [mounted, setMounted] = useState(false);

  const sessions = useMemo(() => getSessions(), []);

  // Validate examId on mount
  const validId = isValidExamId(examId) ? examId : null;

  // Load exam config
  useEffect(() => {
    if (!validId) return;
    loadExamRegistry()
      .then((r) => setExam(r.exams.find((e) => e.id === validId) ?? null))
      .catch(() => {});
    requestAnimationFrame(() => setMounted(true));
  }, [validId]);

  // Load or initialise plan when exam is ready
  useEffect(() => {
    if (!validId || !exam) return;
    const saved = loadPlan(validId);
    if (saved) {
      dispatch({ type: 'loaded', plan: saved });
    } else {
      const fresh = generatePlan({ examId: validId, domains: exam.domains, sessions, targetDate });
      if (fresh) { savePlan(fresh); dispatch({ type: 'loaded', plan: fresh }); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, validId]);

  const regenerate = useCallback((newDate: string) => {
    if (!validId || !exam) return;
    const fresh = generatePlan({ examId: validId, domains: exam.domains, sessions, targetDate: newDate });
    if (fresh) { savePlan(fresh); dispatch({ type: 'regenerated', plan: fresh, targetDate: newDate }); }
  }, [validId, exam, sessions]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    regenerate(e.target.value);
  };

  const handleToggle = useCallback((day: number, actIdx: number) => {
    if (!validId) return;
    const updated = toggleActivity(validId, day, actIdx);
    if (updated) dispatch({ type: 'toggled', plan: updated });
  }, [validId]);

  const next = plan ? nextIncompleteSession(plan) : null;
  const compressed = plan ? isPlanCompressed(plan) : false;
  const totalSessions = plan?.sessions.length ?? 0;
  const completedSessions = plan?.sessions.filter((s) => s.completed).length ?? 0;
  const totalMinutes = plan?.sessions.reduce((sum, s) => sum + s.estimatedMinutes, 0) ?? 0;

  const daysUntil = useMemo(() => {
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000));
  }, [targetDate]);

  // Invalid examId guard
  if (!validId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500 text-sm">Invalid exam ID.</p>
      </div>
    );
  }

  // Loading skeleton
  if (!exam || !plan) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded-full" />
        <div className="h-10 w-full bg-slate-800 rounded-xl" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  const daysUntilStr = daysUntil > 0 ? `${daysUntil}d` : 'Today!';

  return (
    <div className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Back nav */}
      <Link
        to={`/skillup/${validId}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to {exam.shortTitle} Overview
      </Link>

      {/* Header */}
      <div>
        <p className="page-eyebrow">{exam.shortTitle} Exam</p>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays size={22} className="text-violet-400" />
          Study Plan
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Personalised day-by-day prep schedule based on your quiz scores.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sessions',     value: `${completedSessions}/${totalSessions}`, color: 'text-violet-400' },
          { label: 'Total time',   value: `${totalMinutes} min`,                   color: 'text-blue-400'   },
          { label: 'Days to exam', value: daysUntilStr, color: daysUntil <= 3 ? 'text-rose-400' : 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card rounded-xl p-3 text-center">
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Target date picker */}
      <div className="glass-card glass-edge rounded-xl p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <CalendarDays size={15} className="text-violet-400" />
          <span>Target exam date</span>
        </div>
        <input
          type="date"
          value={targetDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={handleDateChange}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
        />
        <button
          onClick={() => regenerate(targetDate)}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          title="Regenerate plan"
        >
          <RefreshCw size={13} />
          Regenerate
        </button>
      </div>

      {/* Compressed warning */}
      {compressed && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-950/60 border border-amber-800/50 rounded-xl text-sm text-amber-300">
          <Zap size={15} className="mt-0.5 shrink-0" />
          <span>
            <strong>Tight schedule:</strong> Your target date is sooner than ideal — sessions are compressed to 2 per day.
            Consider extending your target date for a more relaxed pace.
          </span>
        </div>
      )}

      {/* Next session CTA */}
      {next && (
        <div className="glass-card glass-edge rounded-xl p-4 flex items-center gap-4 border border-violet-800/30">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-0.5">Up next — Day {next.day}</p>
            <p className="text-sm font-semibold text-white truncate">{next.domainTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5">{next.activities.length} activities · {next.estimatedMinutes} min</p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById(`session-day-${next.day}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="btn-primary shrink-0 text-sm px-4 py-2"
          >
            Jump to session
          </button>
        </div>
      )}

      {completedSessions === totalSessions && totalSessions > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 size={15} className="shrink-0" />
          <span><strong>Plan complete!</strong> You've finished all sessions. Ready to sit the exam?</span>
        </div>
      )}

      {/* Session cards */}
      <div className="space-y-3">
        {plan.sessions.map((session) => (
          <div key={`${session.day}-${session.domainId}`} id={`session-day-${session.day}`}>
            <SessionCard
              session={session}
              onToggle={handleToggle}
              defaultOpen={next?.day === session.day && next?.domainId === session.domainId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
