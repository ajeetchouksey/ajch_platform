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
