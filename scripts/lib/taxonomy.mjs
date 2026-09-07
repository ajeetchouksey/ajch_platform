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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a mention-detector for free text that names a concept inline rather
 * than tagging it structurally — e.g. a use case's techStack listing "Azure
 * AI Foundry agent framework" as a tool, where the concept is a substring of
 * a longer descriptive sentence, not the whole field value (buildAliasIndex's
 * exact-match resolve() would never match this).
 *
 * Matches each topic's label + aliases as whole words (\b-bounded) so a short
 * alias like "git" or "rag" doesn't false-positive inside "digital" or
 * "storage" — critically, \b sees no boundary inside a camelCase run, so
 * "git" also correctly does NOT match inside "GitHub".
 *
 * Restricted to MULTI-WORD phrases only (must contain a space) — verified
 * against real data that this matters, not just theoretical caution: nodes
 * like "Application", "Context", "Compliance", "Validation" exist in
 * taxonomy.json with kind: "concept" (same kind as genuinely specific nodes
 * — kind doesn't distinguish them), and are themselves ordinary English
 * words that collide constantly with unrelated prose ("application
 * guidance", "essay feedback" matched node "application" purely because the
 * word appears, nothing to do with the concept it's meant to represent). A
 * single-word taxonomy node is exactly this ambiguous; "Azure AI Foundry" or
 * "GitHub Copilot" is not. Losing single-word mention detection is an
 * acceptable, deliberate precision trade-off — those nodes are still
 * reachable via buildAliasIndex's exact-tag resolve() wherever a vertical
 * tags them directly.
 *
 * Deliberately separate from buildAliasIndex/resolve: this is precision-
 * oriented free-text scanning, not the curated tag-to-node mapping that
 * backs most of this pipeline — keep the two call sites distinguishable in
 * a diff rather than overloading one resolver for both jobs.
 */
export function buildMentionMatcher(topics) {
  const entries = topics
    .flatMap((t) => [t.label, ...(t.aliases ?? [])].map((phrase) => ({ id: t.id, phrase })))
    .filter((e) => e.phrase && e.phrase.trim().includes(' '))
    .map((e) => ({ id: e.id, re: new RegExp(`\\b${escapeRegExp(e.phrase)}\\b`, 'i') }));

  return {
    /** Returns the deduped set of node ids mentioned anywhere in `text`. */
    findMentions: (text) => {
      const hits = new Set();
      for (const { id, re } of entries) {
        if (re.test(text)) hits.add(id);
      }
      return [...hits];
    },
  };
}
