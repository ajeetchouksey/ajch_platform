#!/usr/bin/env node
/**
 * backfill-taxonomy-ids.mjs
 *
 * One-time (per vertical) backfill of `taxonomyIds` onto already-published
 * content, for verticals whose existing tag/pattern vocabulary is already
 * clean and kebab-case (registered as Tier-2 taxonomy.json nodes by
 * scripts/seed-taxonomy.mjs first — run that before this). For those
 * verticals taxonomyIds is currently an identity copy of the existing
 * tags/patterns field; this script's real job is validating every id
 * against taxonomy.json (catching a typo/rename before it ships) and
 * writing the field everywhere the schema now expects it (both the
 * per-item files AND their index.json summary entries, so reverse-link
 * lookups never need an N+1 fetch).
 *
 * Operates directly on a target repo checkout passed via --dir — this repo
 * (ajch_platform) doesn't hold promoted verticals' raw content anymore.
 *
 * Usage:
 *   node scripts/backfill-taxonomy-ids.mjs --vertical hol-labs  --dir ../ajch_hol_labs
 *   node scripts/backfill-taxonomy-ids.mjs --vertical usecases  --dir ../ajch_ai_usecases
 *
 * Default is dry-run (prints what would change). Pass --write to apply.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TAXONOMY_PATH = join(__dirname, '..', 'public', 'content', 'taxonomy.json');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function loadKnownIds() {
  const taxonomy = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf-8'));
  return new Set(taxonomy.topics.map((t) => t.id));
}

function checkKnown(ids, knownIds, context) {
  const unknown = ids.filter((id) => !knownIds.has(id));
  if (unknown.length > 0) {
    console.warn(`  ⚠ ${context}: not in taxonomy.json, skipping: ${unknown.join(', ')} (run seed-taxonomy.mjs first if these are legitimate new topics)`);
  }
  return ids.filter((id) => knownIds.has(id));
}

function backfillHolLabs(dir, knownIds, write) {
  const labsDir = join(dir, 'content', 'hol-labs', 'labs');
  const indexPath = join(dir, 'content', 'hol-labs', 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  let changed = 0;

  for (const file of readdirSync(labsDir).filter((f) => f.endsWith('.json'))) {
    const path = join(labsDir, file);
    const lab = JSON.parse(readFileSync(path, 'utf-8'));
    const taxonomyIds = checkKnown(lab.tags ?? [], knownIds, `${file}.tags`);
    console.log(`  ${lab.id}: tags=[${(lab.tags ?? []).join(', ')}] -> taxonomyIds=[${taxonomyIds.join(', ')}]`);
    if (write) {
      lab.taxonomyIds = taxonomyIds;
      writeFileSync(path, JSON.stringify(lab, null, 2) + '\n', 'utf-8');
      const summary = index.labs.find((l) => l.id === lab.id);
      if (summary) summary.taxonomyIds = taxonomyIds;
    }
    changed++;
  }

  if (write) {
    writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');
  }
  return changed;
}

function backfillUseCases(dir, knownIds, write) {
  const sourceIntelPath = join(dir, 'content', 'usecases', '_source-intel.json');
  const casesDir = join(dir, 'content', 'usecases', 'cases');
  const sourceIntel = JSON.parse(readFileSync(sourceIntelPath, 'utf-8'));
  let changed = 0;

  for (const list of [sourceIntel.featuredUseCases, sourceIntel.catalogUseCases]) {
    for (const item of list ?? []) {
      const taxonomyIds = checkKnown(item.patterns ?? [], knownIds, `${item.id}.patterns`);
      console.log(`  ${item.id}: patterns=[${(item.patterns ?? []).join(', ')}] -> taxonomyIds=[${taxonomyIds.join(', ')}]`);
      if (write) item.taxonomyIds = taxonomyIds;
      changed++;
    }
  }

  if (write) {
    writeFileSync(sourceIntelPath, JSON.stringify(sourceIntel, null, 2) + '\n', 'utf-8');
  }

  // Individual case files (cases/*.json) are a separate, richer detail copy
  // for a subset of use cases (see content-loader.ts's loadUseCaseById) —
  // must be updated independently, not derived from _source-intel.json.
  if (existsSync(casesDir)) {
    for (const file of readdirSync(casesDir).filter((f) => f.endsWith('.json'))) {
      const path = join(casesDir, file);
      const item = JSON.parse(readFileSync(path, 'utf-8'));
      const taxonomyIds = checkKnown(item.patterns ?? [], knownIds, `cases/${file}.patterns`);
      if (write) {
        item.taxonomyIds = taxonomyIds;
        writeFileSync(path, JSON.stringify(item, null, 2) + '\n', 'utf-8');
      }
    }
  }

  return changed;
}

function main() {
  const vertical = arg('vertical');
  const dir = arg('dir');
  const write = process.argv.includes('--write');

  if (!vertical || !dir) {
    console.error('Usage: node scripts/backfill-taxonomy-ids.mjs --vertical <hol-labs|usecases> --dir <path> [--write]');
    process.exit(1);
  }
  if (!existsSync(dir)) {
    console.error(`✗ Directory not found: ${dir}`);
    process.exit(1);
  }

  const knownIds = loadKnownIds();
  console.log(`${write ? 'Writing' : 'Dry run (pass --write to apply)'} — ${vertical} at ${dir}\n`);

  let changed;
  if (vertical === 'hol-labs') {
    changed = backfillHolLabs(dir, knownIds, write);
  } else if (vertical === 'usecases') {
    changed = backfillUseCases(dir, knownIds, write);
  } else {
    console.error(`✗ Unknown vertical: ${vertical} (expected hol-labs or usecases)`);
    process.exit(1);
  }

  console.log(`\n${changed} item(s) ${write ? 'updated' : 'would be updated'}.`);
}

main();
