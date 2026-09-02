/**
 * taxonomy.mjs
 *
 * Shared alias-resolution helper for scripts that need to map a vertical's
 * raw free-text tag onto a canonical public/content/taxonomy.json node id —
 * used by seed-taxonomy.mjs (to skip a tag that's already covered before
 * proposing it as a new node) and backfill-taxonomy-ids.mjs (to resolve a
 * messy vertical's tags, not just identity-copy an already-clean one).
 *
 * Deliberately conservative: an alias claimed by more than one node (e.g.
 * "named-framework" appears in both the degradation-ladder and
 * boring-interface Tier-1 nodes as a generic meta-tag, not a concept of its
 * own) is dropped from resolution entirely rather than arbitrarily picking
 * a winner — an ambiguous match is worse than no match, per this pipeline's
 * precision-over-recall rule.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TAXONOMY_PATH = join(__dirname, '..', '..', 'public', 'content', 'taxonomy.json');

export function loadTaxonomyTopics() {
  return JSON.parse(readFileSync(TAXONOMY_PATH, 'utf-8')).topics;
}

/**
 * Builds a case-insensitive tag -> node id resolver from a topics[] array.
 * Returns { resolve(tag): string|null, ambiguous: [[alias, [nodeIds]], ...] }.
 */
export function buildAliasIndex(topics) {
  const claims = new Map(); // lowercase alias -> Set<nodeId>
  for (const t of topics) {
    for (const claim of [t.id, ...t.aliases]) {
      const key = claim.toLowerCase();
      if (!claims.has(key)) claims.set(key, new Set());
      claims.get(key).add(t.id);
    }
  }

  const resolved = new Map();
  const ambiguous = [];
  for (const [alias, nodeIds] of claims) {
    if (nodeIds.size > 1) {
      ambiguous.push([alias, [...nodeIds]]);
      continue;
    }
    resolved.set(alias, [...nodeIds][0]);
  }

  return {
    resolve: (tag) => resolved.get(tag.toLowerCase()) ?? null,
    ambiguous,
  };
}
