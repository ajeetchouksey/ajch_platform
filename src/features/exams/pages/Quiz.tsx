import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { loadQuestionsForExam, loadQuestionsByDomainForExam, loadExamRegistry, loadTaskStatementsForExam } from '@/lib/content-loader';
import { saveSession, saveQuizDraft, loadQuizDraft, clearQuizDraft } from '@/lib/storage';
import { addQuizResult, useProgressSync } from '@/lib/useProgressSync';
import { saveAttempt, getAttempts } from '@/lib/adaptive-quiz';
import { getFlagged, toggleFlag, reviewQueueIds } from '@/lib/objective-mastery';
import { addQuestionCard } from '@/lib/flashcards';
import { parseExplanation } from '@/lib/explanation';
import { ChangeList } from '../components/journey/ChangeList';
import { diffSnapshots, newMilestones, snapshot, type Change, type Milestone, type Snapshot } from '@/lib/progress-snapshot';
import { useAuth } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { type Question, type QuestionAttempt, type QuizSession, type QuizDraft, type DomainConfig, type QuizMode, type TaskStatement, type ExamConfig, type TaskStatementsFile } from '@/types/content';
import { CheckCircle, XCircle, ChevronRight, ChevronLeft, RotateCcw, Filter, X, History, LogOut, Flag, Timer, Target, BookOpenCheck, Lightbulb, Flame, Layers, Award } from 'lucide-react';
import QuizShareCard from '@/components/QuizShareCard';
import { AskMentor } from '@/components/AskMentor';
import ComputedRelatedList from '@/components/ComputedRelatedList';
import { useRelationshipsForIds } from '@/lib/useRelationships';

type Phase = 'setup' | 'quiz' | 'review';

type Confidence = NonNullable<QuestionAttempt['confidence']>;
const CONFIDENCE: { id: Confidence; label: string }[] = [
  { id: 'guess', label: 'Guessing' },
  { id: 'unsure', label: 'Unsure' },
  { id: 'sure', label: 'Sure' },
];

/** One line on how the learner's confidence matched the result. */
function calibrationNote(correct: boolean, c: Confidence | undefined): string | null {
  if (!c) return null;
  if (correct) return c === 'sure' ? 'Right, and you knew it.' : c === 'unsure' ? 'Right. Your doubt was unneeded here.' : 'Right, but it was a guess. Read why so it sticks.';
  return c === 'sure' ? 'You were sure, but this is a trap. It is now a flashcard, so it comes back first.' : 'You sensed doubt, which was right. Read the reasons below.';
}

/** Questions in a timed simulation. Real exams in the catalog run roughly
 *  40–60 items; banks smaller than this use every question and a pro-rated clock. */
const TIMED_COUNT = 50;
/** Questions per domain drill (unchanged from before modes existed). */
const DRILL_COUNT = 15;

/** "100 min" → 100. Falls back to 60 so a malformed registry value never yields a 0s clock. */
function parseMinutes(duration: string | undefined): number {
  const m = duration?.match(/(\d+)/);
  return m ? Number(m[1]) : 60;
}

function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function isQuizMode(v: string | null): v is QuizMode {
  return v === 'review' || v === 'timed' || v === 'missed' || v === 'objective';
}

function randomId() {
  return Math.random().toString(36).slice(2);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const { user, login } = useAuth();
  const { syncToGist } = useProgressSync();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [draft, setDraft] = useState<QuizDraft | null>(null);
  const [domainFilter, setDomainFilter] = useState<number | null>(() => {
    // ?d= preselects a domain drill (e.g. the "Practice this domain" link at the end of notes)
    const d = Number(new URLSearchParams(window.location.search).get('d'));
    return Number.isInteger(d) && d > 0 ? d : null;
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);
  // Per-attempt extras (non-timed modes): how sure the learner was, options a hint removed, run of correct answers.
  const [confidence, setConfidence] = useState<Record<string, Confidence>>({});
  const [eliminated, setEliminated] = useState<Record<string, number[]>>({});
  const [streak, setStreak] = useState(0);
  // Before/after progress for this attempt (what it changed, milestones reached).
  const [examCfg, setExamCfg] = useState<ExamConfig | null>(null);
  const [stmts, setStmts] = useState<TaskStatementsFile | null>(null);
  const snapRef = useRef<Snapshot | null>(null);
  const [outcome, setOutcome] = useState<{ changes: Change[]; milestones: Milestone[] } | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [examDomains, setExamDomains] = useState<DomainConfig[]>([]);
  const [passThreshold, setPassThreshold] = useState<number | null>(null);
  const [examShortTitle, setExamShortTitle] = useState('Exam');
  const [examTitle, setExamTitle] = useState('Exam');
  const [examTotalQuestions, setExamTotalQuestions] = useState<number | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  // ── Modes (see QuizMode) — preselected from ?mode= / ?task= links on the exam map
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<QuizMode>(() => {
    if (searchParams.get('task')) return 'objective';
    const m = searchParams.get('mode');
    return isQuizMode(m) ? m : 'review';
  });
  const [tasks, setTasks] = useState<TaskStatement[]>([]);
  const [taskId, setTaskId] = useState<string | null>(() => searchParams.get('task'));
  const [examMinutes, setExamMinutes] = useState(60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set(getFlagged(examId)));
  const [emptyPoolMsg, setEmptyPoolMsg] = useState<string | null>(null);
  const shownAtRef = useRef(0); // set when each question is shown (effect below)
  const isTimed = mode === 'timed';
  const reviewQueueCount = phase === 'setup' ? reviewQueueIds(examId, getAttempts(examId)).length : 0;
  const selectedTask = tasks.find((t) => t.id === taskId) ?? null;
  // question id → the official objective it's mapped to (first match wins)
  const taskByQuestion = new Map<string, TaskStatement>();
  for (const t of tasks) for (const id of t.questionIds) if (!taskByQuestion.has(id)) taskByQuestion.set(id, t);
  const [showAllReview, setShowAllReview] = useState(false);
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  // One-time-per-session nudge dismissal
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    try { return !!sessionStorage.getItem(`nudge_dismissed_${examId}`); }
     
    catch { return false; }
  });

  // relationships.json has no whole-exam key, only one per domain — union
  // across every domain's own edges (see useRelationshipsForIds's own doc).
  const relDocIds = examDomains.map((d) => `exam/${examId}/domain-${d.id}`);
  const computedRelated = useRelationshipsForIds(relDocIds);

  const dismissNudge = useCallback(() => {
    try { sessionStorage.setItem(`nudge_dismissed_${examId}`, '1'); }
     
    catch { /* storage unavailable */ }
    setNudgeDismissed(true);
  }, [examId]);

  // Check for an unfinished attempt to offer resuming — see QuizDraft's doc comment.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(loadQuizDraft(examId));
  }, [examId]);

  // Autosave the active attempt on every question interaction, so closing the
  // tab mid-quiz doesn't silently lose it (see the SkillUp UX assessment).
  // Timed attempts aren't drafted: resuming would either restart or freeze the clock,
  // and neither matches the real exam.
  useEffect(() => {
    if (phase !== 'quiz' || questions.length === 0 || mode === 'timed') return;
    saveQuizDraft(examId, { domainFilter, questions, current, answers, chosen, revealed, savedAt: Date.now() });
  }, [examId, phase, mode, domainFilter, questions, current, answers, chosen, revealed]);

  // Exam clock — ends the attempt when it runs out.
  useEffect(() => {
    if (phase !== 'quiz' || endsAt === null) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= endsAt) setPhase('review');
    }, 1000);
    return () => clearInterval(t);
  }, [phase, endsAt]);

  // Start the per-question timer whenever a new question is shown.
  useEffect(() => { shownAtRef.current = Date.now(); }, [current, phase]);

  const recordAttempt = useCallback((q: Question, chosenIndex: number, conf?: Confidence) => {
    saveAttempt({
      questionId: q.id,
      examId,
      domain: q.domain,
      chosenIndex,
      correct: chosenIndex === q.correct,
      timeSpentMs: Date.now() - shownAtRef.current,
      attemptedAt: Date.now(),
      loop: 1,
      ...(conf ? { confidence: conf } : {}),
    });
  }, [examId]);

  const resetExtras = () => { setConfidence({}); setEliminated({}); setStreak(0); setOutcome(null); snapRef.current = null; };

  // Snapshot progress as an attempt starts, so the results can say what it changed.
  useEffect(() => {
    if (phase === 'quiz' && examCfg && !snapRef.current) snapRef.current = snapshot(examCfg, stmts);
  }, [phase, examCfg, stmts]);

  const handleToggleFlag = useCallback((questionId: string) => {
    const on = toggleFlag(examId, questionId);
    setFlagged((prev) => {
      const next = new Set(prev);
      if (on) next.add(questionId); else next.delete(questionId);
      return next;
    });
  }, [examId]);

  const resumeDraft = useCallback(() => {
    if (!draft) return;
    const newSession: QuizSession = {
      id: randomId(),
      skillId: examId,
      startedAt: Date.now(),
      domainFilter: draft.domainFilter,
      answers: draft.answers,
      score: 0,
      total: draft.questions.length,
      ...(user?.login ? { userId: user.login } : {}),
    };
    setQuestions(draft.questions);
    setCurrent(draft.current);
    setChosen(draft.chosen);
    setAnswers(draft.answers);
    setRevealed(draft.revealed);
    resetExtras();
    setDomainFilter(draft.domainFilter);
    // Drafts are never timed (see autosave), so a resumed attempt is always review-style.
    setMode('review');
    setEndsAt(null);
    setSession({ ...newSession, mode: 'review' });
    setPhase('quiz');
  }, [draft, examId, user]);

  const discardDraft = useCallback(() => {
    clearQuizDraft(examId);
    setDraft(null);
  }, [examId]);

  const exitToSetup = useCallback(() => {
    setPhase('setup');
    setDraft(loadQuizDraft(examId));
  }, [examId]);

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (exam) {
        // Skill Tracks (IDEA-0016) have no domains/passThreshold/questions —
        // any retained legacy bank lives under practiceBank instead. This
        // page still serves that bank (Practice Bank card links here), so
        // degrade to "no domain filter, no pass framing" rather than crash.
        const isSkillTrack = exam.kind === 'skill-track';
        setExamDomains(isSkillTrack ? [] : exam.domains);
        setPassThreshold(isSkillTrack ? null : exam.passThreshold);
        setExamShortTitle(exam.shortTitle);
        setExamTitle(exam.title);
        setExamTotalQuestions(isSkillTrack ? (exam.practiceBank?.questions ?? null) : exam.questions);
        setExamMinutes(parseMinutes(exam.duration));
        setExamCfg(isSkillTrack ? null : exam);
      }
    }).catch(() => {});
    loadTaskStatementsForExam(examId)
      .then((ts) => { setStmts(ts); setTasks(ts ? ts.domains.flatMap((d) => d.tasks).filter((t) => t.questionIds.length > 0) : []); })
      .catch(() => setTasks([]));
  }, [examId]);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    setEmptyPoolMsg(null);
    // Domain filter only applies to review mode; the others pick their own pool.
    const filter = mode === 'review' ? domainFilter : null;
    const qs = filter
      ? await loadQuestionsByDomainForExam(examId, filter)
      : await loadQuestionsForExam(examId);
    let picked: Question[];
    if (mode === 'timed') {
      picked = shuffle(qs).slice(0, TIMED_COUNT);
    } else if (mode === 'missed') {
      const ids = new Set(reviewQueueIds(examId, getAttempts(examId)));
      picked = shuffle(qs.filter((q) => ids.has(q.id)));
    } else if (mode === 'objective') {
      const ids = new Set(selectedTask?.questionIds ?? []);
      picked = shuffle(qs.filter((q) => ids.has(q.id)));
    } else {
      picked = shuffle(qs).slice(0, filter ? DRILL_COUNT : qs.length);
    }
    if (picked.length === 0) {
      setEmptyPoolMsg(mode === 'missed'
        ? 'Nothing to review yet — questions you get wrong or flag will collect here.'
        : 'Pick an objective to drill.');
      setLoading(false);
      return;
    }
    // Pro-rate the clock when the bank is smaller than a full simulation.
    setEndsAt(mode === 'timed'
      ? Date.now() + examMinutes * 60_000 * (picked.length / TIMED_COUNT)
      : null);
    setNow(Date.now());
    const newSession: QuizSession = {
      id: randomId(),
      skillId: examId,  // RC-4: scope session to this skill
      startedAt: Date.now(),
      domainFilter: filter,
      answers: {},
      score: 0,
      total: picked.length,
      mode,
      ...(user?.login ? { userId: user.login } : {}),
    };
    setQuestions(picked);
    setCurrent(0);
    setChosen(null);
    setAnswers({});
    setRevealed(false);
    resetExtras();
    setSession(newSession);
    setPhase('quiz');
    setLoading(false);
    trackEvent('quiz_start', { exam_id: examId, domain: filter ?? 'all', mode });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainFilter, mode, selectedTask, examMinutes]);

  useEffect(() => {
    if (phase === 'review' && session) {
      // Timed answers stay hidden until the end, so they're recorded here
      // (once, final answer) rather than on reveal like the other modes.
      if (session.mode === 'timed') {
        for (const q of questions) if (answers[q.id] !== undefined) recordAttempt(q, answers[q.id]);
      }
      const score = questions.filter((q) => answers[q.id] === q.correct).length;
      const finished: QuizSession = { ...session, finishedAt: Date.now(), answers, score };
      saveSession(finished);
      // Keep ccaf_progress in sync for Gist cloud backup
      addQuizResult(examId, String(finished.domainFilter ?? 'all'), finished.score, finished.total);
      void syncToGist(); // push to GitHub Gist if logged in (fire-and-forget)
      trackEvent('quiz_complete', { exam_id: examId, score: finished.score, total: finished.total, pct: Math.round((finished.score / finished.total) * 100) });
      clearQuizDraft(examId); // attempt is finished — the draft's job is done
      if (examCfg && snapRef.current) {
        const after = snapshot(examCfg, stmts);
        setOutcome({ changes: diffSnapshots(snapRef.current, after), milestones: newMilestones(examCfg, after) });
        snapRef.current = null;
      }
      setSession(finished);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to feedback when answer is revealed
  useEffect(() => {
    if (revealed && feedbackRef.current) {
      const main = feedbackRef.current.closest('main') as HTMLElement | null;
      if (main) {
        const rect = feedbackRef.current.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();
        const offset = rect.top - mainRect.top - 24; // 24px breathing room above feedback
        main.scrollBy({ top: offset, behavior: 'smooth' });
      }
    }
  }, [revealed]);

  function handleChoose(idx: number) {
    if (revealed || eliminated[questions[current]?.id]?.includes(idx)) return;
    setChosen(idx);
    // Timed: the choice *is* the answer (changeable until the clock or Finish).
    if (isTimed) setAnswers((prev) => ({ ...prev, [questions[current].id]: idx }));
  }

  function handleReveal() {
    if (chosen === null) return;
    setRevealed(true);
    if (session) {
      const q = questions[current];
      const conf = confidence[q.id];
      const right = chosen === q.correct;
      setAnswers((prev) => ({ ...prev, [q.id]: chosen }));
      recordAttempt(q, chosen, conf);
      setStreak((s) => (right ? s + 1 : 0));
      // Confidently wrong is the most useful thing to revisit — make it a flashcard.
      if (!right && conf === 'sure') addQuestionCard(examId, q);
    }
  }

  /** 50/50: strike out two wrong options. Counts the answer as unsure unless the learner already said. */
  function applyHint() {
    const q = questions[current];
    if (!q || revealed || eliminated[q.id]) return;
    const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correct && i !== chosen);
    const out = wrong.sort(() => Math.random() - 0.5).slice(0, Math.max(0, Math.min(2, q.options.length - 2)));
    setEliminated((m) => ({ ...m, [q.id]: out }));
    setConfidence((m) => (m[q.id] ? m : { ...m, [q.id]: 'unsure' }));
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setPhase('review');
    } else {
      const nextAns = answers[questions[current + 1].id];
      setCurrent((c) => c + 1);
      // Timed: moving back and forth must keep earlier answers selected.
      setChosen(isTimed && nextAns !== undefined ? nextAns : null);
      setRevealed(false);
    }
  }

  function handleBack() {
    if (current <= 0) return;
    const prevQ = questions[current - 1];
    const prevChosen = answers[prevQ.id];
    setCurrent((c) => c - 1);
    setChosen(prevChosen !== undefined ? prevChosen : null);
    setRevealed(!isTimed && prevChosen !== undefined);
  }

  // Keyboard: A–F / 1–6 choose, Enter checks (or moves on). Latest handler is
  // kept in a ref so the single window listener never sees stale state.
  useEffect(() => {
    keyHandlerRef.current = (e: KeyboardEvent) => {
      if (phase !== 'quiz' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const q = questions[current];
      if (!q) return;
      const k = e.key.toLowerCase();
      const idx = /^[1-6]$/.test(k) ? Number(k) - 1 : /^[a-f]$/.test(k) ? k.charCodeAt(0) - 97 : -1;
      if (idx >= 0 && idx < q.options.length) { e.preventDefault(); handleChoose(idx); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isTimed || revealed) handleNext();
        else if (chosen !== null) handleReveal();
      }
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** Restart with just the questions answered wrong in this attempt. */
  function retryWrong() {
    const wrong = questions.filter((q) => answers[q.id] !== q.correct);
    if (!wrong.length) return;
    setMode('review');
    setEndsAt(null);
    setQuestions(shuffle(wrong));
    setCurrent(0);
    setChosen(null);
    setAnswers({});
    setRevealed(false);
    resetExtras();
    setShowAllReview(false);
    setSession({
      id: randomId(), skillId: examId, startedAt: Date.now(), domainFilter: null,
      answers: {}, score: 0, total: wrong.length, mode: 'missed',
      ...(user?.login ? { userId: user.login } : {}),
    });
    setPhase('quiz');
  }

  function handleJump(idx: number) {
    if (idx < 0 || idx >= questions.length || idx === current) return;
    const targetQ = questions[idx];
    const targetChosen = answers[targetQ.id];
    setCurrent(idx);
    setChosen(targetChosen !== undefined ? targetChosen : null);
    setRevealed(!isTimed && targetChosen !== undefined);
    setShowPalette(false);
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <p className="page-eyebrow">{examShortTitle} Exam</p>
        <h1 className="text-2xl font-bold tracking-tight">Practice <span className="heading-gradient">Quiz</span></h1>

        {/* Mode picker — same question bank, different ways to use it */}
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Practice mode">
          {([
            { id: 'review', icon: BookOpenCheck, title: 'Review', desc: 'Answers and reasons as you go' },
            { id: 'timed', icon: Timer, title: 'Timed exam', desc: `${TIMED_COUNT} questions · ${examMinutes} min · results at the end` },
            { id: 'missed', icon: Flag, title: 'Missed & flagged', desc: reviewQueueCount ? `${reviewQueueCount} to review` : 'Wrong answers and flags collect here' },
            { id: 'objective', icon: Target, title: 'Objective drill', desc: tasks.length ? 'One official exam objective' : 'Not available for this exam' },
          ] as const).map(({ id, icon: Icon, title, desc }) => {
            const disabled = id === 'objective' && tasks.length === 0;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={mode === id}
                disabled={disabled}
                onClick={() => { setMode(id); setEmptyPoolMsg(null); }}
                className={`text-left p-3 rounded-xl border transition-colors disabled:opacity-40 ${
                  mode === id
                    ? 'border-brand-lilac/70 bg-brand-indigo/20 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Icon size={15} className={mode === id ? 'text-brand-lilac' : 'text-slate-500'} />
                <p className="text-sm font-semibold mt-1.5">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
              </button>
            );
          })}
        </div>

        {/* Exam meta strip */}
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span><span className="text-slate-300 font-semibold">{
            mode === 'timed' ? Math.min(TIMED_COUNT, examTotalQuestions ?? TIMED_COUNT)
              : mode === 'missed' ? reviewQueueCount
                : mode === 'objective' ? (selectedTask?.questionIds.length ?? '—')
                  : domainFilter === null ? (examTotalQuestions ?? '—') : DRILL_COUNT
          }</span> questions</span>
          {passThreshold !== null && (
            <span><span className="text-slate-300 font-semibold">{passThreshold}%</span> to pass</span>
          )}
          <span>Scenario-based MCQ</span>
        </div>

        {emptyPoolMsg && (
          <p className="text-sm text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">{emptyPoolMsg}</p>
        )}

        {/* Objective picker */}
        {mode === 'objective' && tasks.length > 0 && (
          <div className="glass-card rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Target size={14} />
              <span>Official exam objective</span>
            </div>
            <select
              value={taskId ?? ''}
              onChange={(e) => { setTaskId(e.target.value || null); setEmptyPoolMsg(null); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200"
            >
              <option value="">Choose an objective…</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.id} · {t.title} ({t.questionIds.length})</option>
              ))}
            </select>
          </div>
        )}

        {/* Unfinished attempt — see QuizDraft's doc comment for why this exists */}
        {draft && (
          <div className="rounded-xl border border-violet-700/50 bg-violet-900/20 p-4 flex items-start gap-3">
            <History size={16} className="text-violet-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Unfinished attempt</p>
              <p className="text-xs text-slate-400">
                Question {draft.current + 1} of {draft.questions.length} · saved {new Date(draft.savedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={resumeDraft}
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Resume
            </button>
            <button
              onClick={discardDraft}
              className="shrink-0 text-slate-500 hover:text-white transition-colors mt-1.5"
              aria-label="Discard unfinished attempt"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {mode === 'review' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Filter size={14} />
            <span>Filter by domain (optional)</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => { setDomainFilter(null); ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }}
              className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                domainFilter === null
                  ? 'border-violet-500 bg-violet-900/30 text-white'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="font-semibold">All Domains</span> — {examTotalQuestions ?? 'all'} questions, full mock exam
            </button>
            {examDomains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => { setDomainFilter(domain.id); ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  domainFilter === domain.id
                    ? 'border-violet-500 bg-violet-900/30 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="font-semibold">D{domain.id}</span> · {domain.title}{' '}
                <span className="text-slate-500">({domain.weight}%)</span>
              </button>
            ))}
          </div>
        </div>
        )}

        <button
          ref={ctaRef}
          onClick={startQuiz}
          disabled={loading || (mode === 'objective' && !selectedTask)}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Loading…' : mode === 'timed' ? 'Start timed exam →' : 'Start Quiz →'}
        </button>
      </div>
    );
  }

  // ── REVIEW ─────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const score = questions.filter((q) => answers[q.id] === q.correct).length;
    const pct = Math.round((score / questions.length) * 100);
    const passed = passThreshold !== null ? pct >= passThreshold : null;

    return (
      <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0 max-w-lg space-y-6">
        <p className="page-eyebrow">{examShortTitle} Exam</p>
        <h1 className="text-2xl font-bold tracking-tight">Session <span className="heading-gradient">Complete</span></h1>
        {session?.mode && session.mode !== 'review' && (
          <p className="text-xs text-slate-500 -mt-4">
            {session.mode === 'timed'
              ? `Timed exam · ${Object.keys(answers).length} of ${questions.length} answered`
              : session.mode === 'missed' ? 'Missed & flagged review'
                : `Objective drill${selectedTask ? ` · ${selectedTask.id} ${selectedTask.title}` : ''}`}
          </p>
        )}

        {/* Score card */}
        <div
          className={`rounded-xl p-6 text-center border ${
            passed === null ? 'border-slate-700 bg-slate-900/20' : passed ? 'border-emerald-600 bg-emerald-900/20' : 'border-rose-600 bg-rose-900/20'
          }`}
        >
          <div className="text-5xl font-bold mb-2" style={{ color: passed === null ? '#e2e8f0' : passed ? '#34d399' : '#f87171' }}>
            {pct}%
          </div>
          <p className="text-slate-300 text-sm">
            {score} / {questions.length} correct
          </p>
          {passThreshold !== null && (
            <p className={`text-sm font-semibold mt-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passed ? `✓ Above ${passThreshold}% pass threshold` : `✗ Below ${passThreshold}% pass threshold`}
            </p>
          )}
        </div>

        {/* What this attempt changed + milestones reached */}
        {outcome && (outcome.changes.length > 0 || outcome.milestones.length > 0) && (
          <div className="space-y-3">
            {outcome.milestones.map((m, k) => (
              <div key={m.id} role="status" className="anim-pop flex items-start gap-3 rounded-2xl p-4 border border-amber-300/40 bg-amber-400/10" style={{ animationDelay: `${150 + k * 150}ms` }}>
                <Award size={20} className="text-amber-300 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold text-amber-100">Milestone: {m.title}</p>
                  <p className="text-sm text-amber-100/80">{m.detail}</p>
                </div>
              </div>
            ))}
            {outcome.changes.length > 0 && (
              <div className="glass-card rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">What this attempt changed</h3>
                <ChangeList changes={outcome.changes} />
              </div>
            )}
          </div>
        )}

        {/* Share card + email capture */}
        <QuizShareCard
          score={score}
          total={questions.length}
          pct={pct}
          examShortTitle={examShortTitle}
          examId={examId}
          passed={passed}
        />

        {/* Domain breakdown */}
        {passThreshold !== null && examDomains.length > 1 && (() => {
          const breakdown = examDomains
            .map((d) => {
              const dqs = questions.filter((q) => q.domain === d.id);
              if (dqs.length === 0) return null;
              const correct = dqs.filter((q) => answers[q.id] === q.correct).length;
              return { id: d.id, title: d.title, correct, total: dqs.length, pct: Math.round((correct / dqs.length) * 100) };
            })
            .filter(Boolean);
          if (breakdown.length < 2) return null;
          return (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide">By Domain</h3>
              {breakdown.map((d) => d && (
                <div key={d.id}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>D{d.id}: {d.title}</span>
                    <span className={`font-mono font-semibold ${d.pct >= passThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {d.correct}/{d.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${d.pct >= passThreshold ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Calibration — how the learner's confidence matched their results */}
        {Object.keys(confidence).length > 0 && (() => {
          const rows = CONFIDENCE.map((c) => {
            const qs = questions.filter((q) => confidence[q.id] === c.id && answers[q.id] !== undefined);
            return { ...c, total: qs.length, right: qs.filter((q) => answers[q.id] === q.correct).length };
          }).filter((r) => r.total > 0);
          const sureWrong = questions.filter((q) => confidence[q.id] === 'sure' && answers[q.id] !== undefined && answers[q.id] !== q.correct).length;
          return (
            <div className="glass-card rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wide">How well you judged yourself</h3>
              {rows.map((r) => (
                <div key={r.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-300">When you said “{r.label.toLowerCase()}”</span>
                  <span className="font-mono text-slate-100">{r.right} of {r.total} right</span>
                </div>
              ))}
              {sureWrong > 0 && (
                <p className="text-xs text-amber-200 pt-1 flex items-start gap-1.5">
                  <Layers size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    You were sure and wrong {sureWrong === 1 ? 'once' : `${sureWrong} times`}. {sureWrong === 1 ? 'That question is' : 'Those questions are'} now flashcards, so they come back first.{' '}
                    <Link to={`/skillup/${examId}/flashcards`} className="font-semibold text-brand-lilac hover:text-white">Review flashcards</Link>
                  </span>
                </p>
              )}
            </div>
          );
        })()}

        {/* Study with AI handoff — focused on weak domains from this attempt */}
        {passThreshold !== null && examDomains.length > 0 && (() => {
          const weak = examDomains
            .map((d) => {
              const dqs = questions.filter((q) => q.domain === d.id);
              if (dqs.length === 0) return null;
              const correct = dqs.filter((q) => answers[q.id] === q.correct).length;
              const pct = Math.round((correct / dqs.length) * 100);
              return pct < passThreshold ? { title: d.title, pct } : null;
            })
            .filter((d): d is { title: string; pct: number } => d !== null);
          return (
            <AskMentor
              variant="row"
              context={{ source: 'quiz-review', examId, examTitle, weakDomains: weak.length > 0 ? weak : undefined }}
            />
          );
        })()}

        {/* Answer review — wrong answers first; the full list is one click away */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide">
            {score === questions.length ? 'All correct' : showAllReview ? `All ${questions.length} questions` : `${questions.length - score} to review`}
          </h3>
          <div className="flex items-center gap-2">
            {score < questions.length && (
              <button
                onClick={() => setShowAllReview((v) => !v)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {showAllReview ? 'Show incorrect only' : 'Show all'}
              </button>
            )}
            {score < questions.length && (
              <button
                onClick={retryWrong}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-indigo hover:bg-brand-indigo-deep text-white transition-colors"
              >
                <RotateCcw size={12} /> Retry the {questions.length - score} I missed
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const correct = userAns === q.correct;
            if (correct && !showAllReview && score < questions.length) return null;
            return (
              <div
                key={q.id}
                className={`bg-slate-900 border rounded-xl p-4 text-sm ${
                  correct ? 'border-emerald-800' : 'border-rose-800'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {correct ? (
                    <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                  )}
                  <span className="text-slate-300">
                    Q{i + 1}: {q.question}
                    {taskByQuestion.get(q.id) && (
                      <span className="block text-[11px] text-slate-500 mt-1">Objective {taskByQuestion.get(q.id)!.id} · {taskByQuestion.get(q.id)!.title}</span>
                    )}
                  </span>
                </div>
                {!correct && (
                  <div className="ml-6 space-y-1">
                    <p className="text-rose-400 text-xs">
                      Your answer: {userAns !== undefined ? q.options[userAns] : 'skipped'}
                    </p>
                    <p className="text-emerald-400 text-xs">Correct: {q.options[q.correct]}</p>
                    <p className="text-slate-500 text-xs mt-1">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {user ? (
          /* Logged-in: confirm score was synced to GitHub */
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-3 flex items-center gap-2.5">
            <CheckCircle size={15} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-300">Score saved to your GitHub account</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Progress is synced — check <span className="text-slate-400">Your Readiness</span> on the overview page.</p>
            </div>
          </div>
        ) : !nudgeDismissed && (
          /* Guest: nudge to sign in */
          <div className="rounded-xl border border-violet-700/50 bg-violet-900/20 p-4 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-0.5">Score saved locally</p>
              <p className="text-xs text-slate-400">Sign in with GitHub to keep it across devices.</p>
            </div>
            <button
              onClick={() => { void login(); }}
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={dismissNudge}
              className="shrink-0 text-slate-500 hover:text-white transition-colors mt-0.5"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <button
          onClick={() => setPhase('setup')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <RotateCcw size={15} /> Try Again
        </button>
      </div>

      {/* ── Sidebar — related content across verticals ────────────────────── */}
      <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 lg:sticky lg:top-4 self-start space-y-6">
        <ComputedRelatedList edges={computedRelated} />
      </aside>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  const q = questions[current];
  const isCorrect = chosen === q.correct;
  const parsedExpl = parseExplanation(q.explanation, q.options.length, q.correct);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {!isTimed && streak >= 2 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-200 font-semibold" aria-live="polite">
                <Flame size={12} aria-hidden="true" /> {streak} in a row
              </span>
            )}
            {endsAt !== null && (
              <span
                className={`flex items-center gap-1 font-mono font-semibold ${endsAt - now < 5 * 60_000 ? 'text-amber-400' : 'text-slate-300'}`}
                aria-live="off"
                title="Time remaining"
              >
                <Timer size={12} /> {formatClock(endsAt - now)}
              </span>
            )}
            <span>D{q.domain} · {examDomains.find(d => d.id === q.domain)?.title ?? `Domain ${q.domain}`}</span>
            <button
              onClick={() => handleToggleFlag(q.id)}
              aria-pressed={flagged.has(q.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${flagged.has(q.id) ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}
              title="Flag for the Missed & flagged review"
            >
              <Flag size={11} fill={flagged.has(q.id) ? 'currentColor' : 'none'} /> {flagged.has(q.id) ? 'Flagged' : 'Flag'}
            </button>
            <button
              onClick={() => setShowPalette((v) => !v)}
              className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
            >
              {showPalette ? 'Hide' : 'Jump to question'}
            </button>
            <button
              onClick={exitToSetup}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
              title="Progress is saved — resume anytime from here"
            >
              <LogOut size={11} /> Exit
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Which official objective this question tests */}
      {taskByQuestion.get(q.id) && (
        <p className="-mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
          <Target size={11} className="text-brand-lilac" />
          Objective {taskByQuestion.get(q.id)!.id} · {taskByQuestion.get(q.id)!.title}
        </p>
      )}

      {/* Question palette */}
      {showPalette && (
        <div className="glass-card rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
            <span>Click a number to jump</span>
            {isTimed ? (
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-violet-900" /> answered</span>
            ) : (
              <>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-700" /> correct</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-rose-800" /> wrong</span>
              </>
            )}
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-slate-700" /> unanswered</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((pq, idx) => {
              const ans = answers[pq.id];
              const isAnswered = ans !== undefined;
              const isCorrectAns = isAnswered && ans === pq.correct;
              const isCurrent = idx === current;
              let cls = 'w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-colors ';
              if (isCurrent)
                cls += 'ring-2 ring-violet-400 bg-violet-700 text-white';
              else if (!isAnswered)
                cls += 'bg-slate-700 text-slate-400 hover:bg-slate-600';
              else if (isTimed)
                cls += 'bg-violet-900 text-violet-200 hover:bg-violet-800';
              else if (isCorrectAns)
                cls += 'bg-emerald-800/70 text-emerald-300 hover:bg-emerald-700/70';
              else
                cls += 'bg-rose-900/60 text-rose-300 hover:bg-rose-800/60';
              return (
                <button key={pq.id} onClick={() => handleJump(idx)} className={cls}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scenario */}
      {q.scenario && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300">
          <span className="text-slate-500 font-semibold uppercase text-xs tracking-wide block mb-1">
            Scenario
          </span>
          {q.scenario}
        </div>
      )}

      {/* Question */}
      <div className="text-white font-medium text-base">{q.question}</div>

      {/* Options */}
      <div className="space-y-2" ref={feedbackRef}>
        {q.options.map((opt, idx) => {
          const isCorrectOpt = idx === q.correct;
          const isChosenOpt = chosen === idx;
          const optReason = parsedExpl.optionReasons[idx];
          const isOut = !revealed && (eliminated[q.id]?.includes(idx) ?? false);

          let btnCls =
            'w-full text-left px-4 py-3 min-h-11 rounded-xl border text-sm transition-colors ';
          if (isOut) {
            btnCls += 'border-slate-800 text-slate-600 line-through cursor-not-allowed';
          } else if (!revealed) {
            btnCls +=
              isChosenOpt
                ? 'border-violet-500 bg-violet-900/30 text-white'
                : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800';
          } else {
            if (isCorrectOpt)
              btnCls += 'border-emerald-500 bg-emerald-900/20 text-emerald-300';
            else if (isChosenOpt && !isCorrect)
              btnCls += 'border-rose-500 bg-rose-900/20 text-rose-300';
            else
              btnCls += 'border-slate-800 text-slate-500';
          }

          return (
            <div key={idx}>
              <button
                onClick={() => handleChoose(idx)}
                disabled={revealed || isOut}
                aria-pressed={!revealed ? isChosenOpt : undefined}
                aria-label={isOut ? `${String.fromCharCode(65 + idx)}. ${opt} (ruled out by hint)` : undefined}
                className={btnCls}
              >
                <span className="font-mono text-xs mr-2 opacity-60">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
                {revealed && isCorrectOpt && (
                  <CheckCircle size={13} className="inline ml-2 text-emerald-400" />
                )}
                {revealed && !isCorrectOpt && isChosenOpt && (
                  <XCircle size={13} className="inline ml-2 text-rose-400" />
                )}
              </button>

              {/* Per-option reason — shown after reveal */}
              {revealed && optReason && (
                <div
                  className={`mt-1 ml-1 mr-1 px-3 py-2 rounded-b-lg text-xs leading-relaxed ${
                    isCorrectOpt
                      ? 'bg-emerald-950/60 border border-t-0 border-emerald-800/40 text-emerald-200'
                      : isChosenOpt
                        ? 'bg-rose-950/60 border border-t-0 border-rose-800/40 text-rose-200'
                        : 'bg-slate-800/40 border border-t-0 border-slate-700/40 text-slate-400'
                  }`}
                >
                  <span className={`font-semibold mr-1 ${
                    isCorrectOpt ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isCorrectOpt ? '✓ Why correct:' : '✗ Why incorrect:'}
                  </span>
                  {optReason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confidence + hint — before checking, non-timed modes only */}
      {!isTimed && !revealed && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-slate-400">How sure are you?</span>
          <div role="group" aria-label="Confidence" className="inline-flex p-1 rounded-xl bg-slate-800/70 border border-slate-600/30">
            {CONFIDENCE.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={confidence[q.id] === c.id}
                onClick={() => setConfidence((m) => ({ ...m, [q.id]: c.id }))}
                className={`min-h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  confidence[q.id] === c.id ? 'bg-brand-indigo text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {q.options.length > 2 && (
            <button
              type="button"
              onClick={applyHint}
              disabled={!!eliminated[q.id]}
              className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg border border-slate-600/40 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-lilac/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lightbulb size={13} aria-hidden="true" /> {eliminated[q.id] ? 'Two options ruled out' : 'Hint: rule out two'}
            </button>
          )}
        </div>
      )}

      {/* Summary banner + tags after reveal */}
      {revealed && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border flex flex-wrap items-center justify-between gap-3 ${
            isCorrect ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-rose-700/50 bg-rose-900/10'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              {isCorrect ? (
                <CheckCircle size={15} className="text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={15} className="text-rose-400 shrink-0" />
              )}
              <span className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                {isCorrect ? 'Correct!' : `Incorrect — correct answer: ${String.fromCharCode(65 + q.correct)}`}
              </span>
            </div>
            {calibrationNote(isCorrect, confidence[q.id]) && (
              <p className="text-xs text-slate-300 mt-1">{calibrationNote(isCorrect, confidence[q.id])}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {q.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {current > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <ChevronLeft size={15} />
            Back
          </button>
        )}
        {isTimed && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {current + 1 >= questions.length ? 'Finish exam' : chosen === null ? 'Skip' : 'Next'}
            <ChevronRight size={15} />
          </button>
        )}
        {!isTimed && !revealed && (
          <button
            disabled={chosen === null}
            onClick={handleReveal}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            Check Answer
          </button>
        )}
        {revealed && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {current + 1 >= questions.length ? 'See Results' : 'Next'}
            <ChevronRight size={15} />
          </button>
        )}
        <span className="hidden sm:flex items-center ml-auto text-[11px] text-slate-600">
          <kbd className="font-mono px-1 rounded bg-slate-800 text-slate-400 mr-1">A–{String.fromCharCode(64 + q.options.length)}</kbd> choose
          <kbd className="font-mono px-1 rounded bg-slate-800 text-slate-400 mx-1">Enter</kbd> {isTimed ? 'next' : revealed ? 'next' : 'check'}
        </span>
      </div>
    </div>
  );
}
