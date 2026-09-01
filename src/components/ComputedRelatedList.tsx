import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import type { RelationshipEdge } from '@/lib/relationships';

interface ComputedRelatedListProps {
  edges: RelationshipEdge[];
  heading?: string;
}

/**
 * Renders precomputed cross-vertical relationships (public/content/
 * relationships.json, via useRelationships) — the "smart, latest-first"
 * counterpart to a page's hand-authored relation panels. Self-hides when
 * empty, which is the common case today: only HOL Labs and Use Cases carry
 * taxonomyIds so far (see IDEA-0008 Phase 2), and their tag vocabularies
 * don't overlap yet, so this legitimately renders nothing until Phase 4
 * backfills more verticals or a topic bridges the two.
 */
export default function ComputedRelatedList({ edges, heading = 'Also Related' }: ComputedRelatedListProps) {
  if (edges.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles size={12} className="text-cyan-400" /> {heading}
      </p>
      <div className="space-y-2">
        {edges.map((edge) => (
          <Link
            key={edge.id}
            to={edge.url}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-all group"
          >
            <ChevronRight size={13} className="text-cyan-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 leading-snug truncate">{edge.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {edge.why ?? edge.sharedTaxonomyIds.join(' · ')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
