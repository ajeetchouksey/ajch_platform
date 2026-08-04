import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, TrendingUp, Brain, Zap,
  ArrowRight, Users, BookOpen,
  BookOpen as BookOpenIcon, Terminal, GraduationCap, Wrench, CheckCircle2, Clock,
} from 'lucide-react';
import { PulsingDot } from '@/components/ui';
import { useMeta } from '@/lib/useMeta';
import { getSessions } from '@/lib/storage';

// ── Track definitions (static mock — will be driven by catalog.json in Phase 2) ─
const TRACKS = [
  {
    id: 'safety',
    label: 'AI Safety & Responsibility',
    audience: 'Teens 13–18',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.22)',
    icon: ShieldCheck,
    description:
      'Learn how AI is used in scams, deepfakes, and disinformation — and how to stay safe, spot manipulation, and be a responsible digital citizen.',
    topics: ['Scam Detection', 'Deepfakes & Disinformation', 'Digital Privacy', 'Responsible AI Use'],
    articleCount: 3,
  },
  {
    id: 'applied',
    label: 'Applied AI for Practitioners',
    audience: 'Finance & Data Professionals',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.22)',
    icon: TrendingUp,
    description:
      'Practical AI skills for financial modeling, data storytelling, scenario forecasting, and automating repetitive workflows without a data science degree.',
    topics: ['Financial Forecasting', 'Data Storytelling', 'Report Automation', 'Scenario Modeling'],
    articleCount: 3,
  },
  {
    id: 'ethics',
    label: 'AI Ethics & Bias',
    audience: 'Students 16+',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.22)',
    icon: Brain,
    description:
      'Understand how algorithmic bias happens, why fairness in ML is contested, and how governance frameworks like the EU AI Act shape responsible AI.',
    topics: ['Algorithmic Bias', 'Fairness in ML', 'AI Governance', 'Ethical Design'],
    articleCount: 3,
  },
  {
    id: 'productivity',
    label: 'AI Productivity',
    audience: 'Students & Professionals',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.22)',
    icon: Zap,
    description:
      'Use AI as a force multiplier — for studying, writing, workflow automation, and prompt engineering that actually saves you hours every week.',
    topics: ['Prompt Engineering', 'AI Study Assistants', 'Workflow Automation', 'Research Acceleration'],
    articleCount: 3,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
const LEVELS = [
  {
    level: '101', tag: 'Fundamentals', color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)',
    icon: BookOpenIcon,
    title: 'AI Basics & Prompting',
    objective: 'Understand how LLMs work, craft effective prompts, and explore the AI landscape without writing a single line of code.',
    topics: ['LLMs & Transformers', 'Prompt Engineering', 'AI Tools Landscape', 'Tokenisation Basics'],
    resources: [{ label: 'Study Notes', href: '/notes' }, { label: 'Start Exam Prep', href: '/skillup' }],
  },
  {
    level: '201', tag: 'Practitioner', color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)',
    icon: Zap,
    title: 'Workflows & Agents',
    objective: 'Build multi-step AI workflows, wire up tool-calling agents, and automate repeatable tasks end-to-end.',
    topics: ['Agentic Patterns', 'Tool-Calling & MCP', 'RAG Pipelines', 'Workflow Orchestration'],
    resources: [{ label: 'CCA-F Exam Prep', href: '/skillup/ccaf' }, { label: 'AI Tools', href: '/tools' }],
  },
  {
    level: '301', tag: 'Architect', color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.22)',
    icon: Terminal,
    title: 'Architecture & Systems',
    objective: 'Design production-grade AI systems — vector stores, context management, evaluation loops, and cost controls.',
    topics: ['Vector Databases', 'Context Windows', 'Eval & Observability', 'Cost Optimisation'],
    resources: [{ label: 'Field Notes', href: '/blog' }, { label: 'Docs', href: '/docs' }],
  },
  {
    level: '310', tag: 'Enterprise', color: '#fb923c',
    bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)',
    icon: Wrench,
    title: 'Governance & Scale',
    objective: 'Navigate AI governance, compliance, risk, and responsible deployment at organisational scale.',
    topics: ['AI Risk Frameworks', 'EU AI Act', 'MLOps & Lifecycle', 'Responsible Deployment'],
    resources: [{ label: 'Docs', href: '/docs' }, { label: 'Study Notes', href: '/notes' }],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
export default function Pathways() {
  const [mounted, setMounted] = useState(false);
  const [sessions] = useState(() => getSessions());
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const bestScore = sessions.length
    ? Math.max(...sessions.map(s => Math.round((s.score / s.total) * 100)))
    : 0;

  useMeta({
    title: 'Learn — AI Learning Hub',
    description:
      'Structured AI learning guides and practitioner curriculum for teens, students, finance pros, and engineers. Explore tracks and follow the 101→310 learning path.',
  });

  return (
    <div className="space-y-14">

      {/*━━━━ HERO */}
      <section
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <PulsingDot active color="bg-violet-400" size="sm" />
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: '#a78bfa' }}
          >
            Learning Hub
          </span>
        </div>
        <h1 className="text-4xl font-black text-white leading-tight mb-3">
          Structured AI learning.{' '}
          <span
            style={{
              background: 'linear-gradient(100deg, #7c3aed 0%, #a78bfa 50%, #fb923c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            No fluff.
          </span>
        </h1>
        <p className="text-base text-slate-400 max-w-xl leading-relaxed">
          Follow the 101→310 practitioner path or dive into audience-focused tracks — from digital safety for
          teens to AI architecture for engineers.
        </p>
      </section>

      {/*━━━━ PROGRESS SUMMARY (returning users) */}
      {sessions.length > 0 && (
        <section
          className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '40ms' }}
        >
          <div
            className="rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between gap-4"
            style={{
              background: 'rgba(139,92,246,0.07)',
              border: '1px solid rgba(139,92,246,0.20)',
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-violet-400" />
              <div>
                <p className="text-sm font-bold text-white">
                  {sessions.length} quiz session{sessions.length !== 1 ? 's' : ''} completed
                </p>
                <p className="text-xs text-slate-400">Best score: {bestScore}% · Keep going</p>
              </div>
            </div>
            <Link
              to="/skillup/ccaf"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-white transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                border: '1px solid rgba(139,92,246,0.45)',
              }}
            >
              <GraduationCap size={13} /> Continue Exam Prep <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      )}

      {/*━━━━ TRACK CARDS */}
      <section
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '80ms' }}
      >
        <div className="mb-6">
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5"
            style={{ color: '#64748b' }}
          >
            4 Tracks
          </p>
          <h2 className="text-2xl font-black text-white">Choose your path.</h2>
        </div>

        <div className="space-y-4">
          {TRACKS.map((track, idx) => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${100 + idx * 80}ms`,
                  background: 'rgba(8,15,30,0.97)',
                  border: '1px solid rgba(71,85,105,0.20)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${track.border}`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 56px -16px ${track.color}22`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(71,85,105,0.20)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                  (e.currentTarget as HTMLElement).style.transform = '';
                }}
              >
                {/* Top accent line — opacity on hover like SkillUp */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${track.color}, transparent 70%)` }}
                />

                {/* Ambient corner glow */}
                <div
                  className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${track.color}18 0%, transparent 70%)` }}
                />

                <div className="relative p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    {/* Icon badge */}
                    <div className="shrink-0">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: track.bg,
                          border: `2px solid ${track.color}`,
                          boxShadow: `0 0 20px -6px ${track.color}40`,
                        }}
                      >
                        <Icon size={22} style={{ color: track.color }} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Audience + article count (SkillUp badge row) */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg"
                          style={{
                            color: track.color,
                            background: track.bg,
                            border: `1px solid ${track.border}`,
                          }}
                        >
                          <Users size={8} /> {track.audience}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {track.articleCount} articles
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-black text-white mb-2 tracking-tight transition-colors duration-200 group-hover:text-slate-100">
                        {track.label}
                      </h3>

                      {/* Description (Blog-style) */}
                      <p className="text-sm text-slate-400 leading-relaxed mb-5">
                        {track.description}
                      </p>

                      {/* Stats row (SkillUp pattern) */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5 text-[12px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={11} style={{ color: track.color }} />
                          <span className="text-white font-bold">{track.articleCount}</span> articles
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={11} style={{ color: track.color }} />
                          {track.audience}
                        </span>
                      </div>

                      {/* Topic pills (Blog tag style) */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {track.topics.map((t) => (
                          <span
                            key={t}
                            className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium"
                            style={{
                              background: 'rgba(15,23,42,0.8)',
                              color: '#64748b',
                              border: '1px solid rgba(71,85,105,0.18)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* CTA (SkillUp gradient button) */}
                      <Link
                        to={`/horizons/${track.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${track.color}, ${track.color}cc)`,
                          border: `1px solid ${track.border}`,
                          boxShadow: `0 4px 16px -4px ${track.color}30`,
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px -6px ${track.color}50`)}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px -4px ${track.color}30`)}
                      >
                        <BookOpen size={13} /> Browse articles <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/*━━━━ PRACTITIONER PATH (absorbed from /learn) */}
      <section
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '320ms' }}
      >
        <div className="mb-6">
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5"
            style={{ color: '#64748b' }}
          >
            Practitioner Path
          </p>
          <h2 className="text-2xl font-black text-white">Follow the curriculum.</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-lg">
            A structured 101→310 progression for engineers and practitioners building real AI systems.
          </p>
        </div>

        <div className="space-y-4">
          {LEVELS.map((lvl, idx) => {
            const Icon = lvl.icon;
            return (
              <div
                key={lvl.level}
                className={`rounded-2xl overflow-hidden transition-all duration-500 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${340 + idx * 70}ms`,
                  background: 'rgba(8,15,30,0.97)',
                  border: `1px solid ${lvl.border}`,
                }}
              >
                {/* Top accent */}
                <div
                  className="h-0.5 w-full"
                  style={{ background: `linear-gradient(90deg,${lvl.color}80,transparent)` }}
                />
                <div className="p-6 flex gap-5">
                  {/* Level badge */}
                  <div
                    className="shrink-0 w-16 flex flex-col items-center justify-center rounded-xl py-3 gap-1"
                    style={{ background: lvl.bg, border: `1px solid ${lvl.border}` }}
                  >
                    <Icon size={16} style={{ color: lvl.color }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: lvl.color }}>
                      {lvl.tag}
                    </span>
                    <span className="text-xl font-black text-white leading-none">{lvl.level}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-white mb-1">{lvl.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{lvl.objective}</p>

                    {/* Topic pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {lvl.topics.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                          style={{
                            background: 'rgba(15,23,42,0.8)',
                            color: '#64748b',
                            border: '1px solid rgba(71,85,105,0.18)',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Resource links */}
                    <div className="flex flex-wrap gap-2">
                      {lvl.resources.map((r) => (
                        <Link
                          key={r.href}
                          to={r.href}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                          style={{
                            background: `linear-gradient(135deg,${lvl.color}22,${lvl.color}11)`,
                            border: `1px solid ${lvl.border}`,
                            color: lvl.color,
                          }}
                        >
                          {r.label} <ArrowRight size={10} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/*━━━━ BOTTOM CTA */}
      <section
        className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '620ms' }}
      >
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background:
              'linear-gradient(135deg,rgba(124,58,237,0.10) 0%,rgba(251,146,60,0.06) 100%)',
            border: '1px solid rgba(139,92,246,0.18)',
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
            style={{ color: '#64748b' }}
          >
            Not sure where to start?
          </p>
          <h2 className="text-2xl font-black text-white mb-2">
            {sessions.length > 0 ? 'Back to the exam hall' : 'Start at 101'}
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {sessions.length > 0
              ? 'Pick up where you left off. Every session builds your readiness.'
              : 'Begin with fundamentals, then advance through workflows, architecture, and governance.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/skillup/ccaf"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-black rounded-2xl text-white transition-all hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                border: '1px solid rgba(139,92,246,0.55)',
              }}
            >
              <GraduationCap size={15} /> Start Exam Prep <ArrowRight size={15} />
            </Link>
            <Link
              to="/horizons/safety"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-bold rounded-2xl text-slate-300 hover:text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.35)' }}
            >
              <ShieldCheck size={15} /> Explore Safety Track
            </Link>
          </div>
          <p className="text-[10px] text-slate-700 mt-4 flex items-center justify-center gap-1">
            <Clock size={10} /> Approx. 2–4 weeks to CCA-F readiness at 30 min/day
          </p>
        </div>
      </section>

    </div>
  );
}
