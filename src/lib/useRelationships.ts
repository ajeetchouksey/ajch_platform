import { useEffect, useState } from 'react';
import { loadRelationshipsFor } from './content-loader';
import type { RelationshipEdge } from './relationships';

/** Precomputed cross-vertical relationships for one doc id (see search.ts's id scheme, e.g. "lab/some-lab"). */
export function useRelationships(docId: string | undefined): RelationshipEdge[] {
  const [edges, setEdges] = useState<RelationshipEdge[]>([]);

  useEffect(() => {
    if (!docId) return;
    let cancelled = false;
    loadRelationshipsFor(docId)
      .then((e) => { if (!cancelled) setEdges(e); })
      .catch(() => { if (!cancelled) setEdges([]); });
    return () => { cancelled = true; };
  }, [docId]);

  return edges;
}

/**
 * Union of precomputed relationships across several doc ids, deduped by
 * target id (keeping the highest-scoring edge for a target that appears
 * under more than one source), re-sorted by score. For an exam-level page
 * (ExamHome, Quiz, Scenarios, Progress, StudyPlan) — relationships.json has
 * no whole-exam key, only one per domain (classic exams) or module (skill
 * tracks, see SkillTrackHome's own per-module ModuleRelated instead of this
 * hook — a track's modules render as separate collapsible sections, so a
 * flattened whole-track union would lose exactly the per-module relevance
 * that layout is built around). Reuses loadRelationshipsFor's cached file —
 * calling it N times costs N cheap Map lookups against one fetch, not N
 * network calls.
 */
export function useRelationshipsForIds(docIds: string[]): RelationshipEdge[] {
  const key = docIds.join(',');
  const [edges, setEdges] = useState<RelationshipEdge[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Promise.all([]) resolves to [] on its own microtask — no special-cased
    // synchronous setEdges([]) needed for the empty case, which would fire
    // during the effect's own render pass (react-hooks/set-state-in-effect).
    Promise.all(docIds.map((id) => loadRelationshipsFor(id)))
      .then((lists) => {
        if (cancelled) return;
        const byTarget = new Map<string, RelationshipEdge>();
        for (const list of lists) {
          for (const edge of list) {
            const existing = byTarget.get(edge.id);
            if (!existing || edge.score > existing.score) byTarget.set(edge.id, edge);
          }
        }
        setEdges([...byTarget.values()].sort((a, b) => b.score - a.score));
      })
      .catch(() => { if (!cancelled) setEdges([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is docIds' stable identity for this effect
  }, [key]);

  return edges;
}
