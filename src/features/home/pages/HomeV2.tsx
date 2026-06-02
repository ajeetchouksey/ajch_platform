import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Newspaper, Wrench, ArrowRight,
  GitBranch, Users, BookOpen, ExternalLink,
  GitCommit, Award, Calendar, Zap, ShieldCheck, Terminal,
  CheckCircle2,
  AlertTriangle, XCircle, MapPin,
  FileSearch, MessageSquare, Bot, Server, GitPullRequest,
} from 'lucide-react';
import {
  Badge, Button, Avatar, PulsingDot, type StatItem,
} from '@/components/ui';
import { StarRepo } from '@/components/StarRepo';
import {
  fetchGitHubUser, fetchGitHubRepo,
  type GitHubUserStats, type GitHubRepoStats,
} from '@/lib/github-stats';

import { loadPlatformStats, type PlatformStats } from '@/lib/content-loader';
import { getSessions } from '@/lib/storage';

// ── Platform feature cards ────────────────────────────────────────────────────
const features = [
  {
    to: '/exams/ccaf',
    icon: GraduationCap,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.30)',
    badge: 'LIVE',
    badgeColor: '#8b5cf6',
    title: 'Certification Prep',
    subtitle: 'Claude Certified Architect · Foundations',
    desc: '68 scenario-based MCQs across 5 domains. Agentic patterns, prompt engineering, tool design, and context management.',
    bullets: ['68 exam-format questions', 'Instant scoring + explanations', 'Track progress across domains'],
    cta: 'Start Practicing Free',
  },
  {
    to: '/blog',
    icon: Newspaper,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.28)',
    badge: 'OPEN',
    badgeColor: '#3b82f6',
    title: 'Technical Blog',
    subtitle: 'AI Architecture · DevOps · Azure',
    desc: 'Field notes from building production AI systems — agentic workflows, Claude API patterns, infrastructure as code on Azure.',
    bullets: ['60+ in-depth articles', 'Azure, DevOps, AI Architecture', 'New posts every week'],
    cta: 'Read Articles',
  },
  {
    to: '/tools',
    icon: Wrench,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.28)',
    badge: 'LIVE',
    badgeColor: '#10b981',
    title: 'Developer Tools',
    subtitle: 'Token · Context · MCP · Prompts',
    desc: 'Client-side utilities for the Claude API — token counting, context visualization, MCP scaffolding, and prompt templates.',
    bullets: ['9 live tools — zero backend', 'Prompt library + tester', 'RAG chunk visualizer'],
    cta: 'Open Tools',
  },
  {
    to: '/notes',
    icon: BookOpen,
    color: '#e879f9',
    bg: 'rgba(232,121,249,0.10)',
    border: 'rgba(232,121,249,0.28)',
    badge: 'NEW',
    badgeColor: '#e879f9',
    title: 'Architecture & Notes',
    subtitle: 'System Design · Study Notes · Docs',
    desc: 'Deep technical notes on AI architecture — agentic system design, enterprise governance, and platform engineering patterns.',
    bullets: ['5+ domain study guides', 'Architecture decision records', 'Platform docs & runbooks'],
    cta: 'Explore Notes',
  },
];

// ── Quick Proof — 3 project preview cards ────────────────────────────────────
const quickProof = [
  {
    title: 'Document AI Pipeline',
    desc: 'Extract, classify, and summarize any document',
    color: '#a78bfa',
    mockLines: ['→ PDF ingested (4.2 MB)', '→ Entities extracted: 47', '→ Summary: 3 paragraphs', '✓ Output JSON ready'],
  },
  {
    title: 'Retrieval QA System',
    desc: 'Answer questions from your own knowledge base',
    color: '#38bdf8',
    mockLines: ['→ 1,240 chunks indexed', '→ Query: "What is RAG?"', '→ Top-3 retrieved (0.92)', '✓ Answer generated'],
  },
  {
    title: 'Autonomous Agent Workflow',
    desc: 'Chain tools into self-directed task pipelines',
    color: '#2dd4bf',
    mockLines: ['→ Goal: research + summarize', '→ Tool: web_search × 3', '→ Tool: summarize × 1', '✓ Report delivered'],
  },
] as const;

// ── Pain points ───────────────────────────────────────────────────────────────
const painPoints = [
  { icon: AlertTriangle, color: '#f87171', title: 'Too much theory',            body: 'Endless courses with no real systems to show for it.' },
  { icon: XCircle,       color: '#fb923c', title: "Tutorials don't translate",   body: 'Hello-world demos that fall apart on real projects.' },
  { icon: MapPin,        color: '#fbbf24', title: 'No clear path',              body: 'From beginner to engineer — nobody shows you the road.' },
] as const;

// ── What you'll build ─────────────────────────────────────────────────────────
const buildProjects = [
  { icon: FileSearch,    color: '#a78bfa', title: 'AI Document Processing System',   desc: 'OCR, entity extraction, and summarization on any document format.' },
  { icon: MessageSquare, color: '#38bdf8', title: 'Retrieval Knowledge Assistant',    desc: 'Vector search + LLM answer generation from your own data.' },
  { icon: GitBranch,     color: '#2dd4bf', title: 'Multi-Step AI Pipelines',          desc: 'Chain validation, transformation, and enrichment steps end-to-end.' },
  { icon: Bot,           color: '#fb923c', title: 'Autonomous Agents & Workflows',    desc: 'Tool-using agents that plan, act, and iterate toward a goal.' },
  { icon: Server,        color: '#34d399', title: 'Production-Ready AI Services',     desc: 'Deployed, observable, and scalable APIs serving real traffic.' },
] as const;

// ── Proof bar stats ───────────────────────────────────────────────────────────
const proofStats: StatItem[] = [
  { icon: Newspaper,     value: '60+',  label: 'Articles',         color: 'text-blue-400',    accent: 'blue'    },
  { icon: GraduationCap, value: '68',   label: 'Practice Qs',      color: 'text-violet-400',  accent: 'violet'  },
  { icon: Wrench,        value: '9',    label: 'Dev Tools',         color: 'text-emerald-400', accent: 'emerald' },
  { icon: Calendar,      value: '18+',  label: 'Yrs Experience',   color: 'text-amber-400',   accent: 'amber'   },
  { icon: Award,         value: '5+',   label: 'Certs Active',     color: 'text-rose-400',    accent: 'rose'    },
  { icon: Users,         value: '100%', label: 'Free Forever',     color: 'text-teal-400',    accent: 'teal'    },
];

// ── Creator credentials ───────────────────────────────────────────────────────
const creds = [
  { icon: Calendar,  value: '18+',   label: 'Years in the field' },
  { icon: GitCommit, value: '2,044', label: 'Contributions (2025)' },
  { icon: Award,     value: '5+',    label: 'Active certifications' },
];
// ── AI Learning Journey ───────────────────────────────────────────────────────
const journeySteps = [
  {
    level: '101', tag: 'Fundamentals',
    title: 'AI Basics & Prompting',
    output: '"Prompt a document AI pipeline"',
    color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.20)',
    topics: ['Prompt Engineering', 'GenAI Concepts', 'Responsible AI'],
    icon: BookOpen, href: '/notes', cta: 'Start Here',
    audience: 'Beginners & students',
  },
  {
    level: '201', tag: 'Practitioner',
    title: 'Workflows & Agents',
    output: '"Build a retrieval QA chatbot"',
    color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.20)',
    topics: ['Agentic AI', 'Tool Design', 'Copilot Patterns'],
    icon: Zap, href: '/exams', cta: 'Practice Now',
    audience: 'Developers & practitioners',
  },
  {
    level: '301', tag: 'Architect',
    title: 'Architecture & Systems',
    output: '"Design a multi-step agent workflow"',
    color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.20)',
    topics: ['RAG Systems', 'MCP Protocol', 'Orchestration'],
    icon: Terminal, href: '/blog', cta: 'Go Deep',
    audience: 'Engineers & architects',
  },
  {
    level: '310', tag: 'Enterprise',
    title: 'Governance & Scale',
    output: '"Architect a production AI platform"',
    color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.20)',
    topics: ['AI Governance', 'Observability', 'Secure AI'],
    icon: ShieldCheck, href: '/docs', cta: 'Architect It',
    audience: 'Leaders & principals',
  },
] as const;
// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const steps = 40;
        const inc = target / steps;
        const interval = duration / steps;
        const t = setInterval(() => {
          start += inc;
          if (start >= target) { setCount(target); clearInterval(t); }
          else setCount(Math.floor(start));
        }, interval);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ── Live stat pill ────────────────────────────────────────────────────────────
function LiveStatPill({ value, label, color }: { value: number; label: string; color?: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="flex flex-col items-center gap-0.5">
      <span className={`text-xl font-black ${color ?? 'text-slate-200'}`}>{count.toLocaleString()}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider whitespace-nowrap">{label}</span>
    </div>
  );
}

// ── Live activity bar ────────────────────────────────────────────────────────
function LiveBar() {
  const [ghUser, setGhUser] = useState<GitHubUserStats | null>(null);
  const [ghRepo, setGhRepo] = useState<GitHubRepoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGitHubUser(), fetchGitHubRepo()])
      .then(([user, repo]) => { setGhUser(user); setGhRepo(repo); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl px-6 py-4 animate-pulse"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.20)' }}>
      <div className="flex gap-8">{[0,1,2,3].map(i => <div key={i} className="flex flex-col items-center gap-1.5">
        <div className="h-6 w-10 bg-slate-800 rounded" /><div className="h-2.5 w-14 bg-slate-800 rounded" /></div>)}</div>
    </div>
  );

  if (!ghUser && !ghRepo) return null;

  return (
    <div className="rounded-2xl px-6 py-4"
      style={{ background: 'rgba(15,23,42,0.80)', border: '1px solid rgba(71,85,105,0.20)' }}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <PulsingDot active color="bg-emerald-400" size="sm" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Live GitHub</span>
        </div>
        {ghRepo  && <LiveStatPill value={ghRepo.stars}       label="⭐ Stars"      color="text-amber-400" />}
        {ghUser  && <LiveStatPill value={ghUser.followers}   label="Followers"     color="text-violet-400" />}
        {ghUser  && <LiveStatPill value={ghUser.publicRepos} label="Repos"         color="text-blue-400" />}
        {ghRepo  && <LiveStatPill value={ghRepo.forks}       label="Forks"         color="text-slate-300" />}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomeV2() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const [pStats, setPStats] = useState<PlatformStats | null>(null);
  useEffect(() => { loadPlatformStats().then(setPStats).catch(() => {}); }, []);

  const [sessions, setSessions] = useState<ReturnType<typeof getSessions>>([]);
  useEffect(() => { setSessions(getSessions().filter(s => !!s.finishedAt)); }, []);

  const dynamicProofStats = useMemo(() => proofStats.map((s) => {
    if (!pStats) return s;
    if (s.label === 'Articles')    return { ...s, value: `${pStats.platform.blog_posts}+` };
    if (s.label === 'Practice Qs') return { ...s, value: `${pStats.platform.questions}` };
    if (s.label === 'Dev Tools')   return { ...s, value: `${pStats.platform.tools}` };
    return s;
  }), [pStats]);

  const dynamicFeatures = useMemo(() => {
    if (!pStats) return features;
    const { questions, blog_posts, tools } = pStats.platform;
    return features.map((f, i) => ({
      ...f,
      ...(i === 0 ? {
        desc: `${questions} scenario-based MCQs across 5 domains. Agentic patterns, prompt engineering, tool design, and context management.`,
        bullets: [`${questions} exam-format questions`, 'Instant scoring + explanations', 'Track progress across domains'],
      } : i === 1 ? {
        bullets: [`${blog_posts}+ in-depth articles`, 'Azure, DevOps, AI Architecture', 'New posts every week'],
      } : i === 2 ? {
        bullets: [`${tools} live tools — zero backend`, 'Prompt library + tester', 'RAG chunk visualizer'],
      } : {}),
    }));
  }, [pStats]);

  return (
    <div className="space-y-20">

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`relative pt-6 pb-2 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Ambient orbs */}
        <div className="absolute -top-20 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
        <div className="absolute -top-10 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start relative z-10">

          {/* ── Left: copy ─────────────────────────────────────────────── */}
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
                style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <PulsingDot active color="bg-violet-400" size="sm" />
                Build · Deploy · Learn
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.04] tracking-tight mb-5">
              Build Real-World{' '}
              <span style={{
                background: 'linear-gradient(100deg, #7c3aed 0%, #a78bfa 45%, #fb923c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>AI Systems.</span>
              <br />
              <span className="text-4xl sm:text-5xl text-white font-black">Not Just Learn Concepts.</span>
            </h1>

            {/* Value prop */}
            <p className="text-base text-slate-300 max-w-xl leading-relaxed mb-4">
              Go from AI basics to production-grade systems (101 → 310) through{' '}
              <span className="text-white font-semibold">hands-on projects</span>,
              structured learning, and real engineering workflows.
            </p>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed mb-8">
              No fluff. No theory dumps. Build → Deploy → Learn. Free forever. Built in the open.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link to="/learn"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black rounded-2xl text-white transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: '1px solid rgba(139,92,246,0.6)' }}>
                <Zap size={15} /> Start Building AI Projects <ArrowRight size={15} />
              </Link>
              <button
                onClick={() => document.getElementById('learning-path')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-2xl text-slate-300 hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.35)' }}>
                <BookOpen size={15} /> View Learning Path
              </button>
              <StarRepo />
            </div>


          </div>

          {/* ── Right: terminal ─────────────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(6,12,24,0.98)',
                border: '1px solid rgba(139,92,246,0.22)',
                boxShadow: '0 0 80px -20px rgba(139,92,246,0.22), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}>
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#ef4444', opacity: 0.7 }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: '#eab308', opacity: 0.7 }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: '#22c55e', opacity: 0.7 }} />
                </div>
                <span className="text-[10px] font-mono text-slate-600 ml-2 flex-1">pipeline.log</span>
                <div className="flex items-center gap-1.5">
                  <PulsingDot active color="bg-emerald-400" size="sm" />
                  <span className="text-[9px] text-emerald-500 font-mono font-bold">RUNNING</span>
                </div>
              </div>
              {/* Steps */}
              <div className="p-4 space-y-2.5">
                {[
                  { step: '01', label: 'Human intent',        detail: 'Request received → Staff Engineer',    color: '#8b5cf6', icon: Users },
                  { step: '02', label: 'Issue Gate',          detail: 'Product Manager → GitHub issue #421',  color: '#14b8a6', icon: GitBranch },
                  { step: '03', label: 'Security pre-flight', detail: 'AppSec Engineer — PASS ✓',             color: '#ef4444', icon: ShieldCheck },
                  { step: '04', label: 'Domain agent',        detail: 'Platform Architect → implementation',   color: '#3b82f6', icon: Zap },
                  { step: '05', label: 'Post-build audit',    detail: 'AppSec + Design Systems review',       color: '#f59e0b', icon: Terminal },
                  { step: '06', label: 'Human approval',      detail: 'Review → merge → ship',               color: '#a78bfa', icon: ShieldCheck },
                  { step: '07', label: 'SRE deploys',         detail: 'v2.3.0 · semver · changelog',         color: '#10b981', icon: GitCommit },
                ].map(({ step, label, detail, color, icon: I }) => (
                  <div key={step} className="flex items-start gap-3 group">
                    <span className="font-mono text-[9px] font-bold mt-0.5 shrink-0 w-4" style={{ color: `${color}60` }}>{step}</span>
                    <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}28` }}>
                      <I size={11} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-200 leading-tight">{label}</p>
                      <p className="text-[10px] font-mono" style={{ color: '#475569' }}>{detail}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-2.5 mt-1 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-mono text-[10px] font-bold" style={{ color: '#10b981' }}>✓ deployed successfully</span>
                  <span className="font-mono text-[9px] ml-auto" style={{ color: '#334155' }}>v2.3.0 · main</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § PROOF BAR — animated platform stats
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '80ms' }}>
        <div className="rounded-2xl px-6 py-5"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(15,23,42,0.95) 100%)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-0 sm:divide-x sm:divide-slate-800/80">
            {dynamicProofStats.map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-1">
                <Icon size={14} className={color} />
                <span className={`text-xl font-black ${color}`}>{value}</span>
                <span className="text-[10px] text-slate-600 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § QUICK PROOF — 3 project preview cards (#28)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '120ms' }}>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>Examples</p>
          <h2 className="text-2xl font-black text-white">Build AI Like This</h2>
          <p className="text-sm text-slate-500 mt-1">Real systems. Real outputs. No filler projects.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickProof.map(({ title, desc, color, mockLines }) => (
            <div key={title} className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(6,12,24,0.98)', border: `1px solid ${color}25`, borderLeft: `3px solid ${color}` }}>
              <div className="p-5">
                <h3 className="text-sm font-black text-white mb-1">{title}</h3>
                <p className="text-[11px] text-slate-500 mb-4">{desc}</p>
                <div className="rounded-xl p-3 font-mono space-y-1.5"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(71,85,105,0.15)' }}>
                  {mockLines.map((line, i) => (
                    <p key={i} className="text-[10px] leading-relaxed"
                      style={{ color: line.startsWith('✓') ? color : '#475569' }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § PROBLEM — AI learning is broken (#29)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '140ms' }}>
        <div className="max-w-2xl mx-auto text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: '#64748b' }}>The Problem</p>
          <h2 className="text-2xl font-black text-white mb-3">AI Learning Today Is Broken</h2>
          <p className="text-sm text-slate-500">You invest months in courses and still can't build a real system.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {painPoints.map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(15,23,42,0.95)', border: `1px solid ${color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 mx-auto"
                style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="text-sm font-black text-white mb-2">{title}</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § FEATURES — what's on the platform
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '160ms' }}>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>Approach</p>
          <h2 className="text-2xl font-black text-white">A Better Way to Learn AI</h2>
          <p className="text-sm text-slate-500 mt-1">Four pillars. One mission: build real systems, not finish fake exercises.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {dynamicFeatures.map(({ to, icon: Icon, color, bg, border, badge, title, subtitle, desc, bullets, cta }, idx) => (
            <div
              key={to}
              className={`group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + idx * 80}ms` }}
            >
              <Link to={to} className="block h-full rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5"
                style={{ background: 'rgba(15,23,42,0.95)', border: `1px solid rgba(71,85,105,0.20)` }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${border}`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px -12px ${color}30`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(71,85,105,0.20)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}>
                {/* Top accent */}
                <div className="absolute top-0 left-5 right-5 h-[1px] rounded-full pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />

                {/* Icon + badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-13 h-13 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 24px -6px ${color}35` }}>
                    <Icon size={24} style={{ color }} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg"
                    style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
                    {badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-black text-white mb-0.5">{title}</h3>
                <p className="text-[10px] font-bold mb-3" style={{ color: `${color}cc` }}>{subtitle}</p>

                {/* Description */}
                <p className="text-[13px] text-slate-400 leading-relaxed mb-4">{desc}</p>

                {/* Bullets */}
                <ul className="space-y-1.5 mb-5">
                  {bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-[12px] text-slate-400">
                      <CheckCircle2 size={11} style={{ color, flexShrink: 0 }} /> {b}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-1.5 text-sm font-black transition-all duration-200 group-hover:gap-2.5"
                  style={{ color }}>
                  {cta} <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § PROGRESS TEASER — returning user nudge
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      {sessions.length > 0 && (
        <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '175ms' }}>
          <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(15,23,42,0.98) 100%)',
              border: '1px solid rgba(139,92,246,0.28)',
            }}>
            {/* Left: welcome back */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#a78bfa' }}>Welcome back</p>
              <p className="text-base font-black text-white mb-0.5">Continue your CCA-F prep</p>
              <p className="text-xs text-slate-400">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} completed
                {sessions.at(-1) && (
                  <> · Last score:{' '}
                    <span className="font-bold" style={{ color: '#a78bfa' }}>
                      {Math.round((sessions.at(-1)!.score / sessions.at(-1)!.total) * 100)}%
                    </span>
                  </>
                )}
              </p>
            </div>
            {/* Middle: best score bar */}
            {(() => {
              const best = Math.max(...sessions.map(s => Math.round((s.score / s.total) * 100)));
              const passing = best >= 72;
              return (
                <div className="w-full sm:w-44 shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500">Best score</span>
                    <span className="text-sm font-black" style={{ color: passing ? '#10b981' : '#a78bfa' }}>{best}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${best}%`, background: passing ? '#10b981' : 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
                  </div>
                  <p className="text-[9px] text-slate-700 mt-1">Pass threshold: 72% {passing ? '✓ Ready' : '· Keep going'}</p>
                </div>
              );
            })()}
            {/* Right: CTA */}
            <Link to="/exams/ccaf/quiz"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: '1px solid rgba(139,92,246,0.55)' }}>
              Continue <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § LEARNING JOURNEY — AI 101 → 310 (#32)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section id="learning-path" className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '240ms' }}>

        {/* Section header */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>Learning Path</p>
          <h2 className="text-2xl font-black text-white">Your AI Engineering Journey</h2>
          <p className="text-sm text-slate-500 mt-1">From fundamentals to enterprise architecture — structured, hands-on, free.</p>
        </div>

        {/* ── DESKTOP: horizontal gradient track ─────────────────────────── */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Gradient connecting track between step circles */}
            <div className="absolute top-[27px] left-[12.5%] right-[12.5%] h-[2px] pointer-events-none rounded-full"
              style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 33%, #2dd4bf 66%, #fb923c 100%)', opacity: 0.6 }} />

            <div className="grid grid-cols-4 gap-3">
              {journeySteps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.level} className="flex flex-col items-center">
                    {/* Step circle */}
                    <div className="relative z-10 w-14 h-14 rounded-full flex flex-col items-center justify-center mb-4 transition-transform duration-200 hover:scale-110"
                      style={{
                        background: `radial-gradient(circle, ${step.bg} 0%, rgba(6,12,24,0.95) 100%)`,
                        border: `2px solid ${step.color}`,
                        boxShadow: `0 0 24px -6px ${step.color}60`,
                      }}>
                      <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: `${step.color}90` }}>{step.tag.slice(0,4)}</span>
                      <span className="text-sm font-black leading-none" style={{ color: step.color }}>{step.level}</span>
                    </div>

                    {/* Step card */}
                    <Link to={step.href}
                      className="w-full rounded-2xl p-4 block transition-all duration-200 hover:-translate-y-1.5 group"
                      style={{ background: 'rgba(15,23,42,0.95)', border: `1px solid ${step.border}` }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px -10px ${step.color}35`;
                        (e.currentTarget as HTMLElement).style.borderColor = step.color + '50';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        (e.currentTarget as HTMLElement).style.borderColor = step.border;
                      }}>
                      {/* Tag + icon */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <StepIcon size={12} style={{ color: step.color }} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: step.color }}>{step.tag}</span>
                      </div>
                      {/* Title */}
                      <h3 className="text-sm font-black text-white mb-1 leading-snug">{step.title}</h3>
                      {/* Example output */}
                      <p className="text-[9px] font-mono mb-2" style={{ color: `${step.color}b0` }}>{step.output}</p>
                      {/* Topic chips */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {step.topics.map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ color: step.color, background: step.bg, border: `1px solid ${step.border}` }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      {/* Audience */}
                      <p className="text-[10px] text-slate-600 mb-3">{step.audience}</p>
                      {/* CTA */}
                      <div className="flex items-center gap-1 text-[11px] font-black transition-all duration-200 group-hover:gap-2"
                        style={{ color: step.color }}>
                        {step.cta} <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MOBILE: vertical left-border stack ─────────────────────────── */}
        <div className="md:hidden space-y-3">
          {journeySteps.map((step) => {
            const StepIcon = step.icon;
            return (
              <Link key={step.level} to={step.href}
                className="flex items-start gap-3 rounded-2xl p-4 block transition-all duration-200 active:scale-[0.98]"
                style={{ background: 'rgba(15,23,42,0.95)', border: `1px solid ${step.border}`, borderLeft: `3px solid ${step.color}` }}>
                {/* Badge */}
                <div className="shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black"
                  style={{ background: step.bg, border: `1px solid ${step.border}` }}>
                  <span className="text-[8px]" style={{ color: `${step.color}80` }}>{step.level.slice(0,2)}</span>
                  <span className="text-xs font-black" style={{ color: step.color }}>{step.level.slice(2)}</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <StepIcon size={11} style={{ color: step.color }} />
                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: step.color }}>{step.tag}</span>
                  </div>
                  <p className="text-sm font-black text-white mb-1">{step.title}</p>
                  <p className="text-[10px] text-slate-500">{step.topics.join(' · ')}</p>
                </div>
                <ArrowRight size={14} className="shrink-0 mt-1" style={{ color: `${step.color}70` }} />
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-7 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-600">All content is free · No account required to start</p>
          <Link to="/exams"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-2xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(56,189,248,0.15))', border: '1px solid rgba(139,92,246,0.35)' }}>
            Start Your AI Journey <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § WHAT YOU WILL BUILD (#31)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '300ms' }}>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>Projects</p>
          <h2 className="text-2xl font-black text-white">What You Will Actually Build</h2>
          <p className="text-sm text-slate-500 mt-1">Production-grade systems, not toy examples.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildProjects.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
              style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)', borderLeft: `3px solid ${color}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="text-sm font-black text-white mb-2">{title}</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § COMMUNITY — open source
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '320ms' }}>
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(15,23,42,0.98) 100%)',
            border: '1px solid rgba(16,185,129,0.18)',
          }}>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Left: messaging */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: '#64748b' }}>Open Source</p>
                <h2 className="text-xl font-black text-white mb-2">Built With Builders, Not Alone.</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-xl">
                  Contribute real AI projects, learn from real implementations, and collaborate with other builders.
                  The best platforms grow when their community shapes them.
                </p>
                {/* Early signal */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                    Early builders joining
                  </span>
                </div>
                {/* Community points */}
                <div className="flex flex-wrap gap-3 mb-5">
                  {([
                    { icon: GitPullRequest, color: '#a78bfa', label: 'Contribute real AI projects' },
                    { icon: BookOpen,       color: '#38bdf8', label: 'Learn from real implementations' },
                    { icon: Users,          color: '#2dd4bf', label: 'Collaborate with other builders' },
                  ] as const).map(({ icon: Icon, color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color }} />
                      <span className="text-[11px] text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
                {/* Tech stack chips */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {([
                    { label: 'MIT License', color: '#34d399' },
                    { label: 'React 19', color: '#38bdf8' },
                    { label: 'TypeScript', color: '#60a5fa' },
                    { label: 'Zero backend', color: '#a78bfa' },
                    { label: 'GitHub Pages', color: '#fb923c' },
                  ] as const).map(({ label, color }) => (
                    <span key={label} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ color, background: `${color}12`, border: `1px solid ${color}28` }}>
                      {label}
                    </span>
                  ))}
                </div>
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <a href="https://github.com/ajeetchouksey/ajch_platform" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)', color: '#34d399' }}>
                    <GitBranch size={12} /> Fork on GitHub
                  </a>
                  <StarRepo />
                  <a href="https://github.com/ajeetchouksey/ajch_platform/issues" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'rgba(71,85,105,0.12)', border: '1px solid rgba(71,85,105,0.28)', color: '#94a3b8' }}>
                    <ExternalLink size={12} /> Open an Issue
                  </a>
                </div>
              </div>
              {/* Right: open-source stats */}
              <div className="shrink-0 grid grid-cols-2 gap-2.5">
                {([
                  { value: '100%', label: 'Open source', color: '#34d399' },
                  { value: 'MIT', label: 'License', color: '#38bdf8' },
                  { value: 'Free', label: 'Forever', color: '#a78bfa' },
                  { value: '0', label: 'Paywalls', color: '#fb923c' },
                ] as const).map(({ value, label, color }) => (
                  <div key={label} className="rounded-xl px-4 py-3 text-center"
                    style={{ background: `${color}0a`, border: `1px solid ${color}20` }}>
                    <div className="text-lg font-black" style={{ color }}>{value}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § CREATOR — authority + trust
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '360ms' }}>
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(15,23,42,0.98) 60%)',
            border: '1px solid rgba(139,92,246,0.18)',
          }}>
          <div className="p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-5" style={{ color: '#64748b' }}>
              From the creator
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="shrink-0">
                <Avatar
                  src="https://avatars.githubusercontent.com/u/107052100?v=4"
                  alt="Ajeet Kumar Chouksey"
                  size="lg"
                  online
                  ringColor="ring-violet-500/40"
                />
              </div>

              {/* Bio */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                  <span className="text-base font-black text-white">Ajeet Kumar Chouksey</span>
                  <Badge label="AI Architect · Frankfurt" variant="slate" size="xs" />
                </div>
                <p className="text-xs text-slate-500 mb-4">Enterprise AI · Azure Cloud · Agentic Systems</p>

                <blockquote className="text-[15px] text-slate-300 leading-[1.75] mb-5 max-w-2xl pl-4 border-l-2 border-violet-500/50 italic">
                  "I've spent my career designing systems that have to work at scale, under pressure, with real consequences.
                  This platform is where I apply those same instincts to my own learning —
                  and build in the open, with anyone who wants to come along."
                </blockquote>

                {/* Credential chips */}
                <div className="flex flex-wrap gap-5 mb-5">
                  {creds.map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon size={12} className="text-slate-600 shrink-0" />
                      <span className="text-sm font-black text-slate-200">{value}</span>
                      <span className="text-xs text-slate-500">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" icon={GitBranch} href="https://github.com/ajeetchouksey" target="_blank" rel="noreferrer">
                    GitHub
                  </Button>
                  <Button variant="outline" size="sm" icon={ExternalLink} href="https://theaiops.blog/" target="_blank" rel="noreferrer">
                    theaiops.blog
                  </Button>
                  <Button variant="outline" size="sm" icon={ExternalLink} href="https://www.linkedin.com/in/ajeet-chouksey-bb365138/" target="_blank" rel="noreferrer">
                    LinkedIn
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § LIVE ACTIVITY — GitHub stats
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: '420ms' }}>
        <LiveBar />
      </section>

      {/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          § CTA — bottom conversion
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '480ms' }}>
        <div className="relative rounded-2xl overflow-hidden px-6 py-12 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.20) 0%, rgba(59,130,246,0.12) 50%, rgba(15,23,42,0.98) 100%)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 0 80px -20px rgba(139,92,246,0.20)',
          }}>
          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.12]"
            style={{ backgroundImage: 'radial-gradient(rgba(139,92,246,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-3">
              Start Your AI Building{' '}
              <span style={{
                background: 'linear-gradient(90deg, #a78bfa, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Journey Today</span>
            </h2>

            <p className="text-slate-400 text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Be part of the first wave of AI builders. Free forever. No account required.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/learn"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-black rounded-2xl text-white transition-all duration-200 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: '1px solid rgba(139,92,246,0.6)' }}>
                <Zap size={16} /> Join Early Access <ArrowRight size={16} />
              </Link>
              <Link to="/blog"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold rounded-2xl text-slate-300 hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(71,85,105,0.35)' }}>
                <Newspaper size={16} /> Browse Articles
              </Link>
            </div>


          </div>
        </div>
      </section>

    </div>
  );
}

