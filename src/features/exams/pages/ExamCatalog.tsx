import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Clock, Target, ArrowRight,
  Lock, Brain, BarChart2, Zap, BookOpen,
} from 'lucide-react';
import { loadExamRegistry } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import type { ExamConfig } from '@/types/content';

// ── Color palette ─────────────────────────────────────────────────────────────
const EXAM_PALETTE: Record<string, {
  color: string; bg: string; border: string; glow: string; btn: string;
}> = {
  violet: {
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.38)',
    glow: 'rgba(139,92,246,0.18)',
    btn: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  },
  blue: {
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.38)',
    glow: 'rgba(59,130,246,0.18)',
    btn: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  },
  amber: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.35)',
    glow: 'rgba(251,191,36,0.12)',
    btn: 'linear-gradient(135deg, #d97706, #b45309)',
  },
};
const defaultPalette = {
  color: '#94a3b8', bg: 'rgba(30,41,59,0.5)',
  border: 'rgba(71,85,105,0.25)', glow: 'transparent',
  btn: '#1e293b',
};

// ── Single exam card ──────────────────────────────────────────────────────────
function ExamCard({ exam, idx }: { exam: ExamConfig; idx: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pal = EXAM_PALETTE[exam.colorScheme] ?? defaultPalette;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05, rootMargin: '40px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onClick={() => { if (exam.available) navigate(`/skillup/${exam.id}`); }}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${exam.available ? 'cursor-pointer' : 'opacity-55 cursor-not-allowed'}`}
      style={{
        background: 'rgba(8,15,30,0.97)',
        border: '1px solid rgba(71,85,105,0.20)',
        transitionDelay: `${idx * 90}ms`,
      }}
      onMouseEnter={e => {
        if (!exam.available) return;
        (e.currentTarget as HTMLElement).style.border = `1px solid ${pal.border}`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 56px -16px ${pal.glow}`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.border = '1px solid rgba(71,85,105,0.20)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${pal.color}, transparent 70%)` }}
      />

      {/* Ambient corner glow */}
      {exam.available && (
        <div
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${pal.glow} 0%, transparent 70%)` }}
        />
      )}

      <div className="relative p-6 sm:p-8">
        {/* Top row: badge + status + pass score */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg"
            style={{ color: pal.color, background: pal.bg, border: `1px solid ${pal.border}` }}
          >
            {exam.shortTitle}
          </span>

          {exam.available ? (
            <span
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg"
              style={{ color: '#34d399', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg"
              style={{ color: '#475569', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(71,85,105,0.20)' }}
            >
              <Lock size={9} /> Coming Soon
            </span>
          )}

          <span className="ml-auto text-[11px] font-bold" style={{ color: '#475569' }}>
            {exam.passScore} to pass
          </span>
          {exam.contentLevel && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border"
              style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.35)', background: 'rgba(124,58,237,0.12)' }}>
              L{exam.contentLevel}
            </span>
          )}
        </div>

        {/* Title + description */}
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-2 transition-colors duration-200 group-hover:text-violet-100">
          {exam.title}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-2xl">{exam.description}</p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Brain size={12} style={{ color: pal.color }} />
            <span className="text-white font-bold">{exam.questions}</span>{' '}questions
          </span>
          <span className="flex items-center gap-1.5">
            <Target size={12} style={{ color: pal.color }} />
            <span className="text-white font-bold">{exam.domains.length}</span>{' '}domains
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: pal.color }} />
            {exam.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart2 size={12} style={{ color: pal.color }} />
            {exam.passThreshold}% pass threshold
          </span>
        </div>

        {/* Domain pills */}
        <div className="flex flex-wrap gap-1.5 mb-7">
          {exam.domains.map((d) => (
            <span
              key={d.id}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(15,23,42,0.8)', color: '#64748b', border: '1px solid rgba(71,85,105,0.18)' }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${d.color}`} />
              D{d.id}: {d.title}
            </span>
          ))}
        </div>

        {/* CTA row */}
        {exam.available ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/skillup/${exam.id}`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-black rounded-xl transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5 active:scale-95"
              style={{ background: pal.btn, boxShadow: `0 0 0 1px ${pal.border}` }}
            >
              <Zap size={14} />
              Start Practicing
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to={`/skillup/${exam.id}/notes`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-bold transition-colors hover:text-slate-300"
              style={{ color: '#475569' }}
            >
              <BookOpen size={12} /> Study Notes
            </Link>
          </div>
        ) : (
          <span
            className="inline-flex items-center gap-2 px-5 py-2.5 text-slate-600 text-sm font-bold rounded-xl"
            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(71,85,105,0.15)' }}
          >
            <Lock size={13} /> Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-8 animate-pulse"
      style={{ background: 'rgba(8,15,30,0.97)', border: '1px solid rgba(71,85,105,0.15)' }}
    >
      <div className="flex gap-2 mb-5">
        <div className="h-5 w-16 bg-slate-800 rounded-lg" />
        <div className="h-5 w-10 bg-slate-800 rounded-lg" />
      </div>
      <div className="h-8 bg-slate-700 rounded-lg w-3/4 mb-2" />
      <div className="h-4 bg-slate-800 rounded w-full mb-1" />
      <div className="h-4 bg-slate-800 rounded w-2/3 mb-6" />
      <div className="flex gap-4 mb-5">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-3 w-20 bg-slate-800 rounded" />)}
      </div>
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-5 w-24 bg-slate-800 rounded-full" />)}
      </div>
      <div className="h-10 w-36 bg-slate-700 rounded-xl" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExamCatalog() {
  useMeta({
    title: 'SkillUp — AI & Platform Engineering Certifications',
    description: 'Practice exams for Claude (CCA-F), GitHub Best Practices (GH-BP), and Agentic AI (AB-100). Scenario-based MCQs with instant scoring.',
  });
  const [exams, setExams] = useState<ExamConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadExamRegistry()
      .then((r) => { setExams(r.exams); setLoading(false); })
      .catch(() => setLoading(false));
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const available = exams.filter((e) => e.available);
  const coming = exams.filter((e) => !e.available);
  const totalQuestions = exams.reduce((a, e) => a + e.questions, 0);
  const totalDomains = exams.reduce((a, e) => a + e.domains.length, 0);

  return (
    <div className="space-y-10">

      {/* ── Page header ── */}
      <div
        className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Ambient orb */}
        <div
          className="absolute -top-12 -left-20 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
              style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              AI Certification Prep
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.06] tracking-tight mb-3">
            Skill Up.{' '}
            <span style={{
              background: 'linear-gradient(100deg, #a78bfa 0%, #38bdf8 55%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Get Certified.
            </span>
          </h1>
          <p className="text-base text-slate-400 max-w-xl leading-relaxed">
            Scenario-based MCQs, deep study notes, and real-world situations — built by a practitioner, for practitioners who ship.
          </p>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {!loading && exams.length > 0 && (
        <div
          className={`rounded-2xl px-6 py-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(8,15,30,0.97) 100%)',
            border: '1px solid rgba(139,92,246,0.14)',
            transitionDelay: '80ms',
          }}
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Live · Free forever
              </span>
            </div>
            {[
              { value: available.length,   label: 'Exams live',          color: 'text-violet-400'  },
              { value: totalQuestions,      label: 'Practice questions',  color: 'text-blue-400'    },
              { value: totalDomains,        label: 'Domains covered',     color: 'text-emerald-400' },
            ].map(({ value, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className={`text-xl font-black ${color}`}>{value}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── Available exams ── */}
      {!loading && available.length > 0 && (
        <div className="space-y-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <GraduationCap size={12} className="text-violet-400" />
            Available Now
          </p>
          <div className="space-y-5">
            {available.map((exam, idx) => (
              <ExamCard key={exam.id} exam={exam} idx={idx} />
            ))}
          </div>
        </div>
      )}

      {/* ── Coming soon ── */}
      {!loading && coming.length > 0 && (
        <div className="space-y-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <Lock size={12} className="text-slate-600" />
            Coming Soon
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coming.map((exam, idx) => (
              <ExamCard key={exam.id} exam={exam} idx={available.length + idx} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && exams.length === 0 && (
        <div className="text-center py-20">
          <GraduationCap size={40} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-500 text-sm">Could not load exam catalog. Check your connection.</p>
        </div>
      )}
    </div>
  );
}