import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Brain, BookOpen, Layers, BarChart2, ExternalLink, ArrowRight, GraduationCap, Lock, Zap, FlaskConical, CalendarDays, Clock, X, MessageSquare, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import GiscusComments from '@/components/GiscusComments';
import { LightComments } from '@/components/LightComments';
import { ContentFeedback } from '@/components/ContentFeedback';
import { loadExamRegistry, loadTaskStatementsForExam } from '@/lib/content-loader';
import { useAuth } from '@/lib/auth';
import { getSessions } from '@/lib/storage';
import { getAttempts } from '@/lib/adaptive-quiz';
import { examMastery } from '@/lib/objective-mastery';
import { ExamMap, PrepPath } from '../components/ExamMap';
import { loadPlan, nextIncompleteSession } from '@/lib/plan-generator';
import { getStreak, getDomainCompletion, getReadinessBreakdown } from '@/lib/study-tracker';
import type { ReadinessBreakdown } from '@/lib/study-tracker';
import ComputedRelatedList from '@/components/ComputedRelatedList';
import { useRelationshipsForIds } from '@/lib/useRelationships';
import PageViewsBadge from '@/components/PageViewsBadge';
import type { ExamConfig, DomainConfig, QuizSession, ContentType, TaskStatementsFile } from '@/types/content';
import { recordExamVisit } from '@/lib/exam-stats';
import SkillTrackHome from './SkillTrackHome';

// ── Readiness helpers ─────────────────────────────────────────────────────────

type DomainStatus = 'strong' | 'progress' | 'new';

interface DomainReadiness { pct: number; total: number; status: DomainStatus }

function computeDomainQuizStatus(
  sessions: QuizSession[],
  examId: string,
  domains: DomainConfig[],
): {
  byDomain: Record<number, DomainReadiness>;
  domainsStarted: number;
} {
  const scores: Record<number, { correct: number; total: number }> = {};
  for (const d of domains) scores[d.id] = { correct: 0, total: 0 };
  for (const s of sessions) {
    if (!s.finishedAt || s.skillId !== examId || s.domainFilter === null) continue;
    const sc = scores[s.domainFilter];
    if (sc) { sc.correct += s.score; sc.total += s.total; }
  }
  let domainsStarted = 0;
  const byDomain: Record<number, DomainReadiness> = {};
  for (const d of domains) {
    const sc = scores[d.id];
    const pct = sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0;
    const status: DomainStatus = pct >= 70 ? 'strong' : sc.total > 0 ? 'progress' : 'new';
    if (sc.total > 0) domainsStarted++;
    byDomain[d.id] = { pct, total: sc.total, status };
  }
  return { byDomain, domainsStarted };
}

const STATUS_CHIP: Record<DomainStatus, string> = {
  strong:   'bg-emerald-950 text-emerald-400 border border-emerald-800',
  progress: 'bg-amber-950  text-amber-400  border border-amber-800',
  new:      'bg-slate-800  text-slate-500  border border-slate-700',
};
const STATUS_LABEL: Record<DomainStatus, string> = {
  strong: 'Strong', progress: 'In progress', new: 'Not started',
};

// ── Today's Task widget ────────────────────────────────────────────────────────

function TodaysTask({ examId, mounted }: { examId: string; mounted: boolean }) {
  const plan = useMemo(() => loadPlan(examId), [examId]);
  const next = plan ? nextIncompleteSession(plan) : null;

  return (
    <div
      className={`glass-card glass-edge rounded-xl p-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: '520ms' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={14} className="text-violet-400" />
        <h2 className="section-heading">Today's Task</h2>
      </div>

      {!plan ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">No study plan yet. Generate one to get a personalised daily schedule.</p>
          <Link
            to={`/skillup/${examId}/plan`}
            className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            Create plan <ArrowRight size={13} />
          </Link>
        </div>
      ) : !next ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-emerald-400 font-medium">All sessions complete — you're ready! 🎉</p>
          <Link
            to={`/skillup/${examId}/plan`}
            className="inline-flex items-center gap-1.5 shrink-0 text-sm text-slate-400 hover:text-white transition-colors"
          >
            View plan <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Day {next.day} · {next.domainTitle}</p>
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Clock size={12} className="text-slate-500" />
              {next.estimatedMinutes} min · {next.activities.length} activities
            </p>
          </div>
          <Link
            to={`/skillup/${examId}/plan`}
            className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
          >
            Continue plan <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Content-type → card definition ───────────────────────────────────────────

type CardDef = { to: string; icon: React.ElementType; title: string; desc: string; cta: string };

const CONTENT_CARD: Record<ContentType, (examId: string) => CardDef> = {
  mcq: (id) => ({
    to: `/skillup/${id}/quiz`,
    icon: Brain,
    title: 'Practice Quiz',
    desc: 'Mock exams or domain-focused drills — same scenario-based MCQ format as the real exam.',
    cta: 'Start Quiz',
  }),
  notes: (id) => ({
    to: `/skillup/${id}/notes`,
    icon: BookOpen,
    title: 'Study Notes',
    desc: 'Structured reference notes for all exam domains. Key rules, mental models, and exam traps.',
    cta: 'Open Notes',
  }),
  scenario: (id) => ({
    to: `/skillup/${id}/scenarios`,
    icon: Layers,
    title: 'Scenario Practice',
    desc: 'Walk through exam scenarios: architecture patterns, decision points, and anti-patterns.',
    cta: 'Browse Scenarios',
  }),
  flashcard: (/* _id */) => ({
    to: '#',
    icon: Zap,
    title: 'Flashcards',
    desc: 'Rapid-fire concept cards for exam-day review.',
    cta: 'Coming soon',
  }),
  lab: (examId: string) => ({
    to: `/hol-labs?exam=${examId}`,
    icon: FlaskConical,
    title: 'Hands-on Lab',
    desc: 'Guided walkthroughs to practice real-world configurations.',
    cta: 'Browse Labs',
  }),
};

function buildContentCards(exam: ExamConfig, examId: string): CardDef[] {
  // Fall back to the original 3 content types when the field is absent.
  const types: ContentType[] = exam.contentTypes?.length
    ? exam.contentTypes
    : ['mcq', 'notes', 'scenario'];
  const cards: CardDef[] = types
    .filter((t) => t !== 'flashcard') // skip unavailable future types
    .map((t) => CONTENT_CARD[t](examId));
  cards.push({
    to: `/skillup/${examId}/progress`,
    icon: BarChart2,
    title: 'Progress',
    desc: 'Track your scores by domain, spot weak areas, and see improvement over time.',
    cta: 'View Progress',
  });
  return cards;
}

export default function ExamHome() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [prereqExams, setPrereqExams] = useState<ExamConfig[]>([]);
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading, login } = useAuth();
  const sessions = useMemo(() => getSessions(), []);
  // Skill Track (IDEA-0016) entries have no domains[] — this readiness/quiz
  // machinery is exam-only; SkillTrackHome renders instead, below.
  const domainStatus = useMemo(
    () => exam && exam.kind !== 'skill-track' ? computeDomainQuizStatus(sessions, examId ?? '', exam.domains) : null,
    [sessions, examId, exam],
  );
  const readinessBreakdown: ReadinessBreakdown | null = useMemo(
    () => exam && exam.kind !== 'skill-track' ? getReadinessBreakdown(examId ?? '', exam.domains, sessions) : null,
    [sessions, examId, exam],
  );
  // relationships.json has no whole-exam key, only one per domain — union
  // across every domain's own edges (see useRelationshipsForIds's own doc).
  const relDocIds = useMemo(
    () => exam && exam.kind !== 'skill-track' ? exam.domains.map((d) => `exam/${examId}/domain-${d.id}`) : [],
    [exam, examId],
  );
  const computedRelated = useRelationshipsForIds(relDocIds);
  // Official objectives + per-question attempts → exam map and Practice step.
  const [statements, setStatements] = useState<TaskStatementsFile | null>(null);
  const mastery = useMemo(
    () => (statements && examId ? examMastery(statements, getAttempts(examId)) : null),
    [statements, examId],
  );
  const [readinessExplainOpen, setReadinessExplainOpen] = useState(false);
  // Guest mode banner dismissal (persists across page refreshes)
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return !!localStorage.getItem('guest_banner_dismissed'); }
     
    catch { return false; }
  });

  const dismissBanner = useCallback(() => {
    try { localStorage.setItem('guest_banner_dismissed', '1'); }
     
    catch { /* storage unavailable — banner stays for this session only */ }
    setBannerDismissed(true);
  }, []);

  useEffect(() => {
    if (!examId) return;
    loadExamRegistry()
      .then((r) => {
        const found = r.exams.find((e) => e.id === examId) ?? null;
        setExam(found);
        if (found?.prerequisites?.length) {
          setPrereqExams(r.exams.filter((e) => found.prerequisites!.includes(e.id)));
        }
      })
      .catch(() => {});
    loadTaskStatementsForExam(examId).then(setStatements).catch(() => setStatements(null));
    recordExamVisit(examId);
    requestAnimationFrame(() => setMounted(true));
  }, [examId]);

  if (!exam) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-5 w-36 bg-slate-800 rounded-full" />
          <div className="h-9 w-3/4 bg-slate-800 rounded-lg" />
          <div className="h-3.5 w-full bg-slate-800/70 rounded" />
          <div className="h-3.5 w-2/3 bg-slate-800/50 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800" />
              <div className="h-4 w-1/2 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800/70 rounded" />
              <div className="h-3 w-3/4 bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (exam.kind === 'skill-track') {
    return <SkillTrackHome exam={exam} examId={examId!} mounted={mounted} />;
  }

  const cards = buildContentCards(exam, examId!);

  const BADGE: Record<string, string> = {
    violet: 'bg-violet-900/50 text-violet-300 border border-violet-700/50',
    blue:   'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  };
  const badgeStyle = BADGE[exam.colorScheme] ?? 'bg-slate-800 text-slate-400 border border-slate-700';

  // Split title at last em-dash or final word for gradient span
  const titleParts = exam.title.split('–');
  const titleMain = titleParts.length > 1 ? titleParts[0].trim() + ' –' : exam.title;
  const titleAccent = titleParts.length > 1 ? titleParts[1].trim() : '';

  return (
    <div className="space-y-8">
      {/* Guest mode banner */}
      {!user && !authLoading && !bannerDismissed && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm">
          <span className="text-slate-400">You’re in guest mode — your progress is saved locally only</span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => { void login(); }}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Sign in to sync
            </button>
            <button
              onClick={dismissBanner}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss guest banner"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
      {/* ── Main column + sidebar (vertical-layout Phase C) ──────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0 space-y-8">
      {/* Header */}
      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${badgeStyle}`}>
          <GraduationCap size={12} />
          {exam.shortTitle} Certification Practice
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          {titleAccent ? (
            <>{titleMain} <span className="heading-gradient">{titleAccent}</span></>
          ) : (
            <span className="heading-gradient">{exam.title}</span>
          )}
        </h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">{exam.description}</p>
        <p className="text-slate-500 text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span>{exam.questions} scenario-based MCQs</span>
          <span>·</span>
          <span>{exam.duration}</span>
          <span>·</span>
          <span>{exam.passScore} to pass</span>
          <span>·</span>
          <span>{exam.domains.length} domains</span>
          {exam.contentVersion && (
            <>
              <span>·</span>
              <span className="font-mono text-violet-400/70">v{exam.contentVersion}</span>
            </>
          )}
        </p>
        <PageViewsBadge path={`/skillup/${examId}`} className="mt-1" />
      </div>

      {/* Prerequisites */}
      {prereqExams.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Prerequisites</span>
          {prereqExams.map((prereq) => {
            const pr = getReadinessBreakdown(prereq.id, prereq.domains, sessions);
            const passed = pr.overall >= prereq.passThreshold;
            return (
              <Link
                key={prereq.id}
                to={`/skillup/${prereq.id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  passed
                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {passed ? <CheckCircle2 size={11} /> : <Lock size={11} />}
                {prereq.shortTitle}
              </Link>
            );
          })}
        </div>
      )}
      {/* ── Guided path: what to do next ─────────────────────────────── */}
      <PrepPath exam={exam} sessions={sessions} mastery={mastery} readiness={readinessBreakdown?.overall ?? 0} />

      {authLoading ? (
        <div className="glass-card rounded-xl p-5 animate-pulse space-y-3">
          <div className="h-3 w-28 bg-slate-800 rounded-full" />
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              {[80, 60, 70, 50, 65].map((w, i) => <div key={i} className="h-2 bg-slate-800 rounded-full" style={{ width: `${w}%` }} />)}
            </div>
          </div>
        </div>
      ) : domainStatus && domainStatus.domainsStarted === 0 && mastery ? (
        // No domain quizzes yet, but the path + exam map below already say
        // what to do next — a second "take a quiz" card would contradict them.
        null
      ) : domainStatus && domainStatus.domainsStarted === 0 ? (
        // ── No quiz data yet ────────────────────────────────────────────
        <div
          className={`glass-card rounded-xl p-5 flex items-center gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '150ms' }}
        >
          <div className="w-10 h-10 rounded-lg bg-violet-900/40 border border-violet-800/40 flex items-center justify-center shrink-0">
            <Zap size={16} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Start tracking your readiness</p>
            <p className="text-xs text-slate-400 mt-0.5">Take a domain quiz to see your scores here{user ? <> — logged in as <span className="text-violet-400">{user.login}</span></> : ' — saved in this browser'}</p>
          </div>
          <Link
            to={`/skillup/${examId}/quiz`}
            className="shrink-0 px-3 py-1.5 bg-violet-800/60 hover:bg-violet-700/70 border border-violet-700/40 rounded-lg text-xs font-semibold text-violet-300 transition-colors"
          >
            Take quiz →
          </Link>
        </div>
      ) : domainStatus && readinessBreakdown ? (
        // ── Full readiness panel ────────────────────────────────────────
        <div
          className={`glass-card glass-edge card-accent-top rounded-xl p-5 space-y-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ '--accent-color': exam?.accentColor, transitionDelay: '150ms' } as React.CSSProperties}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Your Readiness</p>
          {/* Streak badge */}
          {(() => { const s = getStreak(examId ?? ''); return s > 0 ? (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
              <span>🔥</span>
              <span>{s} day{s !== 1 ? 's' : ''} streak</span>
            </div>
          ) : null; })()}

          {/* Ring + domain bars */}
          <div className="flex items-start gap-4">
            {/* Readiness ring */}
            <div className="shrink-0 relative w-[52px] h-[52px]">
              <div
                className="w-full h-full rounded-full"
                style={{ background: `conic-gradient(#7c3aed 0% ${readinessBreakdown.overall}%, #1e293b ${readinessBreakdown.overall}% 100%)` }}
              />
              <div className="absolute inset-[6px] rounded-full bg-[#0d1117] flex items-center justify-center">
                <span className="text-[11px] font-bold text-violet-400">{readinessBreakdown.overall}%</span>
              </div>
            </div>
            {/* Stats */}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white leading-tight">{readinessBreakdown.overall}% ready</p>
              <p className="text-xs text-slate-500">{domainStatus.domainsStarted} of {exam?.domains.length} domains started · need {exam?.passThreshold}% to pass</p>
              {/* Per-domain mini bars */}
              <div className="mt-2.5 space-y-1.5">
                {exam?.domains.map((d) => {
                const dr = domainStatus.byDomain[d.id];
                const sessions = getSessions();
                const comp = getDomainCompletion(exam.id, d.id, sessions);
                return (
                  <div key={d.id} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-600 w-5">D{d.id}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-violet-600 transition-all duration-700" style={{ width: `${dr?.pct ?? 0}%` }} />
                    </div>
                    <div className="flex gap-0.5">
                      <span title="Notes read" className={`text-[10px] ${comp.notesRead ? 'text-emerald-400' : 'text-slate-700'}`}>{comp.notesRead ? '📖' : '○'}</span>
                      <span title={comp.quizPassed ? `Quiz ${comp.bestScore}%` : comp.quizAttempted ? `Quiz ${comp.bestScore}% (need 70%)` : 'Quiz not started'} className={`text-[10px] ${comp.quizPassed ? 'text-emerald-400' : comp.quizAttempted ? 'text-amber-400' : 'text-slate-700'}`}>{comp.quizPassed ? '✅' : comp.quizAttempted ? '⚠' : '○'}</span>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CHIP[dr?.status ?? 'new']}`}>
                      {STATUS_LABEL[dr?.status ?? 'new']}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* Recommended next step */}
          {readinessBreakdown.recommendedFocusDomain !== null && (() => {
            const rec = exam?.domains.find((d) => d.id === readinessBreakdown.recommendedFocusDomain);
            return rec ? (
              <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 shrink-0">Recommended</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">D{rec.id}: {rec.title}</p>
                  <p className="text-[10px] text-slate-600">{rec.weight}% of exam · {domainStatus.byDomain[rec.id]?.status === 'progress' ? 'Resume' : 'Not started yet'}</p>
                </div>
                <Link
                  to={`/skillup/${examId}/notes?d=${rec.id}`}
                  className="shrink-0 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  Study <ArrowRight size={11} />
                </Link>
              </div>
            ) : null;
          })()}

          {/* Readiness explain toggle */}
          <div className="pt-1 border-t border-slate-800/60">
            <button
              onClick={() => setReadinessExplainOpen((o) => !o)}
              className="w-full flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              aria-expanded={readinessExplainOpen}
            >
              {readinessExplainOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              How is readiness calculated?
            </button>
            {readinessExplainOpen && (
              <div className="mt-2 space-y-1 rounded-lg bg-slate-900/60 border border-slate-800/60 p-2.5">
                {readinessBreakdown.byDomain.map((d) => (
                  <p key={d.domainId} className="text-[10px] text-slate-400 leading-relaxed">
                    D{d.domainId}: {d.title} — {d.weight}% of exam · Notes {d.notesRead ? '✓' : '✗'} · Quiz {d.bestScore}% · {d.pointsEarned}/{d.pointsPossible} pts
                  </p>
                ))}
                <p className="text-[10px] text-slate-500 italic mt-1">
                  Readiness = 30% for notes read + up to 70% for best quiz score, per domain, weighted by exam domain weight.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Exam map: official objectives with coverage × accuracy ──────── */}
      {mastery && <ExamMap exam={exam} mastery={mastery} />}

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ to, icon: Icon, title, desc, cta }, idx) => (
          <Link
            key={to}
            to={to}
            className={`glass-card glass-sheen card-accent-top rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group ${idx === 0 ? 'ring-1 ring-inset ring-violet-600/30' : ''} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ '--accent-color': exam.accentColor, transitionDelay: `${200 + idx * 100}ms` } as React.CSSProperties}
          >
            {idx === 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Start here
              </span>
            )}
            <div className="w-9 h-9 rounded-lg bg-slate-800/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Icon size={18} className="text-slate-300" />
            </div>
            <h2 className="font-semibold text-white mb-1 group-hover:text-slate-100 transition-colors">{title}</h2>
            <p className="text-sm text-slate-400 mb-4">{desc}</p>
            <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm font-medium group-hover:gap-2.5 transition-all duration-300">
              {cta}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      {/* ── Today's Task ──────────────────────────────────────────────── */}
      <TodaysTask examId={examId!} mounted={mounted} />
      </div>

      {/* ── Sidebar — reference/discovery content, not primary actions ──── */}
      <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 lg:sticky lg:top-4 self-start space-y-6">
      {/* Domain weights */}
      <div
        className={`glass-card glass-edge card-accent-top rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ '--accent-color': exam.accentColor, transitionDelay: '600ms' } as React.CSSProperties}
      >
        <h2 className="section-heading mb-4">Exam Domain Weights</h2>
        <div className="space-y-3">
          {exam.domains.map((domain) => {
            const dr = domainStatus?.byDomain[domain.id];
            return (
              <div key={domain.id} className="group cursor-default">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-slate-300 group-hover:text-white transition-colors">D{domain.id}: {domain.title}</span>
                  <div className="flex items-center gap-2">
                    {dr && dr.total > 0 && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CHIP[dr.status]}`}>
                        {STATUS_LABEL[dr.status]}
                      </span>
                    )}
                    <span className="text-slate-400 font-mono group-hover:text-white transition-colors">{domain.weight}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official resources */}
      <div className={`glass-card glass-edge rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '800ms' }}>
        <h2 className="section-heading mb-3">Official Resources</h2>
        <ul className="space-y-2">
          {exam.resources.map(({ label, url }) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 hover:translate-x-1 transition-all duration-200"
              >
                <ExternalLink size={13} />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Computed cross-vertical relationships — see ComputedRelatedList */}
      <ComputedRelatedList edges={computedRelated} />
      </aside>
      </div>

      {/* ── Community discussion ───────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-slate-800/60">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Community Discussion</h2>
          <div className="ml-auto"><ContentFeedback contentId={`exam-${examId}`} compact /></div>
        </div>
        <GiscusComments
          slug={`exam-${examId}`}
          context="skill-up"
        />
        <LightComments contentId={`exam-${examId}`} />
      </div>
    </div>
  );
}
