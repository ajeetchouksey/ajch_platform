import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Zap, Terminal, ShieldCheck, ArrowRight,
  GraduationCap, FileText, Wrench, CheckCircle2, Clock,
} from 'lucide-react';
import { PulsingDot } from '@/components/ui';
import { getSessions } from '@/lib/storage';

// ── Journey levels ────────────────────────────────────────────────────────────
const levels = [
  {
    level: '101', tag: 'Fundamentals', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.22)',
    icon: BookOpen,
    title: 'AI Basics & Prompting',
    objective: 'Build a solid foundation in AI concepts and effective prompt engineering.',
    topics: ['What is GenAI?', 'Prompt Engineering Basics', 'Responsible AI', 'LLM Fundamentals', 'Use-case identification'],
    resources: [
      { label: 'Study Notes', href: '/notes', icon: FileText },
      { label: 'Start Exam Prep', href: '/skillup', icon: GraduationCap },
    ],
  },
  {
    level: '201', tag: 'Practitioner', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.22)',
    icon: Zap,
    title: 'Workflows & Agents',
    objective: 'Design and implement agentic workflows using modern AI toolchains.',
    topics: ['Agentic patterns', 'Tool use & function calling', 'Copilot architectures', 'Multi-agent coordination', 'State & memory'],
    resources: [
      { label: 'Practice Exam', href: '/skillup/ccaf', icon: GraduationCap },
      { label: 'AI Tools', href: '/tools', icon: Wrench },
    ],
  },
  {
    level: '301', tag: 'Architect', color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.22)',
    icon: Terminal,
    title: 'Architecture & Systems',
    objective: 'Architect scalable AI systems: RAG pipelines, MCP servers, orchestration layers.',
    topics: ['RAG system design', 'MCP protocol & servers', 'Retrieval & reranking', 'Context management at scale', 'Eval frameworks'],
    resources: [
      { label: 'Read Deep-Dives', href: '/blog', icon: FileText },
      { label: 'Platform Docs', href: '/docs', icon: BookOpen },
    ],
  },
  {
    level: '310', tag: 'Enterprise', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)',
    icon: ShieldCheck,
    title: 'Governance & Scale',
    objective: 'Lead enterprise AI programs with security, compliance, and operational maturity.',
    topics: ['AI governance frameworks', 'Safety & alignment', 'Observability & audit trails', 'Secure AI deployment', 'Organizational AI readiness'],
    resources: [
      { label: 'Platform Docs', href: '/docs', icon: BookOpen },
      { label: 'Architecture Notes', href: '/notes', icon: FileText },
    ],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
export default function Learn() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const [sessions] = useState<ReturnType<typeof getSessions>>(() => getSessions().filter(s => !!s.finishedAt));

  const bestScore = sessions.length > 0
    ? Math.max(...sessions.map(s => Math.round((s.score / s.total) * 100)))
    : null;

  return (
    <div className="space-y-14 max-w-4xl mx-auto">

      {/*━━━━ HERO */}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center gap-2 mb-4">
          <PulsingDot active color="bg-violet-400" size="sm" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#a78bfa' }}>
            AI Learning Hub
          </span>
        </div>
        <h1 className="text-4xl font-black text-white leading-tight mb-3">
          Structured AI learning,{' '}
          <span style={{ background: 'linear-gradient(90deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            no fluff.
          </span>
        </h1>
        <p className="text-base text-slate-400 max-w-xl leading-relaxed">
          Four levels. Field-tested resources. Built by an enterprise AI architect — free forever.
        </p>
      </section>

      {/*━━━━ PROGRESS SUMMARY (returning users) */}
      {bestScore !== null && (
        <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '60ms' }}>
          <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(15,23,42,0.98) 100%)', border: '1px solid rgba(139,92,246,0.28)' }}>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#a78bfa' }}>Your progress</p>
              <p className="text-base font-black text-white mb-0.5">{sessions.length} quiz session{sessions.length !== 1 ? 's' : ''} completed</p>
              <p className="text-xs text-slate-400">Best score: <span className="font-bold" style={{ color: bestScore >= 72 ? '#10b981' : '#a78bfa' }}>{bestScore}%</span> · Pass threshold: 72%</p>
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${bestScore}%`, background: bestScore >= 72 ? '#10b981' : 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
              </div>
              <p className="text-[9px] text-slate-600 mt-1">{bestScore >= 72 ? '✓ Ready to certify' : `${72 - bestScore}% more to pass threshold`}</p>
            </div>
            <Link to="/skillup/ccaf/quiz"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-xl text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: '1px solid rgba(139,92,246,0.5)' }}>
              Continue <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/*━━━━ LEVEL CARDS */}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '120ms' }}>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>Curriculum</p>
          <h2 className="text-2xl font-black text-white">Four levels. One path.</h2>
        </div>

        <div className="space-y-4">
          {levels.map((lvl, idx) => {
            const Icon = lvl.icon;
            return (
              <div key={lvl.level}
                className={`rounded-2xl overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${140 + idx * 60}ms`, background: 'rgba(15,23,42,0.95)', border: `1px solid ${lvl.border}` }}>

                {/* Top accent */}
                <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${lvl.color}, transparent)` }} />

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    {/* Level badge */}
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
                        style={{ background: lvl.bg, border: `2px solid ${lvl.color}`, boxShadow: `0 0 20px -6px ${lvl.color}40` }}>
                        <span className="text-[9px] font-black uppercase" style={{ color: `${lvl.color}90` }}>{lvl.tag}</span>
                        <span className="text-sm font-black" style={{ color: lvl.color }}>{lvl.level}</span>
                      </div>
                      <Icon size={14} style={{ color: `${lvl.color}70` }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-white mb-1">{lvl.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed mb-4">{lvl.objective}</p>

                      {/* Topics grid */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {lvl.topics.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ color: lvl.color, background: lvl.bg, border: `1px solid ${lvl.border}` }}>
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Resource links */}
                      <div className="flex flex-wrap gap-2">
                        {lvl.resources.map(res => {
                          const ResIcon = res.icon;
                          return (
                            <Link key={res.href} to={res.href}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 hover:-translate-y-0.5"
                              style={{ color: lvl.color, background: `${lvl.color}10`, border: `1px solid ${lvl.border}` }}>
                              <ResIcon size={11} /> {res.label} <ArrowRight size={10} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progress check */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <CheckCircle2 size={14} style={{ color: `${lvl.color}30` }} />
                      <span className="text-[10px] text-slate-700">Level {idx + 1} of 4</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/*━━━━ BOTTOM CTA */}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '380ms' }}>
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.18) 0%,rgba(56,189,248,0.08) 100%)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: '#64748b' }}>
            {sessions.length > 0 ? 'Keep going' : 'Ready to start?'}
          </p>
          <h2 className="text-2xl font-black text-white mb-2">
            {sessions.length > 0 ? 'Back to the exam hall' : 'Start with AI 101'}
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {sessions.length > 0
              ? 'Pick up where you left off. Every session builds your readiness.'
              : 'Begin with fundamentals. The certification prep adapts to your level.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/skillup/ccaf"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-black rounded-2xl text-white transition-all hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: '1px solid rgba(139,92,246,0.55)' }}>
              <GraduationCap size={15} /> Start Exam Prep <ArrowRight size={15} />
            </Link>
            <Link to="/notes"
              className="inline-flex items-center gap-2 px-7 py-3 text-sm font-bold rounded-2xl text-slate-300 hover:text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.35)' }}>
              <FileText size={15} /> Read the Notes
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
