import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Layers, BarChart2, ExternalLink, ArrowRight, Lock, FlaskConical, CalendarDays, Timer, X, MessageSquare, CheckCircle2, ChevronDown, ChevronRight, Flame, LayoutDashboard } from 'lucide-react';
import GiscusComments from '@/components/GiscusComments';
import { LightComments } from '@/components/LightComments';
import { ContentFeedback } from '@/components/ContentFeedback';
import { loadExamRegistry, loadTaskStatementsForExam } from '@/lib/content-loader';
import { useAuth } from '@/lib/auth';
import { getSessions } from '@/lib/storage';
import { getAttempts } from '@/lib/adaptive-quiz';
import { examMastery } from '@/lib/objective-mastery';
import { ExamMap, PrepPath } from '../components/ExamMap';
import { ReadinessRing } from '../components/ReadinessRing';
import { loadPlan, nextIncompleteSession } from '@/lib/plan-generator';
import { getStreak, getReadinessBreakdown, getResumeState, resumeLabel } from '@/lib/study-tracker';
import type { ReadinessBreakdown } from '@/lib/study-tracker';
import { dueCount, getCardStates } from '@/lib/flashcards';
import { getScenarioResults } from '@/lib/scenario-progress';
import ComputedRelatedList from '@/components/ComputedRelatedList';
import { useRelationshipsForIds } from '@/lib/useRelationships';
import PageViewsBadge from '@/components/PageViewsBadge';
import type { ExamConfig, TaskStatementsFile } from '@/types/content';
import { recordExamVisit } from '@/lib/exam-stats';
import SkillTrackHome from './SkillTrackHome';

// ── Action tiles ──────────────────────────────────────────────────────────────

interface Tile { to: string; icon: React.ElementType; title: string; detail: string; tone?: 'due' }

function buildTiles(exam: ExamConfig, examId: string): Tile[] {
  const base = `/skillup/${examId}`;
  const types = exam.contentTypes?.length ? exam.contentTypes : ['mcq', 'notes', 'scenario'];
  const tiles: Tile[] = [];

  if (types.includes('notes')) {
    const resume = getResumeState(examId);
    const d = resume && exam.domains.find((x) => x.id === resume.domainId);
    tiles.push({
      to: d ? `${base}/notes?d=${d.id}` : `${base}/notes`, icon: BookOpen, title: 'Study notes',
      detail: d ? `Resume D${d.id}${resumeLabel(resume) ? ` · ${resumeLabel(resume)}` : ''}` : `${exam.domains.length} domains · key rules and traps`,
    });
  }

  // Flashcards are built from the notes, so any exam with notes has them.
  if (types.includes('notes')) {
    const due = dueCount(examId);
    const inReview = Object.keys(getCardStates(examId)).length;
    tiles.push({
      to: `${base}/flashcards`, icon: Layers, title: 'Flashcards',
      detail: due > 0 ? `${due} due now` : inReview > 0 ? `${inReview} in review · none due` : 'Quick recall from your notes',
      tone: due > 0 ? 'due' : undefined,
    });
  }

  if (types.includes('mcq')) {
    tiles.push({ to: `${base}/quiz?mode=timed`, icon: Timer, title: 'Timed exam', detail: `Exam conditions · ${exam.duration}` });
  }

  if (types.includes('scenario')) {
    const done = Object.keys(getScenarioResults(examId)).length;
    tiles.push({ to: `${base}/scenarios`, icon: LayoutDashboard, title: 'Scenarios', detail: done ? `${done} walked through` : 'Step through real cases' });
  }

  const plan = loadPlan(examId);
  const next = plan ? nextIncompleteSession(plan) : null;
  tiles.push({
    to: `${base}/plan`, icon: CalendarDays, title: 'Study plan',
    detail: !plan ? 'Make a day-by-day plan' : next ? `Day ${next.day} · ${next.estimatedMinutes} min` : 'All sessions complete',
  });

  tiles.push({ to: `${base}/progress`, icon: BarChart2, title: 'Progress', detail: 'Scores over time, by domain' });

  if (types.includes('lab')) {
    tiles.push({ to: `/hol-labs?exam=${examId}`, icon: FlaskConical, title: 'Hands-on labs', detail: 'Guided configurations' });
  }
  return tiles;
}

export default function ExamHome() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [prereqExams, setPrereqExams] = useState<ExamConfig[]>([]);
  const { user, isLoading: authLoading, login } = useAuth();
  const sessions = useMemo(() => getSessions(), []);
  // Skill Track (IDEA-0016) entries have no domains[] — this readiness/quiz
  // machinery is exam-only; SkillTrackHome renders instead, below.
  const readinessBreakdown: ReadinessBreakdown | null = useMemo(
    () => exam && exam.kind !== 'skill-track' ? getReadinessBreakdown(examId ?? '', exam.domains, sessions, exam.questions) : null,
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
  }, [examId]);

  if (!exam) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-4 w-48 bg-slate-800 rounded-full" />
          <div className="h-9 w-2/3 bg-slate-800 rounded-lg" />
          <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="h-7 w-24 bg-slate-800/70 rounded-full" />)}</div>
        </div>
        <div className="glass-card rounded-2xl h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="glass-card rounded-2xl h-72" />
          <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="glass-card rounded-xl h-24" />)}</div>
        </div>
      </div>
    );
  }

  if (exam.kind === 'skill-track') {
    return <SkillTrackHome exam={exam} examId={examId!} mounted />;
  }

  const tiles = buildTiles(exam, examId!);
  const readiness = readinessBreakdown?.overall ?? 0;
  const coverage = Math.round((mastery?.coverage ?? 0) * 100);
  const streak = getStreak(examId!);
  const started = readinessBreakdown?.byDomain.some((d) => d.quizAttempted || d.notesRead) ?? false;
  const kicker = [exam.shortTitle, `${exam.provider} certification`, exam.contentLevel ? `L${exam.contentLevel}` : null].filter(Boolean).join(' · ');
  const chips = [`${exam.questions} questions`, exam.duration, `${exam.passScore} to pass`, `${exam.domains.length} domains`];

  return (
    <div className="space-y-6">
      {/* Retired track — point to its replacement */}
      {exam.deprecatedAt && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-700/50 bg-amber-950/30 text-sm">
          <span className="text-amber-200">
            This track was retired on {new Date(exam.deprecatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            {exam.supersededBy ? ' and merged into a newer, syllabus-aligned track.' : '.'} Your progress here is kept.
          </span>
          {exam.supersededBy && (
            <Link to={`/skillup/${exam.supersededBy}`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 transition-colors">
              Go to the current track <ArrowRight size={12} />
            </Link>
          )}
        </div>
      )}
      {/* Guest mode banner */}
      {!user && !authLoading && !bannerDismissed && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm">
          <span className="text-slate-300">You’re in guest mode. Progress is saved in this browser only.</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { void login(); }}
              className="min-h-10 px-2 text-xs font-semibold text-brand-lilac hover:text-white transition-colors"
            >
              Sign in to sync
            </button>
            <button
              onClick={dismissBanner}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss guest banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Header: identity + readiness ─────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex-[999_1_420px] min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-lilac">{kicker}</p>
          <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-tight text-white break-words">{exam.title}</h1>
          <ul className="flex flex-wrap gap-2" aria-label="Exam facts">
            {chips.map((c) => (
              <li key={c} className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-600/30 text-xs text-slate-300">{c}</li>
            ))}
            {exam.contentVersion && (
              <li className="px-2.5 py-1 rounded-full border border-slate-700/50 text-xs font-mono text-slate-400">v{exam.contentVersion}</li>
            )}
          </ul>
          <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">{exam.description}</p>
          <PageViewsBadge path={`/skillup/${examId}`} />
        </div>
        <div className="flex-[1_1_240px] glass-card glass-edge rounded-2xl p-4 flex items-center gap-4">
          <ReadinessRing pct={readiness} size={68} />
          <div className="min-w-0">
            <p className="text-base font-semibold text-white">{started ? 'Ready' : 'Not started yet'}</p>
            <p className="text-xs text-slate-400">Need {exam.passThreshold}% · coverage {coverage}%</p>
            {streak > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                <Flame size={12} aria-hidden="true" /> {streak}-day streak
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Prerequisites */}
      {prereqExams.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Prerequisites</span>
          {prereqExams.map((prereq) => {
            const pr = getReadinessBreakdown(prereq.id, prereq.domains, sessions, prereq.questions);
            const passed = pr.overall >= prereq.passThreshold;
            return (
              <Link
                key={prereq.id}
                to={`/skillup/${prereq.id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  passed
                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                {passed ? <CheckCircle2 size={11} /> : <Lock size={11} />}
                {prereq.shortTitle}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Guided path: what to do next ─────────────────────────────────── */}
      <PrepPath exam={exam} sessions={sessions} mastery={mastery} readiness={readiness} />

      {/* ── Exam map + action tiles ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-[999_1_560px] min-w-0">
          {mastery ? <ExamMap exam={exam} mastery={mastery} /> : <div className="glass-card rounded-2xl h-64 animate-pulse" />}
        </div>

        <aside className="flex-[1_1_280px] min-w-0 space-y-4" aria-label="Study tools">
          <nav className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
            {tiles.map(({ to, icon: Icon, title, detail, tone }) => (
              <Link
                key={title}
                to={to}
                className="glass-card rounded-xl p-4 flex flex-col gap-1.5 border border-slate-600/20 hover:border-brand-lilac/45 transition-colors group"
              >
                <Icon size={16} className="text-brand-lilac" aria-hidden="true" />
                <span className="text-[15px] font-semibold text-white group-hover:text-brand-tint">{title}</span>
                <span className={`text-xs leading-snug ${tone === 'due' ? 'text-amber-300 font-semibold' : 'text-slate-400'}`}>{detail}</span>
              </Link>
            ))}
          </nav>

          {readinessBreakdown && (
            <div className="glass-card rounded-xl p-4">
              <button
                onClick={() => setReadinessExplainOpen((o) => !o)}
                className="w-full min-h-10 flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                aria-expanded={readinessExplainOpen}
              >
                {readinessExplainOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                How is readiness worked out?
              </button>
              {readinessExplainOpen && (
                <div className="mt-2 space-y-1.5">
                  {readinessBreakdown.byDomain.map((d) => (
                    <p key={d.domainId} className="text-[11px] text-slate-400 leading-relaxed">
                      <span className="text-slate-200">D{d.domainId}</span> · {d.weight}% of exam · notes {d.notesRead ? 'read' : 'not read'} · quiz {d.bestScore}% · {Math.round(d.pointsEarned)}/100
                    </p>
                  ))}
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Each domain: 30 points for reading its notes, up to 70 for its quiz score, weighted by the domain's share of the exam. The quiz score counts your latest answers against the domain's share of the bank, so it rises with coverage as well as accuracy.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* What's new — the exam's own content changelog, newest first */}
          {(exam.changelog?.length ?? 0) > 0 && (
            <details className="glass-card rounded-xl p-4">
              <summary className="min-h-10 flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-slate-200">
                What's new
                <span className="text-[10px] font-mono text-slate-400">v{exam.contentVersion}</span>
              </summary>
              <ol className="mt-2 space-y-3">
                {[...(exam.changelog ?? [])].reverse().slice(0, 3).map((c) => (
                  <li key={c.version} className="text-xs leading-relaxed">
                    <p className="text-slate-400">
                      <span className="font-mono">v{c.version}</span> · {new Date(c.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-slate-300 line-clamp-3" title={c.summary}>{c.summary}</p>
                  </li>
                ))}
              </ol>
            </details>
          )}

          {/* Official resources */}
          {exam.resources.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-200 mb-2">Official resources</h2>
              <ul className="space-y-1">
                {exam.resources.map(({ label, url }) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 min-h-9 text-sm text-slate-300 hover:text-white transition-colors"
                    >
                      <ExternalLink size={13} className="shrink-0 text-slate-400" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Computed cross-vertical relationships — see ComputedRelatedList */}
      <ComputedRelatedList edges={computedRelated} />

      {/* ── Community discussion ───────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <MessageSquare size={16} className="text-brand-lilac" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Community discussion</h2>
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
