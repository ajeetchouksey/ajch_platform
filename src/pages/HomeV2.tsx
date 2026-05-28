import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Newspaper, Wrench, ArrowRight,
  GitBranch, Cpu, Users, BookOpen, ExternalLink,
  GitCommit, Award, Calendar,
} from 'lucide-react';
import {
  GlassCard,
  Badge,
  Button,
  Avatar,
  PulsingDot,
  StatGrid,
  type StatItem,
} from '../components/ui';
import { StarRepo } from '../components/StarRepo';
import {
  fetchGitHubUser, fetchGitHubRepo,
  type GitHubUserStats, type GitHubRepoStats,
} from '../lib/github-stats';
import { fetchTotalHits, type TotalStats } from '../lib/analytics';

// ─── Section 1 data: Platform features ───────────────────────────────────────
const features = [
  {
    to: '/exams/ccaf',
    icon: GraduationCap,
    badge: 'LIVE' as const,
    badgeVariant: 'violet' as const,
    accent: 'violet' as const,
    border: 'border-violet-600/40 hover:border-violet-400/60',
    iconColor: 'text-violet-400',
    title: 'Certification Prep',
    subtitle: 'Claude Certified Architect · Foundations',
    desc: '68 scenario-based MCQs across 5 domains. Same format as the live exam — agentic patterns, prompt engineering, tool design, and context management.',
    specs: ['68 questions', '5 domains', '72% pass threshold'],
    cta: 'Start Practicing',
    available: true,
  },
  {
    to: '/blog',
    icon: Newspaper,
    badge: 'OPEN' as const,
    badgeVariant: 'blue' as const,
    accent: 'blue' as const,
    border: 'border-blue-600/40 hover:border-blue-400/60',
    iconColor: 'text-blue-400',
    title: 'Technical Blog',
    subtitle: 'AI Architecture · DevOps · Azure',
    desc: 'Field notes from building production AI systems: agentic workflows, Claude API patterns, infrastructure as code, and cloud architecture on Azure.',
    specs: ['60+ articles', 'Azure & IaC', 'AI Agents'],
    cta: 'Read Articles',
    available: true,
  },
  {
    to: '/tools',
    icon: Wrench,
    badge: 'LIVE' as const,
    badgeVariant: 'emerald' as const,
    accent: 'emerald' as const,
    border: 'border-emerald-600/40 hover:border-emerald-400/60',
    iconColor: 'text-emerald-400',
    title: 'Developer Tools',
    subtitle: 'Token counting · Context viz · MCP',
    desc: 'Utilities for working with the Claude API: token counters, context window visualizers, and MCP server scaffolding templates.',
    specs: ['Token counter', 'Context visualizer', 'MCP scaffold'],
    cta: 'Open Tools',
    available: true,
  },
] as const;

// ─── Section 2 data: Why cards ────────────────────────────────────────────────
const whyCards = [
  {
    icon: Cpu,
    accent: 'violet' as const,
    border: 'border-violet-600/25 hover:border-violet-500/50',
    label: 'Practitioner-built',
    body: '20+ years designing AI and cloud systems in production. Every resource here fills a gap I hit on a real project — not a syllabus requirement.',
  },
  {
    icon: Users,
    accent: 'blue' as const,
    border: 'border-blue-600/25 hover:border-blue-500/50',
    label: 'Community-first',
    badge: 'COMING SOON',
    body: 'Open source by design. Fork it, star it, raise a PR. A community hub — forums, showcases, and shared resources — is on the roadmap. Built in public because the best ideas come from the crowd.',
  },
  {
    icon: BookOpen,
    accent: 'emerald' as const,
    border: 'border-emerald-600/25 hover:border-emerald-500/50',
    label: 'Always evolving',
    body: "AI doesn't sit still, and neither does this platform. Continuously updated with new certifications, fresh field notes, and patterns that actually ship.",
  },
];

// ─── Section 3 data: Creator credentials ─────────────────────────────────────
const creds = [
  { icon: Calendar,  value: '18+',   label: 'Years in the field' },
  { icon: GitCommit, value: '2,044', label: 'Contributions (2025)' },
  { icon: Award,     value: '5+',    label: 'Active certifications' },
];

// ─── Section 4 data: Platform stats ──────────────────────────────────────────
const platformStats: StatItem[] = [
  { icon: Newspaper,     value: '60+',  label: 'Published Articles', color: 'text-blue-400',    accent: 'blue'    },
  { icon: GraduationCap, value: '68',   label: 'Practice Questions', color: 'text-violet-400',  accent: 'violet'  },
  { icon: Wrench,        value: '3',    label: 'Live Products',      color: 'text-emerald-400', accent: 'emerald' },
  { icon: Users,         value: '100%', label: 'Free & Open Source', color: 'text-amber-400',   accent: 'amber'   },
];

// ─── Live stat pill ───────────────────────────────────────────────────────────
function LiveStatPill({
  value, label, color = 'text-slate-300',
}: { value: number; label: string; color?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 30;
    const inc = value / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= value) { setCount(value); clearInterval(t); }
      else { setCount(Math.floor(cur)); }
    }, 1200 / steps);
    return () => clearInterval(t);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold ${color}`}>{count}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── Live platform stats widget ───────────────────────────────────────────────
function LivePlatformStats() {
  const [ghUser, setGhUser] = useState<GitHubUserStats | null>(null);
  const [ghRepo, setGhRepo] = useState<GitHubRepoStats | null>(null);
  const [goat,   setGoat]   = useState<TotalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGitHubUser(), fetchGitHubRepo(), fetchTotalHits()])
      .then(([user, repo, hits]) => {
        setGhUser(user);
        setGhRepo(repo);
        if (hits.total > 0) setGoat(hits);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassCard className="glass-stats px-6 py-5 animate-pulse" border="border-slate-700/40">
        <div className="flex flex-wrap gap-8 items-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-5 w-10 bg-slate-800/60 rounded" />
              <div className="h-3 w-16 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  const hasGH   = ghUser || ghRepo;
  const hasGoat = goat && goat.total > 0;
  if (!hasGH && !hasGoat) return null;

  return (
    <GlassCard className="glass-stats px-6 py-5" border="border-slate-700/40">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-1.5 shrink-0">
          <PulsingDot active color="bg-emerald-400" size="sm" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Live</span>
        </div>
        {ghRepo  && <LiveStatPill value={ghRepo.stars}       label="⭐ Stars"      color="text-amber-400"   />}
        {ghUser  && <LiveStatPill value={ghUser.followers}   label="👥 Followers"  color="text-violet-400"  />}
        {ghUser  && <LiveStatPill value={ghUser.publicRepos} label="📦 Repos"      color="text-blue-400"    />}
        {ghRepo  && <LiveStatPill value={ghRepo.forks}       label="🍴 Forks"      color="text-slate-300"   />}
        {hasGoat && <LiveStatPill value={goat!.total}        label="👀 Page Views" color="text-emerald-400" />}
        {hasGoat && goat!.totalToday > 0 &&
          <LiveStatPill value={goat!.totalToday} label="📈 Today" color="text-teal-400" />}
      </div>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomeV2() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const fadeIn = (delayMs: number) => ({
    className: `transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`,
    style: { transitionDelay: `${delayMs}ms` },
  });

  return (
    <div className="space-y-16">

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Hero
      ══════════════════════════════════════════════════════════════════════ */}
      <div {...fadeIn(0)} className={`pt-6 pb-2 ${fadeIn(0).className}`}>

        {/* Status badge */}
        <div className="mb-6">
          <Badge
            label="Open Source · Built by a Practitioner"
            variant="violet"
            uppercase
            icon={PulsingDot as React.ElementType}
          />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
          Built in the Field.{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            For the Field.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-xl font-semibold text-slate-300 mb-4">
          AI skill building, field notes, and tools —{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            no theory tax.
          </span>
        </p>

        {/* Personal origin story */}
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
          I started this platform the way most things worth building get started —{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-semibold">
            out of necessity.
          </span>{' '}
          I'm an enterprise architect by trade — which means I can't help but build things to last.
          Aarya started as a personal challenge: take the skills I use designing{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-semibold">
            enterprise-grade
          </span>{' '}
          cloud and AI systems, and apply them somewhere entirely my own.
          It's a real project, not a polished product — built in the open, with all the iteration and rough edges that entails.
          If you're learning, building, or just curious, I'd love for you to contribute, challenge the ideas, or simply follow along.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg border border-transparent transition-all duration-200 active:scale-95 hover:shadow-violet-500/25 hover:shadow-sm"
          >
            <GraduationCap size={15} />
            Start Learning
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-transparent hover:bg-slate-800/70 text-slate-400 hover:text-white font-medium rounded-lg border border-transparent transition-all duration-200 active:scale-95"
          >
            <Newspaper size={15} />
            Read the Blog
          </Link>
          <StarRepo />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Why this exists
      ══════════════════════════════════════════════════════════════════════ */}
      <div {...fadeIn(100)} className={fadeIn(100).className} style={fadeIn(100).style}>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Why this exists</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {whyCards.map(({ icon: Icon, accent, border, label, badge: cardBadge, body }, i) => (
            <div
              key={label}
              className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${150 + i * 70}ms` }}
            >
              <GlassCard
                accent={accent}
                border={border}
                className="p-5 h-full group hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={18} className={`text-${accent}-400`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white">{label}</h3>
                  {cardBadge && <Badge label={cardBadge} variant="slate" size="xs" uppercase />}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — What's on the platform
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '300ms' }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">What's on the platform</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map(({ to, icon: Icon, badge, badgeVariant, accent, border, iconColor, title, subtitle, desc, specs, cta, available }, idx) => (
            <div
              key={to}
              className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${350 + idx * 80}ms` }}
            >
              <GlassCard
                accent={accent}
                border={border}
                className={`p-5 flex flex-col h-full group hover:shadow-xl transition-all duration-300 ${
                  available ? 'hover:-translate-y-1' : 'opacity-60'
                }`}
              >
                {/* Icon + badge row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className={iconColor} />
                  </div>
                  <Badge label={badge} variant={badgeVariant} uppercase />
                </div>

                {/* Title + subtitle */}
                <h2 className="text-[15px] font-bold text-white mb-0.5">{title}</h2>
                <p className={`text-[11px] font-semibold ${iconColor} opacity-80 mb-3`}>{subtitle}</p>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{desc}</p>

                {/* Spec chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {specs.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-500 border border-slate-700/40 font-mono">
                      {s}
                    </span>
                  ))}
                </div>

                {/* CTA link */}
                {available ? (
                  <Link
                    to={to}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${iconColor} group-hover:gap-2.5 transition-all duration-300`}
                  >
                    {cta}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-slate-600">{cta}</span>
                )}
              </GlassCard>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — From the creator
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '500ms' }}
      >
        <GlassCard border="border-slate-700/50" className="p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">From the creator</p>
          <div className="flex flex-col sm:flex-row items-start gap-5">

            {/* Avatar */}
            <Avatar
              src="https://avatars.githubusercontent.com/u/107052100?v=4"
              alt="Ajeet Kumar Chouksey"
              size="lg"
              online
              ringColor="ring-violet-500/40"
            />

            {/* Bio */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                <span className="text-[15px] font-bold text-white">Ajeet Kumar Chouksey</span>
                <Badge label="AI Architect · Frankfurt" variant="slate" size="xs" />
              </div>

              <blockquote className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-violet-600/40 pl-3 mb-4 max-w-2xl">
                "I've spent my career designing systems that have to work at scale, under pressure, with real consequences.
                Aarya is where I apply those same instincts to my own learning — and build in the open,
                with anyone who wants to come along."
              </blockquote>

              {/* Credential chips */}
              <div className="flex flex-wrap gap-5 mb-4">
                {creds.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={13} className="text-slate-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-200">{value}</span>
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              {/* External links */}
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
        </GlassCard>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — Platform stats
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: '600ms' }}
      >
        <StatGrid stats={platformStats} cols={4} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — Live activity (GitHub + GoatCounter)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: '750ms' }}
      >
        <LivePlatformStats />
      </div>

    </div>
  );
}
