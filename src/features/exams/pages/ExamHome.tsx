import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Brain, BookOpen, Layers, BarChart2, ExternalLink, ArrowRight, GraduationCap, Lock, Zap, CalendarDays, Clock, X, MessageSquare } from 'lucide-react';
import GiscusComments from '@/components/GiscusComments';
import { loadExamRegistry } from '@/lib/content-loader';
import { useAuth } from '@/lib/auth';
import { getSessions } from '@/lib/storage';
import { loadPlan, nextIncompleteSession } from '@/lib/plan-generator';
import RelatedContent from '@/components/RelatedContent';
import PageViewsBadge from '@/components/PageViewsBadge';
import type { ExamConfig, DomainConfig, QuizSession } from '@/types/content';

// ── Readiness helpers ─────────────────────────────────────────────────────────

type DomainStatus = 'strong' | 'progress' | 'new';

interface DomainReadiness { pct: number; total: number; status: DomainStatus }

function computeReadiness(
  sessions: QuizSession[],
  examId: string,
  domains: DomainConfig[],
): {
  byDomain: Record<number, DomainReadiness>;
  overall: number;
  domainsStarted: number;
  recommendedDomainId: number | null;
} {
  const scores: Record<number, { correct: number; total: number }> = {};
  for (const d of domains) scores[d.id] = { correct: 0, total: 0 };
  for (const s of sessions) {
    if (!s.finishedAt || s.skillId !== examId || s.domainFilter === null) continue;
    const sc = scores[s.domainFilter];
    if (sc) { sc.correct += s.score; sc.total += s.total; }
  }
  let weightedPctSum = 0;
  let domainsStarted = 0;
  const byDomain: Record<number, DomainReadiness> = {};
  for (const d of domains) {
    const sc = scores[d.id];
    const pct = sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : 0;
    const status: DomainStatus = pct >= 70 ? 'strong' : sc.total > 0 ? 'progress' : 'new';
    if (sc.total > 0) domainsStarted++;
    byDomain[d.id] = { pct, total: sc.total, status };
    weightedPctSum += pct * d.weight;
  }
  const overall = Math.round(weightedPctSum / 100);
  const recommendedDomainId = domains.find((d) => byDomain[d.id]?.status !== 'strong')?.id ?? null;
  return { byDomain, overall, domainsStarted, recommendedDomainId };
}

const STATUS_CHIP: Record<DomainStatus, string> = {
  strong:   'bg-emerald-950 text-emerald-400 border border-emerald-800',
  progress: 'bg-amber-950  text-amber-400  border border-amber-800',
  new:      'bg-slate-800  text-slate-500  border border-slate-700',
};
const STATUS_LABEL: Record<DomainStatus, string> = {
  strong: 'Strong', progress: 'In progress', new: 'Not started',
};

function AnimatedBar({ width, color, delay }: { width: number; color: string; delay: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{ width: animated ? `${width}%` : '0%', boxShadow: animated ? '0 0 8px 0 currentColor' : 'none' }}
      />
    </div>
  );
}

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

function examCards(examId: string) {
  return [
    {
      to: `/skillup/${examId}/quiz`,
      icon: Brain,
      title: 'Practice Quiz',
      desc: 'Mock exams or domain-focused drills — same scenario-based MCQ format as the real exam.',
      cta: 'Start Quiz',
    },
    {
      to: `/skillup/${examId}/notes`,
      icon: BookOpen,
      title: 'Study Notes',
      desc: 'Structured reference notes for all exam domains. Key rules, mental models, and exam traps.',
      cta: 'Open Notes',
    },
    {
      to: `/skillup/${examId}/scenarios`,
      icon: Layers,
      title: 'Scenario Practice',
      desc: 'Walk through exam scenarios: architecture patterns, decision points, and anti-patterns.',
      cta: 'Browse Scenarios',
    },
    {
      to: `/skillup/${examId}/progress`,
      icon: BarChart2,
      title: 'Progress',
      desc: 'Track your scores by domain, spot weak areas, and see improvement over time.',
      cta: 'View Progress',
    },
  ];
}

export default function ExamHome() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading, login } = useAuth();
  const sessions = useMemo(() => getSessions(), []);
  const readiness = useMemo(
    () => exam ? computeReadiness(sessions, examId ?? '', exam.domains) : null,
    [sessions, examId, exam],
  );
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

  // Static keyword set per exam for cross-link matching
  const EXAM_TAGS: Record<string, string[]> = useMemo(() => ({
    ccaf:  ['claude', 'anthropic', 'mcp', 'prompt-engineering', 'agentic', 'ai', 'llm', 'context', 'tool-design', 'system-prompt'],
    ab100: ['azure', 'azure-ai', 'agentic', 'responsible-ai', 'copilot-studio', 'azure-openai', 'governance'],
    ghbp:  ['github', 'branch-protection', 'devops', 'ci-cd', 'platform-engineering', 'governance', 'security'],
  }), []);

  const examTags = useMemo(() => (examId ? (EXAM_TAGS[examId] ?? [examId]) : []), [examId, EXAM_TAGS]);

  useEffect(() => {
    if (!examId) return;
    loadExamRegistry()
      .then((r) => setExam(r.exams.find((e) => e.id === examId) ?? null))
      .catch(() => {});
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

  const cards = examCards(examId!);

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
      {/* Header */}
      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${badgeStyle}`}>
          <GraduationCap size={12} />
          {exam.shortTitle} Certification Practice
        </span>
        <p className="page-eyebrow">{exam.shortTitle} Exam</p>
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
        </p>
        <PageViewsBadge path={`/skillup/${examId}`} className="mt-1" />
      </div>

      {/* ── Readiness Panel ─────────────────────────────────────────── */}
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
      ) : !user ? (
        // ── Locked teaser (logged-out) ──────────────────────────────────
        <div
          className={`glass-card glass-edge rounded-xl overflow-hidden relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '150ms' }}
        >
          {/* blurred preview */}
          <div className="p-5 blur-[3px] pointer-events-none select-none" aria-hidden="true">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Your Readiness</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-violet-900/40 border-4 border-violet-800/30 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-600">–%</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-600">0 of {exam?.domains.length} domains started</div>
              </div>
            </div>
            <div className="space-y-2">
              {exam?.domains.map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-700 w-5">D{d.id}</span>
                  <div className="flex-1 h-1 bg-slate-800 rounded-full" />
                  <span className="text-[9px] text-slate-700 w-16">Not started</span>
                </div>
              ))}
            </div>
          </div>
          {/* lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/75 backdrop-blur-[2px]">
            <Lock size={18} className="text-violet-400" />
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-white">Track your readiness</p>
              <p className="text-xs text-slate-400 mt-1">Sign in to save quiz scores and see your domain progress</p>
            </div>
            <button
              onClick={() => void login()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600/60 rounded-lg text-sm font-medium text-white transition-colors"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
              Sign in with GitHub
            </button>
          </div>
        </div>
      ) : readiness && readiness.domainsStarted === 0 ? (
        // ── Logged in but no quiz data yet ─────────────────────────────
        <div
          className={`glass-card rounded-xl p-5 flex items-center gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '150ms' }}
        >
          <div className="w-10 h-10 rounded-lg bg-violet-900/40 border border-violet-800/40 flex items-center justify-center shrink-0">
            <Zap size={16} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Start tracking your readiness</p>
            <p className="text-xs text-slate-400 mt-0.5">Take a domain quiz to see your scores here — logged in as <span className="text-violet-400">{user.login}</span></p>
          </div>
          <Link
            to={`/skillup/${examId}/quiz`}
            className="shrink-0 px-3 py-1.5 bg-violet-800/60 hover:bg-violet-700/70 border border-violet-700/40 rounded-lg text-xs font-semibold text-violet-300 transition-colors"
          >
            Take quiz →
          </Link>
        </div>
      ) : readiness ? (
        // ── Full readiness panel ────────────────────────────────────────
        <div
          className={`glass-card glass-edge card-accent-top rounded-xl p-5 space-y-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ '--accent-color': exam?.accentColor, transitionDelay: '150ms' } as React.CSSProperties}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Your Readiness</p>

          {/* Ring + domain bars */}
          <div className="flex items-start gap-4">
            {/* Readiness ring */}
            <div className="shrink-0 relative w-[52px] h-[52px]">
              <div
                className="w-full h-full rounded-full"
                style={{ background: `conic-gradient(#7c3aed 0% ${readiness.overall}%, #1e293b ${readiness.overall}% 100%)` }}
              />
              <div className="absolute inset-[6px] rounded-full bg-[#0d1117] flex items-center justify-center">
                <span className="text-[11px] font-bold text-violet-400">{readiness.overall}%</span>
              </div>
            </div>
            {/* Stats */}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-white leading-tight">{readiness.overall}% ready</p>
              <p className="text-xs text-slate-500">{readiness.domainsStarted} of {exam?.domains.length} domains started · need {exam?.passThreshold}% to pass</p>
              {/* Per-domain mini bars */}
              <div className="mt-2.5 space-y-1.5">
                {exam?.domains.map((d) => {
                  const dr = readiness.byDomain[d.id];
                  return (
                    <div key={d.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-600 w-5">D{d.id}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-violet-600 transition-all duration-700" style={{ width: `${dr?.pct ?? 0}%` }} />
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
          {readiness.recommendedDomainId !== null && (() => {
            const rec = exam?.domains.find((d) => d.id === readiness.recommendedDomainId);
            return rec ? (
              <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 shrink-0">Recommended</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">D{rec.id}: {rec.title}</p>
                  <p className="text-[10px] text-slate-600">{rec.weight}% of exam · {readiness.byDomain[rec.id]?.status === 'progress' ? 'Resume' : 'Not started yet'}</p>
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
        </div>
      ) : null}

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

      {/* Domain weights */}
      <div
        className={`glass-card glass-edge card-accent-top rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ '--accent-color': exam.accentColor, transitionDelay: '600ms' } as React.CSSProperties}
      >
        <h2 className="section-heading mb-4">Exam Domain Weights</h2>
        <div className="space-y-3">
          {exam.domains.map((domain, idx) => {
            const dr = readiness?.byDomain[domain.id];
            return (
              <div key={domain.id} className="group cursor-default">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-slate-300 group-hover:text-white transition-colors">D{domain.id}: {domain.title}</span>
                  <div className="flex items-center gap-2">
                    {!user && !authLoading ? (
                      <button
                        onClick={() => { void login(); }}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-violet-400 border border-violet-800 hover:bg-violet-900/40 transition-colors"
                      >
                        Sign in to track →
                      </button>
                    ) : (dr && dr.total > 0 && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CHIP[dr.status]}`}>
                        {STATUS_LABEL[dr.status]}
                      </span>
                    ))}
                    <span className="text-slate-400 font-mono group-hover:text-white transition-colors">{domain.weight}%</span>
                  </div>
                </div>
                <AnimatedBar width={domain.weight} color={domain.color} delay={700 + idx * 150} />
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

      {/* Related resources — cross-links to other SkillUp tracks & AI Tools */}
      <RelatedContent
        tags={examTags}
        currentPath={`/skillup/${examId}`}
        heading="Continue Learning"
        maxSkills={2}
        maxTools={3}
      />

      {/* ── Community discussion ───────────────────────────────────────── */}
      <div className="mt-12 pt-8 border-t border-slate-800/60">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Community Discussion</h2>
        </div>
        <GiscusComments
          slug={`exam-${examId}`}
          context="skill-up"
        />
      </div>
    </div>
  );
}
