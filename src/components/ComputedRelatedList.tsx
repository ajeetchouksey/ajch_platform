import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { RelationshipEdge } from '@/lib/relationships';
import { TYPE_ICON, TYPE_COLOR, TYPE_LABEL } from '@/lib/content-types';
import { loadTaxonomyLabels } from '@/lib/content-loader';
import { taxonomyLabel } from '@/lib/taxonomy';

interface ComputedRelatedListProps {
  edges: RelationshipEdge[];
  heading?: string;
}

/**
 * Renders precomputed cross-vertical relationships (public/content/
 * relationships.json, via useRelationships) — the "smart, latest-first"
 * counterpart to a page's hand-authored relation panels. Self-hides when
 * empty (a real, expected state — not every doc has a computed edge yet,
 * see IDEA-0008).
 *
 * "Related Content" is the one canonical heading — 8 of this component's 12
 * call sites already passed this exact string explicitly before it became
 * the real default; the other 4 (BlogPost's "Also Related", Tools'
 * deliberate "Sharpen Your Skills" CTA framing, HolLabDetail's un-set prop
 * silently landing on the OLD default, SkillTrackHome's genuinely-different
 * per-module "Related to {mod.title}") are each either now consistent or a
 * real, deliberate exception — not drift.
 */
export default function ComputedRelatedList({ edges, heading = 'Related Content' }: ComputedRelatedListProps) {
  const [taxonomyLabels, setTaxonomyLabels] = useState<Map<string, string> | null>(null);

  useEffect(() => {
    if (edges.length === 0) return;
    let cancelled = false;
    loadTaxonomyLabels()
      .then((m) => { if (!cancelled) setTaxonomyLabels(m); })
      .catch(() => { if (!cancelled) setTaxonomyLabels(new Map()); });
    return () => { cancelled = true; };
  }, [edges.length]);

  if (edges.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles size={12} className="text-cyan-400" /> {heading}
      </p>
      <div className="space-y-2">
        {edges.map((edge) => {
          const Icon = TYPE_ICON[edge.type];
          const color = TYPE_COLOR[edge.type];
          const sharedLabels = taxonomyLabels
            ? edge.sharedTaxonomyIds.map((id) => taxonomyLabel(taxonomyLabels, id))
            : edge.sharedTaxonomyIds;
          return (
            <Link
              key={edge.id}
              to={edge.url}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all group"
            >
              <span
                className="flex items-center gap-1 shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide"
                style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}
              >
                <Icon size={10} /> {TYPE_LABEL[edge.type]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 leading-snug truncate">{edge.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {edge.why ?? sharedLabels.join(' · ')}
                </p>
              </div>
              <ChevronRight size={13} className="text-cyan-400 mt-0.5 shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
