import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { loadAllUseCases, loadSourceIntel, type AnyUseCase } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge } from '@/components/ui';
import {
  VERTICAL_LABEL,
  VERTICAL_ACCENT,
  PATTERN_LABEL,
  PATTERN_BADGE,
  ALL_PATTERNS,
  ALL_VERTICALS,
} from '../usecases-constants';

// ─── Component ───────────────────────────────────────────────────────────────

export default function UseCasesCatalog() {
  useMeta({
    title: 'AI Use Cases · Aarya',
    description:
      'Browse 100+ enterprise AI agent use cases across 12 verticals — Insurance, Banking, Government, Legal, and more. Filter by agentic pattern to find real-world implementations.',
  });

  const [useCases, setUseCases] = useState<AnyUseCase[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [activeVertical, setActiveVertical] = useState<string | null>(null);
  const [activePattern, setActivePattern] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadAllUseCases(), loadSourceIntel()])
      .then(([cases, intel]) => {
        setUseCases(cases);
        setTotalCount(intel.verticals.reduce((s, v) => s + v.useCaseCount, 0));
      })
      .catch(() => setError('Could not load use cases.'));
  }, []);

  const filtered = useMemo(() => {
    return useCases.filter((u) => {
      if (activeVertical && u.vertical !== activeVertical) return false;
      if (activePattern && !u.patterns.includes(activePattern)) return false;
      return true;
    });
  }, [useCases, activeVertical, activePattern]);

  function toggle<T>(current: T | null, val: T, set: (v: T | null) => void) {
    set(current === val ? null : val);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-8">
        {/* Icon + eyebrow */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.28)' }}>
            <Building2 size={18} style={{ color: '#38bdf8' }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            Enterprise · AI Use Cases
          </p>
        </div>

        {/* Title with gradient accent */}
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.06] mb-3">
          Enterprise{' '}
          <span style={{ background: 'linear-gradient(100deg, #38bdf8 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            AI Use Cases
          </span>.
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-xl">
          Real-world agentic AI implementations across 12 industry verticals — sourced from Stack AI's 100+ Use Cases guide.
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap items-center text-xs">
          {[
            { value: `${totalCount}+`, label: 'use cases',       color: '#38bdf8' },
            { value: '12',            label: 'verticals',        color: '#a78bfa' },
            { value: '6',             label: 'agentic patterns', color: '#34d399' },
            { value: 'Stack AI',      label: 'source',           color: '#f59e0b' },
          ].map(({ value, label, color }, i) => (
            <div key={label} className="flex items-center">
              {i > 0 && <span className="mx-3.5" style={{ color: 'rgba(71,85,105,0.40)' }}>|</span>}
              <span className="font-black" style={{ color }}>{value}</span>
              <span className="text-slate-600 ml-1.5">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vertical filter ───────────────────────────────────────────────── */}
      <div className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 mb-2">By Vertical</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveVertical(null)}
            className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150"
            style={{
              background: activeVertical === null ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.60)',
              color: activeVertical === null ? '#38bdf8' : '#64748b',
              borderColor: activeVertical === null ? 'rgba(56,189,248,0.40)' : 'rgba(71,85,105,0.22)',
            }}
          >
            All
          </button>
          {ALL_VERTICALS.map((v) => (
            <button
              key={v}
              onClick={() => toggle(activeVertical, v, setActiveVertical)}
              className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150"
              style={{
                background: activeVertical === v ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.60)',
                color: activeVertical === v ? '#38bdf8' : '#64748b',
                borderColor: activeVertical === v ? 'rgba(56,189,248,0.40)' : 'rgba(71,85,105,0.22)',
              }}
            >
              {VERTICAL_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pattern filter ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 mb-2">By Pattern</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActivePattern(null)}
            className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150"
            style={{
              background: activePattern === null ? 'rgba(167,139,250,0.14)' : 'rgba(15,23,42,0.60)',
              color: activePattern === null ? '#a78bfa' : '#64748b',
              borderColor: activePattern === null ? 'rgba(167,139,250,0.40)' : 'rgba(71,85,105,0.22)',
            }}
          >
            All
          </button>
          {ALL_PATTERNS.map((p) => (
            <button
              key={p}
              onClick={() => toggle(activePattern, p, setActivePattern)}
              className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150"
              style={{
                background: activePattern === p ? 'rgba(167,139,250,0.14)' : 'rgba(15,23,42,0.60)',
                color: activePattern === p ? '#a78bfa' : '#64748b',
                borderColor: activePattern === p ? 'rgba(167,139,250,0.40)' : 'rgba(71,85,105,0.22)',
              }}
            >
              {PATTERN_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-rose-300 mb-6">{error}</p>}

      {/* Results count */}
      {(activeVertical || activePattern) && (
        <p className="text-xs text-slate-500 mb-4">
          Showing {filtered.length} of {useCases.length} use cases
        </p>
      )}

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((uc) => {
          const accent = VERTICAL_ACCENT[uc.vertical] ?? 'slate';
          const problem = 'problem' in uc ? (uc as { problem: string }).problem : '';
          return (
            <Link key={uc.id} to={`/usecases/${uc.id}`} className="block group">
              <GlassCard
                accent={accent}
                className="p-5 h-full flex flex-col transition-transform duration-300 group-hover:-translate-y-1"
                border="border-slate-700/40"
              >
                {/* Vertical + pattern badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge
                    label={VERTICAL_LABEL[uc.vertical] ?? uc.vertical}
                    variant={accent}
                    size="xs"
                    uppercase
                  />
                  {uc.patterns.slice(0, 1).map((p) => (
                    <Badge
                      key={p}
                      label={PATTERN_LABEL[p] ?? p}
                      variant={PATTERN_BADGE[p] ?? 'slate'}
                      size="xs"
                    />
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-sm font-black text-slate-100 leading-snug mb-2">
                  {uc.title}
                </h3>

                {/* Problem teaser */}
                {problem && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1">
                    {problem}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  style={{ color: '#64748b' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                >
                  <span>View details</span>
                  <ArrowRight size={11} />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && !error && (
        <p className="text-sm text-slate-500 mt-8">No use cases match the selected filters.</p>
      )}

      {/* Source attribution */}
      <p className="mt-12 text-xs text-slate-600 text-center">
        Based on{' '}
        <span className="text-slate-500">
          Stack AI — AI Agents: 100+ Use Cases Transforming Enterprises
        </span>
      </p>
    </div>
  );
}
