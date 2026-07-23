import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, X, ArrowLeft, ArrowRight, Filter } from 'lucide-react';
import {
  loadInterviewPack, loadResolvedPackItems, loadInterviewCompetencies,
  type InterviewPack as Pack, type ResolvedInterviewItem, type InterviewCompetency,
} from '@/lib/content-loader';
import { useMeta } from '@/lib/useMeta';
import { GlassCard, Badge, type BadgeVariant } from '@/components/ui';

const TYPE_VARIANT: Record<string, BadgeVariant> = {
  technical: 'blue',
  behavioral: 'emerald',
  'system-design': 'amber',
};
const DIFF_VARIANT: Record<string, BadgeVariant> = {
  mid: 'slate',
  senior: 'violet',
  principal: 'purple',
};

function tokenMatch(item: ResolvedInterviewItem, q: string): boolean {
  if (!q) return true;
  const hay = [
    item.question,
    item.detailedAnswer?.summary ?? '',
    ...(item.tags ?? []),
    item.competency,
  ].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((t) => hay.includes(t));
}

export default function InterviewPack() {
  const { roleId = '' } = useParams<{ roleId: string }>();

  const [pack, setPack] = useState<Pack | null>(null);
  const [items, setItems] = useState<ResolvedInterviewItem[]>([]);
  const [competencies, setCompetencies] = useState<InterviewCompetency[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Facets
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<string | null>(null);
  const [compFilter, setCompFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useMeta({
    title: pack ? `${pack.title} · Interview Prep` : 'Interview Prep',
    description: pack ? `Interview prep pack for ${pack.title} (${pack.seniority}).` : undefined,
  });

  useEffect(() => {
    if (!roleId) return;
    Promise.all([
      loadInterviewPack(roleId),
      loadResolvedPackItems(roleId),
      loadInterviewCompetencies(),
    ])
      .then(([p, its, comps]) => { setPack(p); setItems(its); setCompetencies(comps); })
      .catch(() => setError('Could not load this interview pack.'));
  }, [roleId]);

  const compTitle = useMemo(() => {
    const m = new Map(competencies.map((c) => [c.id, c.title]));
    return (id: string) => m.get(id) ?? id;
  }, [competencies]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => (i.tags ?? []).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [items]);

  const filtered = useMemo(() => items.filter((i) =>
    tokenMatch(i, query) &&
    (!typeFilter || i.type === typeFilter) &&
    (!diffFilter || i.difficulty === diffFilter) &&
    (!compFilter || i.competency === compFilter) &&
    (!tagFilter || (i.tags ?? []).includes(tagFilter)),
  ), [items, query, typeFilter, diffFilter, compFilter, tagFilter]);

  const hasFilter = query || typeFilter || diffFilter || compFilter || tagFilter;
  const clearAll = () => {
    setQuery(''); setTypeFilter(null); setDiffFilter(null); setCompFilter(null); setTagFilter(null);
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-rose-300">{error}</p>
        <Link to="/interview" className="mt-4 inline-flex items-center gap-1 text-sm text-violet-300">
          <ArrowLeft size={14} /> Back to Interview Prep
        </Link>
      </div>
    );
  }

  const weights = pack ? Object.entries(pack.competencyWeights).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/interview" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mb-6">
        <ArrowLeft size={13} /> Interview Prep
      </Link>

      {pack && (
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">{pack.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
            <Badge label={pack.seniority} variant="violet" size="xs" />
            {pack.experience && <Badge label={pack.experience} variant="slate" size="xs" />}
            {pack.location && <Badge label={pack.location} variant="slate" size="xs" />}
          </div>
        </header>
      )}

      {/* Industry context */}
      {pack?.industry && (
        <GlassCard accent="violet" className="p-5 mb-8" border="border-violet-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Badge label="Industry context" variant="violet" size="xs" uppercase />
            <span className="text-sm font-semibold text-slate-200">{pack.industry.label}</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{pack.industry.summary}</p>
          {pack.industry.focusAreas?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pack.industry.focusAreas.map((f) => (
                <Badge key={f} label={f} variant="slate" size="xs" />
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Competency weights */}
      {weights.length > 0 && (
        <GlassCard accent="violet" className="p-5 mb-8" border="border-slate-700/40">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Competency focus
          </h2>
          <div className="space-y-2">
            {weights.map(([id, w]) => (
              <button
                key={id}
                onClick={() => setCompFilter(compFilter === id ? null : id)}
                className="w-full text-left group"
                title="Filter by this competency"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={compFilter === id ? 'text-violet-300' : 'text-slate-300'}>
                    {compTitle(id)}
                  </span>
                  <span className="text-slate-500">{w}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(71,85,105,0.25)' }}>
                  <div className="h-full rounded-full" style={{ width: `${w}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Faceted search */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(15,17,23,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword, tag, or competency…"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            spellCheck={false}
          />
          {hasFilter && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
            <Filter size={11} /> Type
          </span>
          {['technical', 'behavioral', 'system-design'].map((t) => (
            <FacetChip key={t} label={t} active={typeFilter === t} variant={TYPE_VARIANT[t]}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)} />
          ))}
          <span className="mx-1 h-3 w-px bg-slate-700" />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Level</span>
          {['mid', 'senior', 'principal'].map((d) => (
            <FacetChip key={d} label={d} active={diffFilter === d} variant={DIFF_VARIANT[d]}
              onClick={() => setDiffFilter(diffFilter === d ? null : d)} />
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <FacetChip key={tag} label={`#${tag}`} active={tagFilter === tag} variant="slate"
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)} />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-4">
        {filtered.length} of {items.length} question{items.length === 1 ? '' : 's'}
      </p>

      {/* Question list */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <Link key={item.id} to={`/interview/q/${item.id}`} className="block group">
            <GlassCard className="p-5 transition-transform duration-200 group-hover:-translate-y-0.5" border="border-slate-700/40">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge label={item.type} variant={TYPE_VARIANT[item.type] ?? 'slate'} size="xs" uppercase />
                <Badge label={item.difficulty} variant={DIFF_VARIANT[item.difficulty] ?? 'slate'} size="xs" />
                <span className="text-[10px] text-slate-500">{compTitle(item.competency)}</span>
                {item.addendum && <Badge label="+ role delta" variant="amber" size="xs" />}
              </div>
              <h3 className="text-sm font-medium text-slate-100 leading-snug group-hover:text-violet-200 transition-colors">
                {item.question}
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
                {item.detailedAnswer?.summary}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300 group-hover:gap-2 transition-all">
                Read detailed answer <ArrowRight size={12} />
              </div>
            </GlassCard>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 py-8 text-center">No questions match these filters.</p>
        )}
      </div>
    </div>
  );
}

function FacetChip({ label, active, variant, onClick }: {
  label: string; active: boolean; variant: BadgeVariant; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="transition-transform active:scale-95">
      <Badge
        label={label}
        variant={active ? variant : 'slate'}
        size="xs"
        className={active ? 'ring-1 ring-violet-400/50' : 'opacity-70 hover:opacity-100'}
      />
    </button>
  );
}
