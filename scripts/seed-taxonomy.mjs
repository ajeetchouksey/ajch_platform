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
 * vertical, rather than building a plugin system for verticals not in scope
 * yet. usecases/hol-labs use their vertical's own already-curated vocabulary
 * directly (1:1, no ambiguity). blog free-texts tags, so it resolves each
 * one through buildAliasIndex() first (catching e.g. "resilience" already
 * meaning the degradation-ladder node) and only proposes a genuinely new
 * node for what's left, filtered to tags used on 2+ posts — a lone
 * count-of-1 tag is usually either too narrow to ever match anything else
 * or legacy noise from this blog's pre-AI-focus era (Azure certification
 * codes etc.), and either way isn't worth a permanent taxonomy entry.
 *
 * Usage:
 *   node scripts/seed-taxonomy.mjs              # preview candidates
 *   node scripts/seed-taxonomy.mjs --merge       # append into taxonomy.json
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadUsecasesIndex, loadHolLabsIndex, loadBlogIndex } from './lib/content-sources.mjs';
import { buildAliasIndex } from './lib/taxonomy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const TAXONOMY_PATH = join(root, 'public', 'content', 'taxonomy.json');
const BLOG_MIN_USAGE = 2;

// Hand-picked display labels for known abbreviations/product names — a
// generic slug->Title Case conversion would produce "Azure Ai Foundry"
// instead of "Azure AI Foundry". Extend as new sources are seeded.
const LABEL_OVERRIDES = {
  'azure-ai-foundry': 'Azure AI Foundry',
  'azure-openai': 'Azure OpenAI',
  'content-safety': 'Content Safety',
  'responsible-ai': 'Responsible AI',
  'prompt-flow': 'Prompt Flow',
  iac: 'Infrastructure as Code',
  vsts: 'Visual Studio Team Services',
  cicd: 'CI/CD',
  llm: 'LLM',
  llmops: 'LLMOps',
  git: 'Git',
  ai: 'AI',
  devops: 'DevOps',
  'ai-architecture': 'AI Architecture',
  'cca-f': 'CCA-F',
  'enterprise-ai': 'Enterprise AI',
  'azure-sql': 'Azure SQL',
  rag: 'RAG',
  sonarqube: 'SonarQube',
  dsc: 'DSC (Desired State Configuration)',
  vnet: 'Azure VNet',
  cli: 'CLI',
  '70-533': '70-533 (legacy Azure certification)',
  '70-535': '70-535 (legacy Azure certification)',
  pestertest: 'Pester Tests',
  codequality: 'Code Quality',
  powershell: 'PowerShell',
};

// Purely categorical meta-tags, not concepts — a tag can only reach here if
// buildAliasIndex() already flagged it as ambiguous (claimed by 2+ Tier-1
// nodes), which is itself evidence it doesn't name one specific thing.
// Without this, an ambiguous alias would be "unresolved" and then get
// proposed as a brand-new node — recreating the exact ambiguity it was
// excluded from resolution for.
function isAmbiguousAlias(id, ambiguous) {
  return ambiguous.some(([alias]) => alias === id.toLowerCase());
}

function titleCase(slug) {
  return LABEL_OVERRIDES[slug] ?? slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// Each source resolves to { id, label } candidates.
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
  {
    vertical: 'blog',
    describe: `content/blog/index.json — free-text post tags, used on ${BLOG_MIN_USAGE}+ non-draft posts`,
    async candidates() {
      const idx = await loadBlogIndex();
      const counts = new Map();
      for (const p of idx?.posts ?? []) {
        if (p.draft) continue;
        for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
      return [...counts.entries()]
        .filter(([, count]) => count >= BLOG_MIN_USAGE)
        .map(([id]) => ({ id, label: titleCase(id) }));
    },
  },
];

async function main() {
  const merge = process.argv.includes('--merge');

  const existing = existsSync(TAXONOMY_PATH)
    ? JSON.parse(readFileSync(TAXONOMY_PATH, 'utf-8'))
    : { schemaVersion: 1, topics: [] };

  const newNodes = [];
  for (const source of SOURCES) {
    console.log(`\n${source.vertical} (${source.describe})`);
    // Rebuilt each iteration so a node proposed by an earlier source in this
    // same run is immediately resolvable by a later one.
    const { resolve, ambiguous } = buildAliasIndex([...existing.topics, ...newNodes]);
    if (ambiguous.length > 0) {
      for (const [alias, nodeIds] of ambiguous) {
        console.log(`  ! "${alias}" is ambiguous — claimed by [${nodeIds.join(', ')}], excluded from resolution`);
      }
    }

    const candidates = await source.candidates();
    for (const c of candidates) {
      const existingMatch = resolve(c.id);
      if (existingMatch) {
        console.log(`  = ${c.id} -> already resolves to "${existingMatch}"`);
        continue;
      }
      if (isAmbiguousAlias(c.id, ambiguous)) {
        console.log(`  x ${c.id} -> skipped (itself an ambiguous meta-tag, not a concept)`);
        continue;
      }
      console.log(`  + ${c.id} -> "${c.label}"`);
      newNodes.push({ id: c.id, label: c.label, kind: 'concept', tier: 2, aliases: [c.id] });
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
