import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Newspaper, Wrench, ArrowRight,
  GitBranch, Cpu, Users, BookOpen, ExternalLink,
  GitCommit, Award, Calendar,
} from 'lucide-react';
import { StarRepo } from '@/components/StarRepo';
import { fetchGitHubUser, fetchGitHubRepo, type GitHubUserStats, type GitHubRepoStats } from '@/lib/github-stats';

/* ─── Feature data ──────────────────────────────────────────────────────────── */
const features = [
  {
    to: '/exams/ccaf',
    icon: GraduationCap,
    badge: 'LIVE',
    badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    title: 'Certification Prep',
    subtitle: 'Claude Certified Architect · Foundations',
    desc: '68 scenario-based MCQs across 5 domains. Same format as the live exam — agentic patterns, prompt engineering, tool design, and context management.',
    specs: ['68 questions', '5 domains', '72% pass threshold'],
    cta: 'Start Practicing',
    available: true,
    gradient: 'from-violet-500/10 to-transparent',
    borderColor: 'border-violet-600/50 hover:border-violet-400',
    iconColor: 'text-violet-400',
    glowColor: 'group-hover:shadow-violet-500/10',
    accentColor: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
  },
  {
    to: '/blog',
    icon: Newspaper,
    badge: 'OPEN',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    title: 'Technical Blog',
    subtitle: 'AI Architecture · DevOps · Azure',
    desc: 'Field notes from building production AI systems: agentic workflows, Claude API patterns, infrastructure as code, and cloud architecture on Azure.',
    specs: ['60+ articles', 'Azure & IaC', 'AI Agents'],
    cta: 'Read Articles',
    available: true,
    gradient: 'from-blue-500/10 to-transparent',
    borderColor: 'border-blue-600/50 hover:border-blue-400',
    iconColor: 'text-blue-400',
    glowColor: 'group-hover:shadow-blue-500/10',
    accentColor: 'linear-gradient(90deg,#1d4ed8,#60a5fa)',
  },
  {
    to: '/tools',
    icon: Wrench,
    badge: 'SOON',
    badgeClass: 'bg-slate-800 text-slate-500 border-slate-700',
    title: 'Developer Tools',
    subtitle: 'Token counting · Context viz · MCP',
    desc: 'Utilities for working with the Claude API: token counters, context window visualizers, and MCP server scaffolding templates.',
    specs: ['Token counter', 'Context visualizer', 'MCP scaffold'],
    cta: 'Coming Soon',
    available: false,
    gradient: 'from-slate-500/5 to-transparent',
    borderColor: 'border-slate-700 hover:border-slate-600',
    iconColor: 'text-slate-500',
    glowColor: '',
    accentColor: undefined,
  },
];

/* ─── Stats ─────────────────────────────────────────────────────────────────── */
const stats = [
  { value: 1,   label: 'Cert Track',    color: 'text-violet-400', suffix: ''  },
  { value: 68,  label: 'Practice Qs',   color: 'text-blue-400',   suffix: ''  },
  { value: 5,   label: 'Exam Domains',  color: 'text-emerald-400',suffix: ''  },
  { value: 100, label: 'Free',          color: 'text-amber-400',  suffix: '%' },
];

/* ─── Why cards ─────────────────────────────────────────────────────────────── */
const whyCards = [
  {
    icon: Cpu,
    accent: 'text-violet-400',
    border: 'border-violet-600/25 hover:border-violet-500/50',
    glow: 'from-violet-500/5',
    label: 'Practitioner-built',
    body: '20+ years in cloud and DevOps — now applying that depth to AI. Every resource here fills a gap I hit on a real project — not a syllabus requirement.',
  },
  {
    icon: Users,
    accent: 'text-blue-400',
    border: 'border-blue-600/25 hover:border-blue-500/50',
    glow: 'from-blue-500/5',
    label: 'Community-first',
    body: 'Open source by design. Fork it, star it, raise a PR. The platform grows as the community grows — built in public because the best ideas come from the crowd.',
  },
  {
    icon: BookOpen,
    accent: 'text-emerald-400',
    border: 'border-emerald-600/25 hover:border-emerald-500/50',
    glow: 'from-emerald-500/5',
    label: 'Always evolving',
    body: "AI doesn't sit still, and neither does this platform. Continuously updated with new certifications, fresh field notes, and patterns that actually ship.",
  },
];

/* ─── Creator credentials ───────────────────────────────────────────────────── */
const creds = [
  { icon: Calendar,  value: '18+',   label: 'Years in the field' },
  { icon: GitCommit, value: '2,044', label: 'Contributions (2025)' },
  { icon: Award,     value: '5+',    label: 'Active certifications' },
];

/* ─── AnimatedCounter ───────────────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else { setCount(Math.floor(current)); }
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}{suffix}</span>;
}

/* ─── LivePlatformStats ─────────────────────────────────────────────────────── */
function StatPill({ value, label, color = 'text-slate-300' }: { value: number; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold ${color}`}>
        <AnimatedCounter target={value} />
      </span>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
    </div>
  );
}

function LivePlatformStats() {
  const [ghUser, setGhUser] = useState<GitHubUserStats | null>(null);
  const [ghRepo, setGhRepo] = useState<GitHubRepoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGitHubUser(), fetchGitHubRepo()])
      .then(([user, repo]) => { setGhUser(user); setGhRepo(repo); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-stats glass-edge rounded-xl px-6 py-5 animate-pulse" aria-hidden="true">
        <div className="flex flex-wrap gap-8 items-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-5 w-10 bg-slate-800/60 rounded" />
              <div className="h-3 w-16 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasGH = ghUser || ghRepo;
  if (!hasGH) return null;

  return (
    <div className="glass-stats glass-edge rounded-xl px-6 py-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
        {ghRepo  && <StatPill value={ghRepo.stars}        label="⭐ Stars"      color="text-amber-400"   />}
        {ghUser  && <StatPill value={ghUser.followers}    label="👥 Followers"  color="text-violet-400"  />}
        {ghUser  && <StatPill value={ghUser.publicRepos}  label="📦 Repos"      color="text-blue-400"    />}
        {ghRepo  && <StatPill value={ghRepo.forks}        label="🍴 Forks"      color="text-slate-300"   />}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fadeIn = (_: number) =>
    `transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`;

  return (
    <div className="space-y-16">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className={`pt-6 pb-2 ${fadeIn(0)}`} style={{ transitionDelay: '0ms' }}>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-700/40 text-[11px] font-semibold text-violet-300 backdrop-blur-sm mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
          Open Source · Built by a Practitioner
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
          Built in the Field.{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            For the Field.
          </span>
        </h1>

        <p className="text-xl font-semibold text-slate-300 mb-4">
          AI certification prep, field notes, and developer tools — no theory tax.
        </p>

        <p className="text-base text-slate-400 max-w-2xl leading-relaxed">
          I started this platform the way most things worth building get started — out of necessity.
          Preparing for CCA-F, I found scattered resources and no real community hub. So I built one.
          Now it's open source, free forever, and growing with every contributor who finds it useful.
          Whether you're certifying, building, or just exploring AI architecture — you're welcome here.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-7">
          <Link
            to="/exams/ccaf"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
          >
            <GraduationCap size={16} />
            Start CCA-F Practice
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 transition-all duration-200"
          >
            <Newspaper size={16} />
            Read the Blog
          </Link>
          <StarRepo />
        </div>
      </div>

      {/* ── Why this platform ─────────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '100ms' }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Why this exists</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {whyCards.map(({ icon: Icon, accent, border, glow, label, body }, i) => (
            <div
              key={label}
              className={`glass-card glass-edge rounded-xl p-5 border ${border} group hover:shadow-lg transition-all duration-300 relative overflow-hidden
                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${150 + i * 70}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              <div className="relative z-10">
                <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={18} className={accent} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{label}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── What's on the platform ────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '300ms' }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">What's on the platform</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map(({ to, icon: Icon, badge, badgeClass, title, subtitle, desc, specs, cta, available, gradient, borderColor, iconColor, glowColor, accentColor }, idx) => (
            <Link
              key={to}
              to={to}
              className={`glass-card glass-sheen glass-edge relative rounded-xl p-5 flex flex-col transition-all duration-300 group
                ${borderColor} ${glowColor} hover:shadow-xl
                ${available ? 'hover:-translate-y-1' : 'opacity-60 cursor-default'}
                ${accentColor ? 'card-accent-top' : ''}
                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${350 + idx * 80}ms`, ...(accentColor ? { '--accent-color': accentColor } : {}) } as React.CSSProperties}
              onClick={available ? undefined : (e) => e.preventDefault()}
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className={iconColor} />
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                    {badge}
                  </span>
                </div>
                <h2 className="text-[15px] font-bold text-white mb-0.5">{title}</h2>
                <p className={`text-[11px] font-semibold ${iconColor} opacity-80 mb-3`}>{subtitle}</p>
                <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {specs.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-500 border border-slate-700/40 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-300 ${
                  available ? `${iconColor} group-hover:gap-2.5` : 'text-slate-600'
                }`}>
                  {cta}
                  {available && <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── From the creator ──────────────────────────────────────────────────── */}
      <div
        className={`glass-card glass-edge rounded-xl p-6 border border-slate-700/50 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '550ms' }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">From the creator</p>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <img
            src="https://avatars.githubusercontent.com/u/107052100?v=4"
            alt="Ajeet Kumar Chouksey"
            className="w-14 h-14 rounded-full border-2 border-slate-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
              <span className="text-[15px] font-bold text-white">Ajeet Kumar Chouksey</span>
              <span className="text-xs text-slate-500">AI-Driven Cloud & DevOps Architect · Avanade · Frankfurt</span>
            </div>
            <blockquote className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-violet-600/40 pl-3 mb-4 max-w-2xl">
              "Everything on this platform was a personal note first — something I needed to understand,
              a gap I couldn't find filled anywhere else. I published them because the community taught
              me everything I know. Sharing back is the least I can do."
            </blockquote>
            <div className="flex flex-wrap gap-5 mb-4">
              {creds.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={13} className="text-slate-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-200">{value}</span>
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="https://github.com/ajeetchouksey" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors duration-200">
                <GitBranch size={13} />GitHub
              </a>
              <a href="https://theaiops.blog/" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors duration-200">
                <ExternalLink size={13} />theaiops.blog
              </a>
              <a href="https://www.linkedin.com/in/ajeet-chouksey-bb365138/" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors duration-200">
                <ExternalLink size={13} />LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content stats bar ────────────────────────────────────────────────── */}
      <div
        className={`glass-stats glass-edge rounded-xl px-6 py-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: '650ms' }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(({ value, label, color, suffix }, i) => (
            <div key={label} className={`group cursor-default ${i < stats.length - 1 ? 'sm:border-r sm:border-slate-800' : ''}`}>
              <div className={`text-2xl font-bold ${color} transition-transform duration-300 group-hover:scale-110`}>
                <AnimatedCounter target={value} suffix={suffix} />
              </div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live platform activity ────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: '750ms' }}
      >
        <LivePlatformStats />
      </div>

    </div>
  );
}
