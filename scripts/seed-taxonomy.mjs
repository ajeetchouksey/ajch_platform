#!/usr/bin/env node
/**
 * seed-taxonomy.mjs
 *
 * One-time (per vertical) seeder for Tier-2 taxonomy.json nodes — general
 * topics that aren't curated named frameworks (Tier 1, see
 * build-taxonomy.mjs) but are still real, reusable, comparable concepts a
 * vertical's content is tagged with.
 *
 * Default (no flags): prints candidate nodes per source for review, writes
 * nothing. Pass --merge to actually append new nodes into taxonomy.json
 * (existing ids are left untouched — this never overwrites a node a human
 * has since edited).
 *
 * Sources are a short, explicit list rather than a generic multi-vertical
 * scanner — extend the SOURCES array below when a later phase seeds another
 * vertical (blog, skillup, interviews), rather than building a plugin
 * system for verticals that aren't in scope yet.
 *
 * Usage:
 *   node scripts/seed-taxonomy.mjs              # preview candidates
 *   node scripts/seed-taxonomy.mjs --merge       # append into taxonomy.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadUsecasesIndex, loadHolLabsIndex } from './lib/content-sources.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const TAXONOMY_PATH = join(root, 'public', 'content', 'taxonomy.json');

// Hand-picked display labels for known abbreviations/product names — a
// generic slug->Title Case conversion would produce "Azure Ai Foundry"
// instead of "Azure AI Foundry". Extend as new sources are seeded.
const LABEL_OVERRIDES = {
  'azure-ai-foundry': 'Azure AI Foundry',
  'azure-openai': 'Azure OpenAI',
  'content-safety': 'Content Safety',
  'responsible-ai': 'Responsible AI',
  'prompt-flow': 'Prompt Flow',
};

function titleCase(slug) {
  return LABEL_OVERRIDES[slug] ?? slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// Each source resolves to { id, label } candidates — using each vertical's
// own already-curated vocabulary directly rather than re-deriving one, so
// there's no fuzzy alias-matching ambiguity to review here (contrast this
// with a vertical like blog, which free-texts tags and would need real
// alias curation when it's seeded in a later phase).
const SOURCES = [
  {
    vertical: 'usecases',
    describe: 'content/usecases/index.json — the canonical patterns[] catalog (already {id, label})',
    async candidates() {
      const idx = await loadUsecasesIndex();
      return (idx?.patterns ?? []).map((p) => ({ id: p.id, label: p.label }));
    },
  },
  {
    vertical: 'hol-labs',
    describe: 'content/hol-labs/index.json — labs[].tags, deduped (no canonical catalog exists for this vertical yet)',
    async candidates() {
      const idx = await loadHolLabsIndex();
      const tags = new Set();
      for (const lab of idx?.labs ?? []) {
        for (const t of lab.tags ?? []) tags.add(t);
      }
      return [...tags].sort().map((id) => ({ id, label: titleCase(id) }));
    },
  },
];

async function main() {
  const merge = process.argv.includes('--merge');

  const existing = existsSync(TAXONOMY_PATH)
    ? JSON.parse(readFileSync(TAXONOMY_PATH, 'utf-8'))
    : { schemaVersion: 1, topics: [] };
  const existingIds = new Set(existing.topics.map((t) => t.id));

  const newNodes = [];
  for (const source of SOURCES) {
    console.log(`\n${source.vertical} (${source.describe})`);
    const candidates = await source.candidates();
    for (const c of candidates) {
      if (existingIds.has(c.id)) {
        console.log(`  = ${c.id} (already in taxonomy.json)`);
        continue;
      }
      console.log(`  + ${c.id} -> "${c.label}"`);
      newNodes.push({ id: c.id, label: c.label, kind: 'concept', tier: 2, aliases: [c.id] });
      existingIds.add(c.id); // guard against the same id appearing from two sources in one run
    }
  }

  if (newNodes.length === 0) {
    console.log('\nNo new candidates — taxonomy.json already covers every source tag.');
    return;
  }

  if (!merge) {
    console.log(`\n${newNodes.length} new candidate(s) found. Re-run with --merge to append them into taxonomy.json.`);
    return;
  }

  existing.topics = [...existing.topics, ...newNodes];
  existing.generated = new Date().toISOString().slice(0, 10);
  writeFileSync(TAXONOMY_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
  console.log(`\nMerged ${newNodes.length} new Tier-2 node(s) into ${TAXONOMY_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
