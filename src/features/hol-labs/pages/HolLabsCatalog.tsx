import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { loadHolLabsIndex, type HolLabsIndex, type HolLabSummary } from '@/lib/content-loader';
import { GlassCard, Badge, SectionHeader } from '@/components/ui';
import { DOMAIN_LABELS, COST_TIER_VARIANT } from '../hol-labs-constants';

export default function HolLabsCatalog() {
  const [index, setIndex] = useState<HolLabsIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const examFilter = searchParams.get('exam');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  useEffect(() => {
    loadHolLabsIndex().then(setIndex).catch((e: unknown) => setError(String(e)));
  }, []);

  const filtered: HolLabSummary[] = useMemo(() => {
    if (!index) return [];
    let labs = index.labs;
    if (domainFilter) labs = labs.filter((l) => l.domain === domainFilter);
    if (examFilter) labs = labs.filter((l) => l.relatedExamIds.includes(examFilter));
    return labs;
  }, [index, domainFilter, examFilter]);

  if (error) return <div className="text-red-400 text-sm">Failed to load labs: {error}</div>;
  if (!index) return <div className="text-slate-500 text-sm">Loading labs…</div>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="HOL Labs"
        icon={FlaskConical}
        subtitle="Guided, hands-on walkthroughs — build real skills with the Microsoft AI stack."
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDomainFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${!domainFilter ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' : 'text-slate-400 border-transparent hover:bg-slate-800/60'}`}
        >
          All domains
        </button>
        {index.domains.map((d) => (
          <button
            key={d.id}
            onClick={() => setDomainFilter(d.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${domainFilter === d.id ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' : 'text-slate-400 border-transparent hover:bg-slate-800/60'}`}
          >
            {DOMAIN_LABELS[d.id] ?? d.label} ({d.count})
          </button>
        ))}
      </div>
      {examFilter && (
        <p className="text-xs text-slate-500">Filtered to labs related to exam: {examFilter}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((lab) => (
          <Link key={lab.id} to={`/hol-labs/${lab.id}`}>
            <GlassCard className="h-full p-4 hover:border-violet-500/40 transition-all" accent="violet">
              <h3 className="text-sm font-semibold text-white mb-1">{lab.title}</h3>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge label={lab.difficulty} variant="violet" size="xs" />
                <Badge label={lab.costTier} variant={COST_TIER_VARIANT[lab.costTier]} size="xs" />
                <span className="text-[11px] text-slate-500">{lab.estimatedMinutes} min</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">No labs published yet for this filter.</p>
      )}
    </div>
  );
}
