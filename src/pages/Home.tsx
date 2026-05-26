import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Newspaper, Wrench, ArrowRight } from 'lucide-react';
import { StarRepo } from '../components/StarRepo';

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

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const fade = (delay: number) =>
    `transition-all duration-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`;

  return (
    <div className="space-y-12">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className={`pt-6 pb-2 ${fade(0)}`} style={{ transitionDelay: '0ms' }}>

        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-700/40 text-[11px] font-semibold text-violet-300 backdrop-blur-sm mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
          Open Source · AI Architect Learning Platform
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">
          Prepare.{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Build.
          </span>{' '}
          Ship.
        </h1>

        {/* Subhead */}
        <p className="text-xl font-semibold text-slate-300 mb-3">
          AI knowledge for practitioners.
        </p>

        {/* Body */}
        <p className="text-base text-slate-400 max-w-xl leading-relaxed mb-8">
          Structured certification prep, field notes from production AI systems, and
          developer tooling — built by an AI architect, for AI practitioners.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3">
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
            Browse the Blog
          </Link>
          <StarRepo />
        </div>
      </div>

      {/* ── Feature Cards ────────────────────────────────────────────────────── */}
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
            style={{ transitionDelay: `${150 + idx * 100}ms`, ...(accentColor ? { '--accent-color': accentColor } : {}) } as React.CSSProperties}
            onClick={available ? undefined : (e) => e.preventDefault()}
          >
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

            <div className="relative z-10 flex flex-col h-full">
              {/* Icon + badge row */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon size={20} className={iconColor} />
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                  {badge}
                </span>
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

              {/* CTA */}
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

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <div
        className={`glass-stats glass-edge rounded-xl px-6 py-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: '500ms' }}
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

    </div>
  );
}