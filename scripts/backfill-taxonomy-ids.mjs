#!/usr/bin/env node
/**
 * backfill-taxonomy-ids.mjs
 *
 * One-time (per vertical) backfill of `taxonomyIds` onto already-published
 * content. Two modes, depending on how clean the vertical's existing tag
 * vocabulary already is:
 *
 * - IDENTITY (hol-labs, usecases): tags/patterns are already kebab-case and
 *   registered as taxonomy.json nodes by scripts/seed-taxonomy.mjs — this
 *   script just validates every id against taxonomy.json (catching a typo/
 *   rename before it ships) and copies it through as taxonomyIds.
 * - ALIAS-RESOLVED (blog, interviews): tags are free text and often mean an
 *   already-registered concept under a different string (e.g. a blog post
 *   tagged "resilience" means the degradation-ladder node) — resolved via
 *   scripts/lib/taxonomy.mjs's buildAliasIndex() instead of copied as-is.
 *   An unresolvable tag is dropped, not invented as a new node (that's
 *   seed-taxonomy.mjs's job, run before this).
 *
 * Writes both the per-item files AND their index.json summary entries where
 * one exists, so reverse-link lookups never need an N+1 fetch.
 *
 * Operates directly on a target repo checkout passed via --dir for a
 * promoted vertical (this repo doesn't hold that raw content anymore).
 * interviews is unpromoted and always local, so --dir defaults to this
 * repo's own root for it.
 *
 * Usage:
 *   node scripts/backfill-taxonomy-ids.mjs --vertical hol-labs    --dir ../ajch_hol_labs
 *   node scripts/backfill-taxonomy-ids.mjs --vertical usecases    --dir ../ajch_ai_usecases
 *   node scripts/backfill-taxonomy-ids.mjs --vertical blog        --dir ../ajch_aaryaai_blogs
 *   node scripts/backfill-taxonomy-ids.mjs --vertical interviews
 *
 * Default is dry-run (prints what would change). Pass --write to apply.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadTaxonomyTopics, buildAliasIndex } from './lib/taxonomy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function loadKnownIds() {
  return new Set(loadTaxonomyTopics().map((t) => t.id));
}

function checkKnown(ids, knownIds, context) {
  const unknown = ids.filter((id) => !knownIds.has(id));
  if (unknown.length > 0) {
    console.warn(`  ⚠ ${context}: not in taxonomy.json, skipping: ${unknown.join(', ')} (run seed-taxonomy.mjs first if these are legitimate new topics)`);
  }
  return ids.filter((id) => knownIds.has(id));
}

// Alias-resolve a raw tag list into deduped taxonomy ids — multiple raw tags
// can resolve to the same node (e.g. "resilience" and "fallback-strategy"
// both mean degradation-ladder), so this can legitimately return fewer ids
// than input tags. Unresolvable tags are silently dropped (reported once
// in aggregate by the caller instead of per-item, since an unresolved
// legacy blog tag like "70-533" is expected, not an error to flag per post).
function resolveViaAlias(tags, resolve, unresolvedSink) {
  const ids = new Set();
  for (const tag of tags) {
    const hit = resolve(tag);
    if (hit) ids.add(hit);
    else unresolvedSink?.add(tag);
  }
  return [...ids];
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

function backfillBlog(dir, resolve, write) {
  const indexPath = join(dir, 'content', 'blog', 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  const unresolved = new Set();
  let changed = 0;

  for (const post of index.posts ?? []) {
    const taxonomyIds = resolveViaAlias(post.tags ?? [], resolve, unresolved);
    console.log(`  ${post.slug}: tags=[${(post.tags ?? []).join(', ')}] -> taxonomyIds=[${taxonomyIds.join(', ')}]`);
    if (write) post.taxonomyIds = taxonomyIds;
    changed++;
  }

  if (unresolved.size > 0) {
    console.log(`\n  (${unresolved.size} tag(s) had no taxonomy match, dropped: ${[...unresolved].sort().join(', ')})`);
  }

  if (write) {
    writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');
  }
  return changed;
}

// Skillup is structured differently from every other vertical: multiple
// exam directories (content/skillup/{examId}/index.json), each with its own
// domains[] array and per-domain question files — not one index file. Tags
// live on individual questions, not on a domain or exam directly, so this
// groups each exam's questions by their own `domain` field and resolves the
// UNION of that domain's question tags — deliberately domain-level, not
// exam-level, so one exam covering many subtopics doesn't collapse into one
// noisy, overly broad tag set (see build-content-intelligence.mjs's header
// for the full rationale).
function backfillSkillup(dir, resolve, write) {
  const skillupDir = join(dir, 'content', 'skillup');
  const examDirs = readdirSync(skillupDir).filter((f) => existsSync(join(skillupDir, f, 'index.json')));
  const unresolved = new Set();
  let changed = 0;

  for (const examId of examDirs) {
    const indexPath = join(skillupDir, examId, 'index.json');
    const index = JSON.parse(readFileSync(indexPath, 'utf-8'));

    const tagsByDomain = new Map(); // domain id -> Set<tag>
    for (const qf of index.questionFiles ?? []) {
      // questionFiles entries are repo-root-relative (e.g.
      // "content/skillup/ab731/questions/ab731-domain1.json") — resolve
      // against `dir`, not `skillupDir`, to match that convention.
      const qPath = join(dir, qf);
      if (!existsSync(qPath)) continue;
      const questions = JSON.parse(readFileSync(qPath, 'utf-8'));
      for (const q of questions) {
        if (!tagsByDomain.has(q.domain)) tagsByDomain.set(q.domain, new Set());
        for (const t of q.tags ?? []) tagsByDomain.get(q.domain).add(t);
      }
    }

    console.log(`\n  ${examId}:`);
    for (const domain of index.domains ?? []) {
      const rawTags = [...(tagsByDomain.get(domain.id) ?? [])];
      const taxonomyIds = resolveViaAlias(rawTags, resolve, unresolved);
      console.log(`    domain ${domain.id} (${domain.title}): ${rawTags.length} raw tag(s) -> taxonomyIds=[${taxonomyIds.join(', ')}]`);
      if (write) domain.taxonomyIds = taxonomyIds;
      changed++;
    }

    if (write) {
      writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf-8');
    }
  }

  if (unresolved.size > 0) {
    console.log(`\n  (${unresolved.size} distinct tag(s) had no taxonomy match, dropped — run seed-taxonomy.mjs with a lower threshold if more coverage is wanted)`);
  }
  return changed;
}

function backfillInterviews(dir, resolve, write) {
  const path = join(dir, 'public', 'content', 'interviews', 'bank', 'questions.json');
  const questions = JSON.parse(readFileSync(path, 'utf-8'));
  const unresolved = new Set();
  let changed = 0;

  for (const q of questions) {
    const taxonomyIds = resolveViaAlias(q.tags ?? [], resolve, unresolved);
    console.log(`  ${q.id}: tags=[${(q.tags ?? []).join(', ')}] -> taxonomyIds=[${taxonomyIds.join(', ')}]`);
    if (write) q.taxonomyIds = taxonomyIds;
    changed++;
  }

  if (unresolved.size > 0) {
    console.log(`\n  (${unresolved.size} tag(s) had no taxonomy match, dropped — expected, this bank's tags are mostly one-off: ${[...unresolved].sort().join(', ')})`);
  }

  if (write) {
    writeFileSync(path, JSON.stringify(questions, null, 2) + '\n', 'utf-8');
  }
  return changed;
}

function main() {
  const vertical = arg('vertical');
  const dir = arg('dir') ?? (vertical === 'interviews' ? REPO_ROOT : undefined);
  const write = process.argv.includes('--write');

  if (!vertical || !dir) {
    console.error('Usage: node scripts/backfill-taxonomy-ids.mjs --vertical <hol-labs|usecases|blog|interviews|skillup> --dir <path> [--write]');
    process.exit(1);
  }
  if (!existsSync(dir)) {
    console.error(`✗ Directory not found: ${dir}`);
    process.exit(1);
  }

  const knownIds = loadKnownIds();
  const { resolve } = buildAliasIndex(loadTaxonomyTopics());
  console.log(`${write ? 'Writing' : 'Dry run (pass --write to apply)'} — ${vertical} at ${dir}\n`);

  let changed;
  if (vertical === 'hol-labs') {
    changed = backfillHolLabs(dir, knownIds, write);
  } else if (vertical === 'usecases') {
    changed = backfillUseCases(dir, knownIds, write);
  } else if (vertical === 'blog') {
    changed = backfillBlog(dir, resolve, write);
  } else if (vertical === 'interviews') {
    changed = backfillInterviews(dir, resolve, write);
  } else if (vertical === 'skillup') {
    changed = backfillSkillup(dir, resolve, write);
  } else {
    console.error(`✗ Unknown vertical: ${vertical} (expected hol-labs, usecases, blog, interviews, or skillup)`);
    process.exit(1);
  }

  console.log(`\n${changed} item(s) ${write ? 'updated' : 'would be updated'}.`);
}

main();
