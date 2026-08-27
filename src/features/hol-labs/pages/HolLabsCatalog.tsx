import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, FlaskConical, Clock } from 'lucide-react';
import { loadHolLabsIndex, type HolLabsIndex, type HolLabSummary } from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge } from '@/components/ui';
import { DOMAIN_LABELS, DOMAIN_ACCENT, COST_TIER_VARIANT, COST_TIER_LABEL } from '../hol-labs-constants';

export default function HolLabsCatalog() {
  useMeta({
    title: 'HOL Labs · Aarya',
    description: 'Guided, hands-on lab walkthroughs for the Microsoft AI stack — Azure AI Foundry, GitHub Copilot, agentic AI, and more. Build real skills, not just read about them.',
  });

  const [index, setIndex] = useState<HolLabsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const examFilter = searchParams.get('exam');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  useEffect(() => {
    loadHolLabsIndex().then(setIndex).catch(() => setError('Could not load HOL Labs.'));
  }, []);

  const filtered: HolLabSummary[] = useMemo(() => {
    if (!index) return [];
    let labs = index.labs;
    if (domainFilter) labs = labs.filter((l) => l.domain === domainFilter);
    if (examFilter) labs = labs.filter((l) => l.relatedExamIds.includes(examFilter));
    return labs;
  }, [index, domainFilter, examFilter]);

  const freeOrLowCostPct = useMemo(() => {
    if (!index || index.labs.length === 0) return 100;
    const count = index.labs.filter((l) => l.costTier !== 'paid').length;
    return Math.round((count / index.labs.length) * 100);
  }, [index]);

  if (error) return <p className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-sm text-rose-300">{error}</p>;

  if (!index) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="h-9 w-9 rounded-xl bg-slate-800 mb-3" />
        <div className="h-8 w-64 rounded bg-slate-800 mb-3" />
        <div className="h-4 w-96 rounded bg-slate-800 mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-slate-800 bg-slate-900/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)' }}
          >
            <FlaskConical size={18} style={{ color: '#f59e0b' }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            Hands-On · Guided Labs
          </p>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.06] mb-3">
          HOL{' '}
          <span
            style={{
              background: 'linear-gradient(100deg, #f59e0b 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Labs
          </span>.
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-xl">
          Guided walkthroughs that build real skills with the Microsoft AI stack — every lab explains the problem it solves and why, not just the clicks.
        </p>

        <div className="flex flex-wrap items-center text-xs">
          {[
            { value: `${index.totalCount}`, label: index.totalCount === 1 ? 'lab' : 'labs', color: '#f59e0b' },
            { value: `${index.domains.filter((d) => d.count > 0).length}`, label: 'domains', color: '#a78bfa' },
            { value: `${freeOrLowCostPct}%`, label: 'free / low-cost', color: '#34d399' },
            { value: 'Microsoft', label: 'stack-first', color: '#38bdf8' },
          ].map(({ value, label, color }, i) => (
            <div key={label} className="flex items-center">
              {i > 0 && <span className="mx-3.5" style={{ color: 'rgba(71,85,105,0.40)' }}>|</span>}
              <span className="font-black" style={{ color }}>{value}</span>
              <span className="text-slate-600 ml-1.5">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Domain filter ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 mb-2">By Domain</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setDomainFilter(null)}
            className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150"
            style={{
              background: domainFilter === null ? 'rgba(245,158,11,0.14)' : 'rgba(15,23,42,0.60)',
              color: domainFilter === null ? '#f59e0b' : '#64748b',
              borderColor: domainFilter === null ? 'rgba(245,158,11,0.40)' : 'rgba(71,85,105,0.22)',
            }}
          >
            All
          </button>
          {index.domains.map((d) => {
            const active = domainFilter === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDomainFilter(active ? null : d.id)}
                className="px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-150"
                style={{
                  background: active ? 'rgba(167,139,250,0.14)' : 'rgba(15,23,42,0.60)',
                  color: active ? '#a78bfa' : '#64748b',
                  borderColor: active ? 'rgba(167,139,250,0.40)' : 'rgba(71,85,105,0.22)',
                }}
              >
                {DOMAIN_LABELS[d.id] ?? d.label} ({d.count})
              </button>
            );
          })}
        </div>
      </div>

      {examFilter && (
        <p className="text-xs text-slate-500 mb-4">Showing labs related to exam: <span className="text-slate-300 font-medium">{examFilter}</span></p>
      )}

      {/* ── Card grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lab) => {
          const accent = DOMAIN_ACCENT[lab.domain] ?? 'slate';
          return (
            <Link key={lab.id} to={`/hol-labs/${lab.id}`} className="block group">
              <GlassCard
                accent={accent}
                className="p-5 h-full flex flex-col transition-transform duration-300 group-hover:-translate-y-1"
                border="border-slate-700/40"
              >
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge label={DOMAIN_LABELS[lab.domain] ?? lab.domain} variant={accent} size="xs" uppercase />
                  <Badge label={lab.difficulty} variant="slate" size="xs" />
                  <Badge label={COST_TIER_LABEL[lab.costTier]} variant={COST_TIER_VARIANT[lab.costTier]} size="xs" />
                </div>

                <h3 className="text-sm font-black text-slate-100 leading-snug mb-2">{lab.title}</h3>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1">{lab.tagline}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock size={11} /> {lab.estimatedMinutes} min
                  </span>
                  <div
                    className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    style={{ color: '#64748b' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f59e0b')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    <span>Start lab</span>
                    <ArrowRight size={11} />
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-500 mt-8">
          {examFilter ? 'No labs are linked to this exam yet.' : 'No labs published yet for this filter.'}
        </p>
      )}
    </div>
  );
}
