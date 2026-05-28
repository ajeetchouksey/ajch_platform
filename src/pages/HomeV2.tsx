import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Newspaper, Wrench, ArrowRight,
  GitBranch, Users, BookOpen, ExternalLink,
  GitCommit, Award, Calendar, Zap, ShieldCheck, Terminal,
  CheckCircle2, Brain, Sparkles, Globe,
} from 'lucide-react';
import {
  Badge, Button, Avatar, PulsingDot, type StatItem,
} from '../components/ui';
import { StarRepo } from '../components/StarRepo';
import {
  fetchGitHubUser, fetchGitHubRepo,
  type GitHubUserStats, type GitHubRepoStats,
} from '../lib/github-stats';
import { fetchTotalHits, type TotalStats } from '../lib/analytics';

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
] as const;

// ── Why cards ─────────────────────────────────────────────────────────────────
const whyItems = [
  {
    icon: Brain,
    color: '#a78bfa',
    title: 'Practitioner-built',
    body: '18+ years designing AI and cloud systems in production. Every resource here fills a gap I hit on a real project — not a syllabus checkbox.',
  },
  {
    icon: BookOpen,
    color: '#38bdf8',
    title: 'Zero theory tax',
    body: 'No fluff. Every article, question, and tool maps directly to something you\'ll face building real systems with real APIs.',
  },
  {
    icon: Globe,
    color: '#34d399',
    title: 'Free & open source',
    body: 'Forever free. MIT licensed. Fork it, star it, contribute. Built in public because the best platforms grow with their community.',
  },
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
  const [goat,   setGoat]   = useState<TotalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGitHubUser(), fetchGitHubRepo(), fetchTotalHits()])
      .then(([user, repo, hits]) => {
        setGhUser(user); setGhRepo(repo);
        if (hits.total > 0) setGoat(hits);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl px-6 py-4 animate-pulse"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.20)' }}>
      <div className="flex gap-8">{[0,1,2,3].map(i => <div key={i} className="flex flex-col items-center gap-1.5">
        <div className="h-6 w-10 bg-slate-800 rounded" /><div className="h-2.5 w-14 bg-slate-800 rounded" /></div>)}</div>
    </div>
  );

  const has = ghUser || ghRepo;
  if (!has && !goat) return null;

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
        {goat    && goat.total > 0 && <LiveStatPill value={goat.total}      label="Page Views" color="text-emerald-400" />}
        {goat    && goat.totalToday > 0 && <LiveStatPill value={goat.totalToday} label="Today"   color="text-teal-400" />}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomeV2() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

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
                Open Source · Built by a Practitioner
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.04] tracking-tight mb-5">
              Master AI{' '}
              <span style={{
                background: 'linear-gradient(100deg, #a78bfa 0%, #f472b6 55%, #fb923c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Architecture.</span>
              <br />
              <span className="text-4xl sm:text-5xl text-slate-400 font-black">Build Systems That Ship.</span>
            </h1>

            {/* Brand tagline */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-base font-black tracking-tight"
                style={{ background: 'linear-gradient(90deg, #38bdf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Agent speed.
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-base font-black tracking-tight"
                style={{ background: 'linear-gradient(90deg, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Human control.
              </span>
            </div>

            {/* Value prop */}
            <p className="text-base text-slate-300 max-w-xl leading-relaxed mb-4">
              The AI skills platform built by an enterprise architect — <span className="text-white font-semibold">no theory tax</span>, no paywalls.
              Certification prep, field-tested articles, and dev tools that actually help you ship.
            </p>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed mb-8">
              18+ years designing production AI and cloud systems. Every resource here solves a real problem I hit on a real project. Free forever. Built in the open.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link to="/exams"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black rounded-2xl text-white transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: '1px solid rgba(139,92,246,0.6)' }}>
                <GraduationCap size={15} /> Start Learning Free <ArrowRight size={15} />
              </Link>
              <Link to="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-2xl text-slate-300 hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.35)' }}>
                <Newspaper size={15} /> Read the Blog
              </Link>
              <StarRepo />
            </div>

            {/* Micro proof */}
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">
              {[
                { icon: CheckCircle2, label: 'Free forever — no account required' },
                { icon: CheckCircle2, label: 'Open source · MIT licensed' },
                { icon: CheckCircle2, label: 'No ads · No tracking' },
              ].map(({ icon: I, label }) => (
                <span key={label} className="flex items-center gap-1.5" style={{ color: '#64748b' }}>
                  <I size={12} style={{ color: '#10b981' }} /> {label}
                </span>
              ))}
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
                  { step: '04', label: 'Domain agent',        detail: 'Platform Control → implementation',    color: '#3b82f6', icon: Zap },
                  { step: '05', label: 'Post-build audit',    detail: 'AppSec + Design Systems review',       color: '#f59e0b', icon: Terminal },
                  { step: '06', label: 'Human approval',      detail: 'Review → merge → ship',               color: '#a78bfa', icon: ShieldCheck },
                  { step: '07', label: 'SRE deploys',         detail: 'v2.4.0 · semver · changelog',         color: '#10b981', icon: GitCommit },
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
                  <span className="font-mono text-[9px] ml-auto" style={{ color: '#334155' }}>v2.4.0 · main</span>
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
            {proofStats.map(({ icon: Icon, value, label, color }) => (
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
          § FEATURES — what's on the platform
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '160ms' }}>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>Platform</p>
          <h2 className="text-2xl font-black text-white">What's on the platform</h2>
          <p className="text-sm text-slate-500 mt-1">Three tools. One mission: accelerate your AI career.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map(({ to, icon: Icon, color, bg, border, badge, title, subtitle, desc, bullets, cta }, idx) => (
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
          § WHY — three values
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '260ms' }}>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>Philosophy</p>
          <h2 className="text-2xl font-black text-white">Why this exists</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {whyItems.map(({ icon: Icon, color, title, body }, idx) => (
            <div key={title}
              className={`rounded-2xl p-5 transition-all duration-700 hover:-translate-y-1 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(71,85,105,0.20)',
                transitionDelay: `${300 + idx * 60}ms`,
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="text-sm font-black text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
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
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles size={14} style={{ color: '#fbbf24' }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
                Free · No account required · Open source
              </span>
              <Sparkles size={14} style={{ color: '#fbbf24' }} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight mb-3">
              Ready to level up{' '}
              <span style={{
                background: 'linear-gradient(90deg, #a78bfa, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>your AI skills?</span>
            </h2>

            <p className="text-slate-400 text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Start with the certification prep, explore the blog, or pick up a tool.
              Everything is free. Everything works right now.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/exams"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-black rounded-2xl text-white transition-all duration-200 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: '1px solid rgba(139,92,246,0.6)' }}>
                <GraduationCap size={16} /> Start Practicing <ArrowRight size={16} />
              </Link>
              <Link to="/blog"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold rounded-2xl text-slate-300 hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(71,85,105,0.35)' }}>
                <Newspaper size={16} /> Browse Articles
              </Link>
              <Link to="/tools"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold rounded-2xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)', color: '#34d399' }}>
                <Wrench size={16} /> Explore Tools
              </Link>
            </div>

            <p className="text-xs text-slate-600 mt-6 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={11} style={{ color: '#10b981' }} /> No signup</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={11} style={{ color: '#10b981' }} /> No paywall</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={11} style={{ color: '#10b981' }} /> No ads</span>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

