import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { loadAllUseCases, loadSourceIntel, type AnyUseCase } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge, SectionHeader } from '@/components/ui';
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
      <SectionHeader
        icon={Building2}
        iconColor="text-blue-400"
        badge="AI Use Cases"
        badgeVariant="blue"
        title="Enterprise AI Use Cases"
        subtitle="Real-world agentic AI implementations across 12 industry verticals — sourced from Stack AI's 100+ Use Cases guide."
      />

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-8 text-xs text-slate-500">
        <span>{totalCount}+ use cases</span>
        <span className="text-slate-700">·</span>
        <span>12 verticals</span>
        <span className="text-slate-700">·</span>
        <span>6 agentic patterns</span>
        <span className="text-slate-700">·</span>
        <span className="text-slate-600">Source: Stack AI</span>
      </div>

      {/* Vertical filter */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2">By Vertical</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveVertical(null)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
              activeVertical === null
                ? 'bg-slate-700 text-slate-100 border-slate-600'
                : 'text-slate-400 border-slate-700/60 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            All
          </button>
          {ALL_VERTICALS.map((v) => (
            <button
              key={v}
              onClick={() => toggle(activeVertical, v, setActiveVertical)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                activeVertical === v
                  ? 'bg-slate-700 text-slate-100 border-slate-500'
                  : 'text-slate-400 border-slate-700/60 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {VERTICAL_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern filter */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2">By Pattern</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActivePattern(null)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
              activePattern === null
                ? 'bg-slate-700 text-slate-100 border-slate-600'
                : 'text-slate-400 border-slate-700/60 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            All
          </button>
          {ALL_PATTERNS.map((p) => (
            <button
              key={p}
              onClick={() => toggle(activePattern, p, setActivePattern)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                activePattern === p
                  ? 'bg-slate-700 text-slate-100 border-slate-500'
                  : 'text-slate-400 border-slate-700/60 hover:border-slate-600 hover:text-slate-300'
              }`}
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
                <h3 className="text-sm font-semibold text-slate-100 leading-snug mb-2">
                  {uc.title}
                </h3>

                {/* Problem teaser */}
                {problem && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1">
                    {problem}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 group-hover:text-blue-400 transition-colors">
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
