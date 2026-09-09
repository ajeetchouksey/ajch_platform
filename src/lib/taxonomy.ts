// ── Taxonomy (frontend types) ────────────────────────────────────────────
// Pure TypeScript — no DOM, matching relationships.ts/glossary.ts/search.ts's
// charter. Types for public/content/taxonomy.json, generated/maintained by
// scripts/seed-taxonomy.mjs and scripts/lib/taxonomy.mjs (the build-time
// alias/mention-resolution machinery) — this file only covers the shape the
// frontend needs to read back (a taxonomyId's human-readable label), not the
// build-time resolution logic itself, which stays server-side. Runtime
// loader lives in content-loader.ts (loadTaxonomyLabels).
// ──────────────────────────────────────────────────────────────────────────

export interface TaxonomyTopic {
  id: string;
  label: string;
  kind: string;
  tier: number;
  aliases: string[];
}

/** Shape of public/content/taxonomy.json. */
export interface TaxonomyFile {
  schemaVersion: number;
  generated: string;
  topics: TaxonomyTopic[];
}

/**
 * A taxonomyId shown to a reader without its real label available (map
 * still loading, or the id predates taxonomy.json — e.g. a raw, unresolved
 * legacy tag) falls back to a humanized version of the id itself: kebab-case
 * -> Title Case, rather than the confusing raw `sharedTaxonomyIds.join(' · ')`
 * kebab-case dump readers used to see.
 */
export function humanizeTaxonomyId(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Resolves a taxonomyId to its real taxonomy.json label, falling back to a humanized id. */
export function taxonomyLabel(map: Map<string, string>, id: string): string {
  return map.get(id) ?? humanizeTaxonomyId(id);
}
