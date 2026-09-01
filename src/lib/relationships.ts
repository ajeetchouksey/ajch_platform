// ── Cross-Vertical Relationship Scoring ─────────────────────────────────────
// Pure TypeScript — no DOM, no React, no external deps (see search.ts's
// header for the same rationale). This is the reference implementation and
// the thing scripts/build-content-intelligence.mjs's scorer is ported from
// and tested against — CI pins Node 22 without --experimental-strip-types,
// so that Node script can't import this .ts file directly and reimplements
// the same formula in plain JS. If you change the formula here, update the
// port there too (search for "relationships.ts" in that file).
// ──────────────────────────────────────────────────────────────────────────

import type { SearchDocType } from './search';

export interface RelationshipDoc {
  id: string;           // e.g. "lab/deploy-first-prompt-flow-azure-ai-foundry"
  type: SearchDocType;
  title: string;
  url: string;
  taxonomyIds: string[];
  updatedAt?: string;    // ISO date; absent docs get neutral (no) recency decay
}

export interface RelationshipEdge {
  id: string;
  type: SearchDocType;
  title: string;
  url: string;
  score: number;
  sharedTaxonomyIds: string[];
  why: string | null;   // merged in from a hand-authored relation, if one exists for this exact pair
}

const RECENCY_HALF_LIFE_DAYS = 90;

function recencyWeight(updatedAt: string | undefined, now: number): number {
  if (!updatedAt) return 1; // no date on record — neutral, don't penalize
  const days = (now - new Date(updatedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(days) || days < 0) return 1; // bad/future date — don't let it dominate scoring
  return Math.pow(0.5, days / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Score every cross-type doc pair by taxonomyIds overlap, weighted by the
 * target's recency. Same-type pairs are skipped — within-vertical relations
 * (e.g. lab-to-lab "prerequisite") are a hand-authored, directional concept
 * (HolLabRelatedLab.relation) that doesn't fit this symmetric topic-overlap
 * model, and stay as their own hand-authored field, not a computed edge.
 *
 * `whyLookup`, if given, is consulted as `whyLookup(sourceId, targetId)` for
 * every edge about to be emitted — return a non-null string to have it
 * merged onto that edge's `why`. This is enrichment only: a hand-authored
 * `why` never creates an edge that didn't already score above zero, and
 * never changes the score/ranking, only annotates it.
 */
export function computeRelationshipEdges(
  docs: RelationshipDoc[],
  options: {
    tier1Ids: Set<string>;
    now?: number;
    maxEdgesPerDoc?: number;
    whyLookup?: (sourceId: string, targetId: string) => string | null;
  }
): Record<string, RelationshipEdge[]> {
  const now = options.now ?? Date.now();
  const maxEdges = options.maxEdgesPerDoc ?? 10;
  const whyLookup = options.whyLookup ?? (() => null);

  const participants = docs.filter((d) => d.taxonomyIds.length > 0);
  const edges: Record<string, RelationshipEdge[]> = {};
  const push = (from: RelationshipDoc, to: RelationshipDoc, score: number, shared: string[]) => {
    (edges[from.id] ??= []).push({
      id: to.id,
      type: to.type,
      title: to.title,
      url: to.url,
      score,
      sharedTaxonomyIds: shared,
      why: whyLookup(from.id, to.id),
    });
  };

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const a = participants[i];
      const b = participants[j];
      if (a.type === b.type) continue;

      const shared = a.taxonomyIds.filter((id) => b.taxonomyIds.includes(id));
      if (shared.length === 0) continue; // precision over recall — no substring/fuzzy fallback

      const tierBonus = shared.some((id) => options.tier1Ids.has(id)) ? 2 : 0;
      const base = shared.length * 3 + tierBonus;

      push(a, b, base * recencyWeight(b.updatedAt, now), shared);
      push(b, a, base * recencyWeight(a.updatedAt, now), shared);
    }
  }

  for (const id of Object.keys(edges)) {
    edges[id].sort((x, y) => y.score - x.score);
    if (edges[id].length > maxEdges) edges[id] = edges[id].slice(0, maxEdges);
  }
  return edges;
}

/** Shape of public/content/relationships.json. Runtime loader lives in
 * content-loader.ts (loadRelationshipsFor), alongside stats.json's loader —
 * this file stays fetch/DOM-free, matching search.ts's charter. */
export interface RelationshipsFile {
  schemaVersion: number;
  generated: string;
  edges: Record<string, RelationshipEdge[]>;
}
