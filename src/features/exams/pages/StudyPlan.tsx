import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CalendarDays, ChevronDown, ChevronRight, BookOpen, Brain, AlertTriangle, CheckCircle2, Circle, RefreshCw, Clock, Zap, Sparkles, RotateCcw, MessageCircle, X, LayoutList, Calendar, TrendingDown } from 'lucide-react';
import { loadExamRegistry } from '@/lib/content-loader';
import { getSessions } from '@/lib/storage';
import {
  loadPlan,
  savePlan,
  toggleActivity,
  generatePlan,
  buildAIPlan,
  isPlanCompressed,
  nextIncompleteSession,
  defaultTargetDate,
  isValidExamId,
  getDailyMinutesPref,
  setDailyMinutesPref,
  getWeakDomains,
  getQuizScoresByDomain,
  autoSyncProgressToPlan,
} from '@/lib/plan-generator';
import type { DailyMinutes, DomainQuizScore } from '@/lib/plan-generator';
import { getDailyCard, exportStudyPlanAsIcal, getStreak, getReadinessScore } from '@/lib/study-tracker';
import {
  callMentorPlan,
  callMentorChat,
  loadMentorChat,
  saveMentorChat,
} from '@/lib/mentor-api';
import type { StudyPlan as StudyPlanType, StudySession, Activity } from '@/lib/plan-generator';
import type { ExamConfig } from '@/types/content';
import { useProgressSync } from '@/lib/useProgressSync';

// ── Activity icon ─────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: Activity['type'] }) {
  if (type === 'notes')  return <BookOpen  size={13} className="text-blue-400   shrink-0" />;
  if (type === 'quiz')   return <Brain      size={13} className="text-violet-400 shrink-0" />;
  return                        <AlertTriangle size={13} className="text-rose-400   shrink-0" />;
}

// ── Ask Mentor panel (per session) ────────────────────────────────────────────

interface AskMentorPanelProps {
  examId: string;
  day: number;
  domainTitle: string;
}

function AskMentorPanel({ examId, day, domainTitle }: AskMentorPanelProps) {
  const defaultQ = `Why is ${domainTitle} important and what are the most likely exam questions?`;
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(defaultQ);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(() => loadMentorChat(examId, day));
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await callMentorChat(examId, domainTitle, question);
      setAnswer(resp);
      saveMentorChat(examId, day, resp);
    } catch {
      setError('Mentor is unavailable — please try again later.');
    } finally {
      setLoading(false);
    }
  }, [examId, domainTitle, day, question, loading]);

  return (
    <div className="border-t border-slate-800/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/20 transition-colors"
        aria-expanded={open}
      >
        <MessageCircle size={12} className="text-violet-400 shrink-0" />
        <span className="font-medium">Ask Mentor</span>
        {open ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.substring(0, 300))}
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            placeholder="Ask the mentor about this domain..."
          />
          <div className="flex items-center gap-2">
            <button
              onClick={ask}
              disabled={loading || !question.trim()}
              className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                  Asking…
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  Ask
                </>
              )}
            </button>
            {answer && (
              <button
                onClick={() => { setAnswer(null); saveMentorChat(examId, day, ''); setQuestion(defaultQ); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          {answer && !error && (
            <div className="prose prose-invert prose-xs max-w-none text-slate-300 [&>p]:text-xs [&>p]:leading-relaxed [&>ul]:text-xs [&>ul]:leading-relaxed bg-slate-800/40 rounded-lg p-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mini calendar view ────────────────────────────────────────────────────────

interface PlanCalendarProps {
  plan: import('@/lib/plan-generator').StudyPlan;
  targetDate: string;
  onDayClick: (day: number) => void;
}

function PlanCalendar({ plan, targetDate, onDayClick }: PlanCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  // Build map: calendar-date-string → session day numbers
  const dayMap = new Map<string, number[]>();
  for (const s of plan.sessions) {
    const d = new Date(today);
    d.setDate(d.getDate() + s.day - 1);
    const key = d.toISOString().split('T')[0];
    const existing = dayMap.get(key) ?? [];
    existing.push(s.day);
    dayMap.set(key, existing);
  }

  // Build grid starting from today
  const totalDays = Math.max(7, Math.round((target.getTime() - today.getTime()) / 86_400_000) + 1);
  const cells: { date: Date; key: string }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    cells.push({ date: d, key: d.toISOString().split('T')[0] });
  }

  const completedDays = new Set(plan.sessions.filter((s) => s.completed).map((s) => s.day));

  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">
        Study Calendar — {totalDays} days to exam
      </p>
      <div className="grid grid-cols-7 gap-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-600 pb-1">{d}</div>
        ))}
        {/* Offset to correct weekday */}
        {Array.from({ length: cells[0]?.date.getDay() ?? 0 }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {cells.map(({ date, key }) => {
          const sessionDays = dayMap.get(key) ?? [];
          const hasSession = sessionDays.length > 0;
          const allDone = hasSession && sessionDays.every((d) => completedDays.has(d));
          const isToday = key === today.toISOString().split('T')[0];
          const isTarget = key === targetDate;
          return (
            <button
              key={key}
              onClick={() => hasSession && onDayClick(sessionDays[0])}
              disabled={!hasSession}
              className={`relative flex flex-col items-center justify-center rounded-lg aspect-square text-[11px] font-bold transition-all ${
                hasSession ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default opacity-30'
              } ${isToday ? 'ring-1 ring-violet-500' : ''} ${
                allDone
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : hasSession
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25 hover:bg-violet-500/25'
                  : 'text-slate-700'
              }`}
              title={hasSession ? `Day ${sessionDays.join('+')} · click to jump` : undefined}
            >
              {date.getDate()}
              {isTarget && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 border border-slate-900" title="Exam day" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500/50 inline-block" />Study day</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/50 inline-block" />Completed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />Exam date</span>
      </div>
    </div>
  );
}

// ── Session card ──────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: StudySession;
  examId: string;
  onToggle: (day: number, actIdx: number) => void;
  defaultOpen?: boolean;
  domainScore?: DomainQuizScore;
}

function SessionCard({ session, examId, onToggle, defaultOpen = false, domainScore }: SessionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const doneCount = session.activities.filter((a) => a.completed).length;
  const total = session.activities.length;

  const firstIncomplete = session.activities.find((a) => !a.completed);

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
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><Clock size={10} />{session.estimatedMinutes} min</span>
            <span>{doneCount}/{total} done</span>
            {domainScore && domainScore.attempts > 0 && (
              <span className={`flex items-center gap-1 font-semibold ${domainScore.lastScore >= 70 ? 'text-emerald-400' : domainScore.lastScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {domainScore.lastScore}% last quiz
              </span>
            )}
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? Math.round((doneCount / total) * 100) : 0}%` }}
          />
        </div>
        {/* Start button — only on incomplete sessions */}
        {!session.completed && firstIncomplete && (
          <Link
            to={firstIncomplete.link}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 transition-colors"
            title="Start this session"
          >
            Start →
          </Link>
        )}
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
              <span className="text-xs text-slate-500 shrink-0">{activity.estimatedMinutes} min</span>
              {!activity.completed && (
                <Link
                  to={activity.link}
                  className="shrink-0 text-slate-600 hover:text-violet-400 transition-colors ml-1"
                  title="Open"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mentor note (AI-generated plans only) */}
      {session.mentorNote && (
        <div className="border-t border-violet-800/30 px-4 py-2 flex items-center gap-2 bg-violet-950/20">
          <Sparkles size={11} className="text-violet-400 shrink-0" />
          <span className="text-xs text-violet-300 italic">{session.mentorNote}</span>
        </div>
      )}

      {/* Ask Mentor panel */}
      <AskMentorPanel examId={examId} day={session.day} domainTitle={session.domainTitle} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface PlanState {
  plan: StudyPlanType | null;
  staticPlan: StudyPlanType | null;
  targetDate: string;
  aiMode: boolean;
}
type PlanAction =
  | { type: 'loaded'; plan: StudyPlanType }
  | { type: 'regenerated'; plan: StudyPlanType; targetDate: string }
  | { type: 'toggled'; plan: StudyPlanType }
  | { type: 'ai_generated'; plan: StudyPlanType }
  | { type: 'reset_to_auto' };

function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'loaded':      return { plan: action.plan, staticPlan: action.plan, targetDate: action.plan.targetDate, aiMode: false };
    case 'regenerated': return { plan: action.plan, staticPlan: action.plan, targetDate: action.targetDate, aiMode: false };
    case 'toggled':     return { ...state, plan: action.plan };
    case 'ai_generated': return { ...state, plan: action.plan, aiMode: true };
    case 'reset_to_auto': return { ...state, plan: state.staticPlan, aiMode: false };
  }
}

export default function StudyPlan() {
  const { examId } = useParams<{ examId: string }>();
  // Validate examId early — needed by lazy useState initialisers below
  const validId = isValidExamId(examId) ? examId : null;

  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [{ plan, aiMode, staticPlan, targetDate }, dispatch] = useReducer(planReducer, {
    plan: null,
    staticPlan: null,
    targetDate: defaultTargetDate(),
    aiMode: false,
  });
  const [mounted, setMounted] = useState(false);

  // Mentor UI state
  const [planRequest, setPlanRequest] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);
  const [coachNote, setCoachNote] = useState<string | null>(null);

  // View + time commitment
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [dailyMinutes, setDailyMinutesState] = useState<DailyMinutes>(() =>
    validId ? getDailyMinutesPref(validId) : 30,
  );

  const CHIP_SUGGESTIONS = [
    'Focus on my weakest domains',
    'Give me a 5-day crash course',
    'I learn best with short daily sessions',
  ];

  const sessions = useMemo(() => getSessions(), []);
  const { syncToGist } = useProgressSync();

  // Per-domain quiz scores for progress display on session cards
  const quizScoresByDomain = useMemo(
    () => exam ? getQuizScoresByDomain(validId ?? '', exam.domains.map(d => d.id), sessions) : {},
    [exam, validId, sessions],
  );

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

  // Auto-sync quiz history into plan activities on load
  useEffect(() => {
    if (!validId || !plan || sessions.length === 0) return;
    const updated = autoSyncProgressToPlan(validId, sessions);
    if (updated) dispatch({ type: 'toggled', plan: updated });
  // run once per plan identity change (not on every sessions change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validId, plan?.examId]);

  const regenerate = useCallback((newDate: string, mins: DailyMinutes = dailyMinutes) => {
    if (!validId || !exam) return;
    const fresh = generatePlan({ examId: validId, domains: exam.domains, sessions, targetDate: newDate, dailyMinutes: mins });
    if (fresh) { savePlan(fresh); dispatch({ type: 'regenerated', plan: fresh, targetDate: newDate }); }
  }, [validId, exam, sessions, dailyMinutes]);

  const handleDailyMinutesChange = useCallback((mins: DailyMinutes) => {
    if (!validId) return;
    setDailyMinutesState(mins);
    setDailyMinutesPref(validId, mins);
    regenerate(targetDate, mins);
  }, [validId, targetDate, regenerate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    regenerate(e.target.value);
  };

  const handleToggle = useCallback((day: number, actIdx: number) => {
    if (!validId) return;
    const updated = toggleActivity(validId, day, actIdx);
    if (updated) dispatch({ type: 'toggled', plan: updated });
  }, [validId]);

  const generateAIPlan = useCallback(async () => {
    if (!validId || !exam || mentorLoading) return;
    setMentorLoading(true);
    setMentorError(null);
    try {
      const domainScores: Record<string, number> = {};
      const domainWeights: Record<string, number> = {};
      for (const d of exam.domains) {
        const domainSessions = sessions.filter(
          (s) => s.skillId === validId && s.finishedAt && s.domainFilter === d.id,
        );
        const correct = domainSessions.reduce((sum, s) => sum + s.score, 0);
        const total = domainSessions.reduce((sum, s) => sum + s.total, 0);
        domainScores[`D${d.id}`] = total > 0 ? Math.round((correct / total) * 100) : 0;
        domainWeights[`D${d.id}`] = d.weight;
      }
      const resp = await callMentorPlan({
        examId: validId,
        examTitle: exam.title ?? exam.shortTitle,
        targetDate,
        domainScores,
        domainWeights,
        request: planRequest || 'Build me a focused study plan highlighting my weak domains',
      });
      const aiPlan = buildAIPlan(validId, exam.domains, resp.sessions, targetDate);
      if (aiPlan) {
        savePlan(aiPlan);
        void syncToGist();
        dispatch({ type: 'ai_generated', plan: aiPlan });
        setCoachNote(resp.coachNote);
      } else {
        setMentorError('Mentor returned an invalid plan — showing auto-generated plan.');
      }
    } catch {
      setMentorError('Mentor is unavailable — showing auto-generated plan.');
    } finally {
      setMentorLoading(false);
    }
  }, [validId, exam, sessions, targetDate, planRequest, mentorLoading, syncToGist]);

  const resetToAuto = useCallback(() => {
    if (!validId || !staticPlan) return;
    savePlan(staticPlan);
    void syncToGist();
    dispatch({ type: 'reset_to_auto' });
    setCoachNote(null);
    setMentorError(null);
  }, [validId, staticPlan, syncToGist]);

  const next = plan ? nextIncompleteSession(plan) : null;
  const compressed = plan ? isPlanCompressed(plan) : false;
  const totalSessions = plan?.sessions.length ?? 0;
  const completedSessions = plan?.sessions.filter((s) => s.completed).length ?? 0;
  const totalMinutes = plan?.sessions.reduce((sum, s) => sum + s.estimatedMinutes, 0) ?? 0;

  const weakDomains = useMemo(
    () => (exam ? getWeakDomains(validId ?? '', exam.domains, sessions) : []),
    [exam, validId, sessions],
  );

  const scrollToDay = useCallback((day: number) => {
    const el = document.getElementById(`session-day-${day}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setViewMode('timeline'); }
  }, []);

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

      {/* Daily card + streak + readiness + iCal row */}
      {exam && (() => {
        const sessions = getSessions();
        const card = getDailyCard(examId ?? '', exam.domains, sessions);
        const streak = getStreak(examId ?? '');
        const readiness = getReadinessScore(examId ?? '', exam.domains, sessions);
        const ACTION_LABEL: Record<string, string> = {
          'read-notes': '📖 Read Notes',
          'take-quiz': '🎯 Take Quiz',
          'retake-quiz': '🔄 Retake Quiz',
          'all-done': '🏆 All Done',
        };
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Daily card */}
            {card && (
              <div className="sm:col-span-2 glass-card glass-edge rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl mt-0.5">{card.action === 'all-done' ? '🏆' : '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Today’s Focus</p>
                  <p className="text-sm font-semibold text-white">D{card.domainId}: {card.domainTitle}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{card.reason}</p>
                </div>
                <Link
                  to={card.link}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 transition-colors"
                >
                  {ACTION_LABEL[card.action] ?? 'Go →'}
                </Link>
              </div>
            )}
            {/* Streak + readiness + iCal */}
            <div className="glass-card rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔥</span>
                  <div>
                    <p className="text-xs font-bold text-amber-400">{streak} day{streak !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-slate-500">Current streak</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-violet-400">{readiness}%</p>
                  <p className="text-[10px] text-slate-500">Readiness</p>
                </div>
              </div>
              {plan && (
                <button
                  onClick={() => exportStudyPlanAsIcal(plan, exam.title)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px] font-semibold hover:bg-slate-700 hover:text-white transition-colors"
                  title="Export study plan to Google/Apple Calendar"
                >
                  <CalendarDays size={12} /> Export to Calendar (.ics)
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Target date + time commitment */}
      <div className="glass-card glass-edge rounded-xl p-4 flex flex-wrap items-center gap-4">
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
        {/* Time commitment chips */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Clock size={12} className="text-slate-500" />
          {([15, 30, 60] as DailyMinutes[]).map((mins) => (
            <button
              key={mins}
              onClick={() => handleDailyMinutesChange(mins)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                dailyMinutes === mins
                  ? 'bg-violet-600 text-white border border-violet-500'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:text-white hover:border-slate-500'
              }`}
              title={`${mins} min/day`}
            >
              {mins}m
            </button>
          ))}
        </div>
        <button
          onClick={() => regenerate(targetDate)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          title="Regenerate plan"
        >
          <RefreshCw size={13} />
          Regenerate
        </button>
      </div>

      {/* Weak domains alert */}
      {weakDomains.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-rose-800/40 bg-rose-950/30">
          <TrendingDown size={15} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-rose-300 mb-1">Weak domains — plan prioritises these</p>
            <div className="flex flex-wrap gap-2">
              {weakDomains.map((d) => (
                <span
                  key={d.domainId}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-900/40 text-rose-300 border border-rose-800/40"
                >
                  D{d.domainId}: {d.title} <span className="font-bold text-rose-400">{d.pct}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Mentor panel */}
      <div className="glass-card glass-edge rounded-xl overflow-hidden border border-violet-800/20">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-violet-950/30 border-b border-violet-800/20">
          <Sparkles size={15} className="text-violet-400 shrink-0" />
          <span className="text-sm font-semibold text-violet-200">AI Study Mentor</span>
          {aiMode && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-900/50 rounded-full px-2 py-0.5">
              AI Plan
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Coach note (after AI plan generated) */}
          {coachNote && (
            <div className="flex items-start gap-2 p-3 bg-violet-950/20 rounded-lg border border-violet-800/20">
              <Sparkles size={13} className="text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-200 leading-relaxed">{coachNote}</p>
            </div>
          )}

          {/* NL input */}
          <div className="relative">
            <textarea
              value={planRequest}
              onChange={(e) => setPlanRequest(e.target.value.substring(0, 500))}
              rows={2}
              placeholder="Tell the mentor what you need... (e.g. focus on weak areas, short sessions)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            {planRequest && (
              <button
                onClick={() => setPlanRequest('')}
                className="absolute top-2 right-2 text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="Clear input"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Chip suggestions */}
          <div className="flex flex-wrap gap-2">
            {CHIP_SUGGESTIONS.map((chip) => (
              <button
                key={chip}
                onClick={() => setPlanRequest(chip)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  planRequest === chip
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-violet-500/50 hover:text-slate-200'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Error */}
          {mentorError && (
            <p className="text-xs text-rose-400">{mentorError}</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={generateAIPlan}
              disabled={mentorLoading}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mentorLoading ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Mentor is building your plan…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate AI Plan
                </>
              )}
            </button>

            {aiMode && (
              <button
                onClick={resetToAuto}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw size={13} />
                Reset to auto-generated
              </button>
            )}
          </div>
        </div>
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
            <p className="text-xs text-slate-500 mt-0.5">{next.activities.length} activities · {next.estimatedMinutes} min
              {quizScoresByDomain[next.domainId]?.attempts > 0 && (
                <span className={`ml-2 font-semibold ${quizScoresByDomain[next.domainId].lastScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  · {quizScoresByDomain[next.domainId].lastScore}% last quiz
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById(`session-day-${next.day}`);
                if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setViewMode('timeline'); }
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg border border-slate-700/60 hover:border-slate-500"
            >
              View plan
            </button>
            {next.activities[0] && (
              <Link
                to={next.activities.find(a => !a.completed)?.link ?? next.activities[0].link}
                className="btn-primary text-sm px-4 py-2"
              >
                Start →
              </Link>
            )}
          </div>
        </div>
      )}

      {completedSessions === totalSessions && totalSessions > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-950/60 border border-emerald-800/50 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 size={15} className="shrink-0" />
          <span><strong>Plan complete!</strong> You've finished all sessions. Ready to sit the exam?</span>
        </div>
      )}

      {/* View toggle + calendar / timeline */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {totalSessions} sessions · {totalMinutes} min total
        </p>
        <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-0.5 border border-slate-800/60">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'timeline' ? 'bg-violet-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutList size={12} /> Timeline
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'calendar' ? 'bg-violet-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={12} /> Calendar
          </button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <PlanCalendar plan={plan} targetDate={targetDate} onDayClick={scrollToDay} />
      )}

      {/* Session cards */}
      <div className="space-y-3">
        {plan.sessions.map((session) => (
          <div key={`${session.day}-${session.domainId}`} id={`session-day-${session.day}`}>
            <SessionCard
              session={session}
              examId={validId}
              onToggle={handleToggle}
              defaultOpen={next?.day === session.day && next?.domainId === session.domainId}
              domainScore={quizScoresByDomain[session.domainId]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
