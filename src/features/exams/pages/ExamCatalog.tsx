import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap, Clock, Target, ArrowRight,
  Lock, Brain, BarChart2, Zap, BookOpen, Search, X,
} from 'lucide-react';
import { loadExamRegistry } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import PageViewsBadge from '@/components/PageViewsBadge';
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

// ── Provider inference ──────────────────────────────────────────────────
function deriveProvider(exam: ExamConfig): string {
  const id = exam.id.toLowerCase();
  if (id.startsWith('gh')) return 'GitHub';
  if (id.startsWith('ab')) return 'Microsoft';
  if (id.startsWith('cca')) return 'Anthropic';
  if (id.startsWith('aws')) return 'AWS';
  if (id.startsWith('gcp')) return 'Google';
  const hay = `${exam.title} ${exam.description}`.toLowerCase();
  if (/\bgithub\b|copilot/.test(hay)) return 'GitHub';
  if (/\bazure\b|microsoft/.test(hay)) return 'Microsoft';
  if (/\bclaude\b|anthropic/.test(hay)) return 'Anthropic';
  if (/\baws\b|amazon/.test(hay)) return 'AWS';
  if (/\bgoogle\b|gcp/.test(hay)) return 'Google';
  return 'Other';
}

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
          <PageViewsBadge path={`/skillup/${exam.id}`} />
        </div>

        {/* Domain pills */}
        <div className="flex flex-wrap gap-1.5 mb-7">
          {exam.domains.slice(0, 4).map((d) => (
            <span
              key={d.id}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(15,23,42,0.8)', color: '#64748b', border: '1px solid rgba(71,85,105,0.18)' }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${d.color}`} />
              D{d.id}: {d.title}
            </span>
          ))}
          {exam.domains.length > 4 && (
            <span
              className="flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold"
              style={{ background: 'rgba(15,23,42,0.8)', color: '#94a3b8', border: '1px solid rgba(71,85,105,0.18)' }}
            >
              +{exam.domains.length - 4} more
            </span>
          )}
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

// ── Filter chip ────────────────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap"
      style={
        active
          ? { color: '#a78bfa', background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.40)' }
          : { color: '#64748b', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(71,85,105,0.20)' }
      }
    >
      {children}
    </button>
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

  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const provider = searchParams.get('provider') ?? '';
  const level = searchParams.get('level') ?? '';
  const status = searchParams.get('status') ?? '';
  const sort = searchParams.get('sort') ?? 'recommended';
  const filtersActive = Boolean(q || provider || level || status || sort !== 'recommended');

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const toggleParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (searchParams.get(key) === value) next.delete(key); else next.set(key, value);
    setSearchParams(next, { replace: true });
  };
  const clearFilters = () => setSearchParams(new URLSearchParams(), { replace: true });

  const available = exams.filter((e) => e.available);
  const coming = exams.filter((e) => !e.available);
  const totalQuestions = exams.reduce((a, e) => a + e.questions, 0);
  const totalDomains = exams.reduce((a, e) => a + e.domains.length, 0);

  const providers = useMemo(
    () => Array.from(new Set(exams.map(deriveProvider))).sort(),
    [exams],
  );
  const levels = useMemo(
    () => Array.from(new Set(exams.map((e) => e.contentLevel).filter(Boolean) as string[])).sort(),
    [exams],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = exams.filter((e) => {
      if (provider && deriveProvider(e) !== provider) return false;
      if (level && e.contentLevel !== level) return false;
      if (status === 'live' && !e.available) return false;
      if (status === 'soon' && e.available) return false;
      if (needle) {
        const hay = `${e.title} ${e.shortTitle} ${e.description} ${e.domains.map((d) => d.title).join(' ')}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === 'questions') return b.questions - a.questions;
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (a.available !== b.available) return a.available ? -1 : 1;
      return b.questions - a.questions;
    });
  }, [exams, q, provider, level, status, sort]);

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

      {/* ── Discovery toolbar ── */}
      {!loading && exams.length > 0 && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search certifications, domains…"
              className="w-full pl-9 pr-9 py-2.5 text-sm text-white rounded-xl outline-none transition-colors focus:border-violet-500/50"
              style={{ background: 'rgba(8,15,30,0.97)', border: '1px solid rgba(71,85,105,0.25)' }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setParam('q', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Chips + sort */}
          <div className="flex flex-wrap items-center gap-2">
            {providers.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600 mr-0.5">Provider</span>
                {providers.map((p) => (
                  <Chip key={p} active={provider === p} onClick={() => toggleParam('provider', p)}>{p}</Chip>
                ))}
              </div>
            )}

            {levels.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600 mr-0.5 ml-2">Level</span>
                {levels.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => toggleParam('level', l)}>L{l}</Chip>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600 mr-0.5 ml-2">Status</span>
              <Chip active={status === 'live'} onClick={() => toggleParam('status', 'live')}>Live</Chip>
              <Chip active={status === 'soon'} onClick={() => toggleParam('status', 'soon')}>Coming soon</Chip>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">Sort</span>
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value === 'recommended' ? '' : e.target.value)}
                className="text-[11px] font-bold text-slate-300 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                style={{ background: 'rgba(8,15,30,0.97)', border: '1px solid rgba(71,85,105,0.25)' }}
              >
                <option value="recommended">Recommended</option>
                <option value="questions">Most questions</option>
                <option value="az">A–Z</option>
              </select>
            </div>
          </div>

          {/* Result count + clear */}
          {filtersActive && (
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>
                Showing <span className="text-white font-bold">{filtered.length}</span> of{' '}
                <span className="text-white font-bold">{exams.length}</span> certifications
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 font-bold text-violet-400 hover:text-violet-300 transition-colors"
              >
                <X size={11} /> Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── Filtered results ── */}
      {!loading && filtersActive && (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filtered.map((exam, idx) => (
              <ExamCard key={exam.id} exam={exam} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search size={36} className="mx-auto mb-4 text-slate-700" />
            <p className="text-slate-400 text-sm mb-2">No certifications match your filters.</p>
            <button type="button" onClick={clearFilters} className="text-violet-400 text-xs font-bold hover:text-violet-300">
              Clear all filters
            </button>
          </div>
        )
      )}

      {/* ── Available exams (curated) ── */}
      {!loading && !filtersActive && available.length > 0 && (
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

      {/* ── Coming soon (curated) ── */}
      {!loading && !filtersActive && coming.length > 0 && (
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