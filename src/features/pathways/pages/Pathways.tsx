import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, TrendingUp, Brain, Zap,
  ArrowRight, Users, BookOpen, GraduationCap,
} from 'lucide-react';
import { PulsingDot } from '@/components/ui';
import { useMeta } from '@/lib/useMeta';

// ── Audience quick-pick labels ────────────────────────────────────────────────
const AUDIENCES = [
  { label: 'Teens & Students', color: '#38bdf8', track: 'safety' },
  { label: 'Finance Professionals', color: '#fbbf24', track: 'applied' },
  { label: 'Ethics & Policy Folks', color: '#a78bfa', track: 'ethics' },
  { label: 'Anyone with a job to do', color: '#10b981', track: 'productivity' },
] as const;

// ── Track definitions ─────────────────────────────────────────────────────────
const TRACKS = [
  {
    id: 'safety',
    label: 'AI Safety & Responsibility',
    audience: 'Teens 13–18',
    audienceFull: 'Built for teens & students learning to navigate AI safely',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.22)',
    icon: ShieldCheck,
    what: 'Short, jargon-free articles with real examples.',
    description:
      'Learn how AI is used in scams, deepfakes, and disinformation — and how to stay safe, spot manipulation, and be a responsible digital citizen.',
    topics: ['Scam Detection', 'Deepfakes & Disinformation', 'Digital Privacy', 'Responsible AI Use'],
    articleCount: 3,
  },
  {
    id: 'applied',
    label: 'Applied AI for Practitioners',
    audience: 'Finance & Data Professionals',
    audienceFull: 'Built for finance and data professionals who want practical AI skills',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.22)',
    icon: TrendingUp,
    what: 'Workflow-ready guides you can apply this week.',
    description:
      'Practical AI skills for financial modeling, data storytelling, scenario forecasting, and automating repetitive workflows — no data science degree required.',
    topics: ['Financial Forecasting', 'Data Storytelling', 'Report Automation', 'Scenario Modeling'],
    articleCount: 3,
  },
  {
    id: 'ethics',
    label: 'AI Ethics & Bias',
    audience: 'Students & Policy Researchers',
    audienceFull: 'Built for students and policy researchers studying AI\'s societal impact',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.22)',
    icon: Brain,
    what: 'Analytical deep-dives grounded in real cases.',
    description:
      'Understand how algorithmic bias happens, why fairness in ML is contested, and how governance frameworks like the EU AI Act shape responsible AI.',
    topics: ['Algorithmic Bias', 'Fairness in ML', 'AI Governance', 'Ethical Design'],
    articleCount: 3,
  },
  {
    id: 'productivity',
    label: 'AI Productivity',
    audience: 'Students & Professionals',
    audienceFull: 'Built for anyone who wants AI to save them hours every week',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.22)',
    icon: Zap,
    what: 'Hands-on tips and templates you can use immediately.',
    description:
      'Use AI as a force multiplier — for studying, writing, workflow automation, and prompt engineering that actually saves you hours every week.',
    topics: ['Prompt Engineering', 'AI Study Assistants', 'Workflow Automation', 'Research Acceleration'],
    articleCount: 3,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export default function Pathways() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  useMeta({
    title: 'Discovery — AI Learning Tracks | Aarya',
    description:
      'Audience-focused AI learning tracks for teens, students, finance professionals, and anyone who wants practical AI knowledge — no exams, no prerequisites.',
  });

  return (
    <div className="space-y-16 max-w-4xl mx-auto">

      {/*━━━━ HERO */}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center gap-2 mb-4">
          <PulsingDot active color="bg-sky-400" size="sm" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#38bdf8' }}>
            Discovery
          </span>
        </div>
        <h1 className="text-4xl font-black text-white leading-tight mb-3">
          AI learning for{' '}
          <span style={{ background: 'linear-gradient(100deg, #38bdf8 0%, #a78bfa 60%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            every audience.
          </span>
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-6">
          Discovery is <strong className="text-slate-300">not exam prep</strong> — it's audience-focused tracks for people who want
          clear, practical AI knowledge without prerequisites. Whether you're a teenager, a finance professional,
          a policy researcher, or just someone with a job to do — there's a track for you.
        </p>

        {/* Audience quick-pick */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] text-slate-600 self-center mr-1 font-semibold">I am a →</span>
          {AUDIENCES.map(a => (
            <Link
              key={a.track}
              to={`/discovery/${a.track}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
              style={{ color: a.color, background: `${a.color}12`, border: `1px solid ${a.color}38` }}
            >
              {a.label} <ArrowRight size={10} />
            </Link>
          ))}
        </div>
      </section>

      {/*━━━━ WHAT IS DISCOVERY? */}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '60ms' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Audience-first', desc: 'Each track is written for a specific reader — not a generic "learner".' },
            { icon: BookOpen, label: 'No prerequisites', desc: 'No coding required. No exam pressure. Read at your own pace.' },
            { icon: Zap, label: 'Practical & current', desc: 'Real examples, real tools, written by an enterprise AI architect.' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(8,15,30,0.97)', border: '1px solid rgba(71,85,105,0.18)' }}>
                <Icon size={18} className="text-slate-400 mb-3" />
                <p className="text-sm font-black text-white mb-1">{item.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/*━━━━ TRACK CARDS */}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '120ms' }}>
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: '#64748b' }}>
            4 Tracks
          </p>
          <h2 className="text-2xl font-black text-white">Pick the right track for you.</h2>
          <p className="text-sm text-slate-400 mt-1">
            Each track is a standalone collection of articles — start anywhere, finish any time.
          </p>
        </div>

        <div className="space-y-5">
          {TRACKS.map((track, idx) => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${140 + idx * 80}ms`, background: 'rgba(8,15,30,0.97)', border: '1px solid rgba(71,85,105,0.20)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${track.border}`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 48px -16px ${track.color}22`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(71,85,105,0.20)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                  (e.currentTarget as HTMLElement).style.transform = '';
                }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${track.color}, transparent 70%)` }} />
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${track.color}18 0%, transparent 70%)` }} />

                <div className="relative p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: track.bg, border: `2px solid ${track.color}`, boxShadow: `0 0 20px -6px ${track.color}40` }}>
                        <Icon size={22} style={{ color: track.color }} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* FOR: audience — most prominent element */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#475569' }}>For →</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-lg"
                          style={{ color: track.color, background: track.bg, border: `1px solid ${track.border}` }}>
                          <Users size={8} /> {track.audience}
                        </span>
                        <span className="text-[10px] text-slate-600">{track.articleCount} articles</span>
                      </div>

                      <h3 className="text-xl font-black text-white mb-1 tracking-tight">{track.label}</h3>

                      {/* One-line audience intent */}
                      <p className="text-xs font-semibold mb-3" style={{ color: `${track.color}bb` }}>
                        {track.audienceFull}
                      </p>

                      <p className="text-sm text-slate-400 leading-relaxed mb-4">{track.description}</p>

                      <p className="text-[11px] text-slate-600 mb-4">
                        <span className="font-bold text-slate-500">What you get: </span>{track.what}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {track.topics.map(t => (
                          <span key={t} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                            style={{ background: 'rgba(15,23,42,0.8)', color: '#64748b', border: '1px solid rgba(71,85,105,0.18)' }}>
                            {t}
                          </span>
                        ))}
                      </div>

                      <Link
                        to={`/discovery/${track.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${track.color}, ${track.color}cc)`, border: `1px solid ${track.border}`, boxShadow: `0 4px 16px -4px ${track.color}30` }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px -6px ${track.color}50`)}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px -4px ${track.color}30`)}
                      >
                        <BookOpen size={13} /> Browse {track.articleCount} articles <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/*━━━━ PRACTITIONER CTA — redirects engineers to the right place */}
      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: '480ms' }}>
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.18)' }}>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#7c3aed' }}>
              Are you a practitioner or engineer?
            </p>
            <h3 className="text-base font-black text-white mb-1">This isn't your section — Skill Up is.</h3>
            <p className="text-sm text-slate-400">
              The 101→310 curriculum, CCA-F exam prep, and agentic pattern deep-dives live in Skill Up.
              Discovery is for broader audiences who don't need the technical depth.
            </p>
          </div>
          <Link
            to="/skillup"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-xl text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: '1px solid rgba(139,92,246,0.45)' }}
          >
            <GraduationCap size={14} /> Go to Skill Up <ArrowRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}
