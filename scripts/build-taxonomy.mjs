#!/usr/bin/env node
/**
 * build-taxonomy.mjs
 *
 * Compiles public/content/taxonomy.json (Tier 1 — curated named
 * frameworks/concepts) from the human-authored prose in
 * .claude/skills/platform-vocabulary/SKILL.md. Same "authored source ->
 * generated JSON" pattern this repo already trusts (index.json -> catalog.json).
 *
 * Does not change the authoring format — humans keep editing the markdown
 * per its existing governance (Content Lead -> SRE PR review); this just
 * extracts the same information into a machine-comparable shape so
 * relationship scoring never has to string-match free-text tags.
 *
 * Usage: node scripts/build-taxonomy.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const SOURCE_PATH = join(root, '.claude', 'skills', 'platform-vocabulary', 'SKILL.md');
const OUT_PATH = join(root, 'public', 'content', 'taxonomy.json');

// "## Named Frameworks (Platform-Coined)" -> kind: 'named-framework' (Tier 1, high-precision)
// Everything else under a "## " section (Architectural Terms, v3.x Platform Types) -> kind: 'concept'
const NAMED_FRAMEWORKS_HEADING = 'Named Frameworks';

function slugify(label) {
  return label
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Exam codes as written in this prose file ("CCA-F") don't match the
// registry's lowercase id ("ccaf") used elsewhere in the platform
// (content/skillup/{examId}/). Extend this map as new exams get
// "Exam alignment:" lines pointing at them.
const EXAM_CODE_TO_ID = {
  'CCA-F': 'ccaf',
};

function parseExamAlignment(line) {
  // e.g. "CCA-F Domain 5 — Context Management & Reliability"
  const codeMatch = line.match(/([A-Z]{2,}-[A-Z0-9]+)/);
  const domainMatch = line.match(/Domain\s+(\d+)/i);
  if (!codeMatch || !domainMatch) return [];
  const exam = EXAM_CODE_TO_ID[codeMatch[1]];
  if (!exam) return []; // unknown exam code — skip rather than guess
  return [{ exam, domain: Number(domainMatch[1]) }];
}

function parseTags(line) {
  // e.g. "**Tags:** `context-management`, `token-budget`, `context-window`"
  const matches = [...line.matchAll(/`([^`]+)`/g)];
  return matches.map((m) => m[1]);
}

function compileTaxonomy(markdown) {
  const lines = markdown.split('\n');
  const topics = [];
  let currentSection = null; // text of the most recent "## " heading
  let current = null; // in-progress topic node

  function flush() {
    if (current) topics.push(current);
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      currentSection = h2[1];
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flush();
      const label = h3[1].trim();
      current = {
        id: slugify(label),
        label,
        kind: currentSection?.includes(NAMED_FRAMEWORKS_HEADING) ? 'named-framework' : 'concept',
        tier: 1,
        aliases: [],
        examDomains: [],
      };
      continue;
    }

    if (!current) continue;

    const tagsMatch = line.match(/^\*\*Tags:\*\*\s*(.+)$/);
    if (tagsMatch) {
      current.aliases.push(...parseTags(tagsMatch[0]));
      continue;
    }

    const examMatch = line.match(/^\*\*Exam alignment:\*\*\s*(.+)$/);
    if (examMatch) {
      current.examDomains.push(...parseExamAlignment(examMatch[1]));
      continue;
    }
  }
  flush();

  // Terms with no "**Tags:**" line (e.g. v3.x Platform Types like
  // ContentType, RichScenario — schema/type definitions, not conceptual
  // topics) have nothing for the backfill/alias mapper to match free-text
  // content tags against, so they can never participate in relationship
  // scoring either way. Drop them rather than ship dead nodes.
  const untagged = topics.filter((t) => t.aliases.length === 0).map((t) => t.label);
  if (untagged.length > 0) {
    console.log(`  (skipped ${untagged.length} untagged term(s), no Tags: line to key off: ${untagged.join(', ')})`);
  }

  return topics
    .filter((t) => t.aliases.length > 0)
    .map((t) => {
      const aliases = [...new Set(t.aliases)];
      const node = { id: t.id, label: t.label, kind: t.kind, tier: 1, aliases };
      if (t.examDomains.length > 0) node.examDomains = t.examDomains;
      return node;
    });
}

function main() {
  if (!existsSync(SOURCE_PATH)) {
    console.error(`✗ Source not found: ${SOURCE_PATH}`);
    process.exit(1);
  }
  const markdown = readFileSync(SOURCE_PATH, 'utf-8');
  const topics = compileTaxonomy(markdown);

  if (topics.length === 0) {
    console.error('✗ No topics parsed from platform-vocabulary/SKILL.md — refusing to write an empty taxonomy.');
    process.exit(1);
  }

  const ids = new Set();
  for (const t of topics) {
    if (ids.has(t.id)) {
      console.error(`✗ Duplicate taxonomy id "${t.id}" (from label "${t.label}") — fix the source heading to disambiguate.`);
      process.exit(1);
    }
    ids.add(t.id);
  }

  // This script only owns tier-1 nodes (compiled from platform-vocabulary).
  // Tier-2+ nodes are seeded/curated separately by scripts/seed-taxonomy.mjs
  // and have no source file to regenerate from — preserve them across runs
  // instead of wiping the file each time this compiles tier 1 fresh. Dedupe
  // by id (not by a stored tier field) — an id this run just recompiled is
  // dropped from "preserved" even if an older file predates the tier field
  // and left it undefined, so a stale copy never survives alongside the
  // fresh one.
  const freshIds = new Set(topics.map((t) => t.id));
  let preserved = [];
  if (existsSync(OUT_PATH)) {
    const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
    preserved = (existing.topics ?? []).filter((t) => !freshIds.has(t.id));
  }

  const out = {
    schemaVersion: 1,
    generated: new Date().toISOString().slice(0, 10),
    note: 'Tier 1 (named-framework/concept, from .claude/skills/platform-vocabulary/SKILL.md) is fully regenerated by this script on every run. Tier 2+ (general topics, seeded per-vertical by scripts/seed-taxonomy.mjs) is preserved across runs, not regenerated — do not hand-edit tier-1 entries here, edit the source markdown instead.',
    topics: [...topics, ...preserved],
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf-8');
  console.log(`Taxonomy written: ${topics.length} Tier-1 topics + ${preserved.length} preserved Tier-2+ topics -> ${OUT_PATH}`);
}

main();
