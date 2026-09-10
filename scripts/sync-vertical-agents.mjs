#!/usr/bin/env node
/**
 * sync-vertical-agents.mjs
 *
 * Resolves an entry-point agent's full skill-dependency chain in
 * .claude/agents/ and .claude/skills/, strips the "content moved, go
 * elsewhere" relocation notice (meaningless once the file is already
 * "elsewhere"), and writes the result into a second, already-checked-out
 * copy of the target vertical repo.
 *
 * Deliberately does NOT rewrite `public/content/{vertical}/` anywhere in
 * the source text. Every occurrence of that exact string in these agent
 * files is the "never write to ajch_platform's own stale local directory"
 * warning — a fact about ajch_platform's structure, not about the current
 * repo's layout, and it must read the same regardless of which repo the
 * copy lands in. An earlier version of this script blanket-rewrote
 * `public/content/{vertical}/` → `content/{vertical}/` on the theory that
 * a vertical's own live content root needed de-prefixing for spoke repos
 * — but no agent file actually uses that string to mean "my own live
 * root" (that's always plain `content/{vertical}/` already, hub and
 * spoke alike). The blanket rewrite instead silently inverted the "never
 * write here" warning in release-engineer.md, usecase-publisher.md, and
 * all 3 hol-lab-*.md files — telling the spoke to avoid its own correct
 * live path. Caught only because a human happened to check the live
 * site. Do not reintroduce a path rewrite here without first confirming,
 * for every entry agent in every vertical, which specific string a
 * `public/content/{vertical}/` occurrence actually is.
 *
 * This exists because .claude/agents/*.md copies in vertical repos have
 * been "kept in sync manually" (release-engineer.md's own words) — a
 * process that missed real, load-bearing dependencies twice in one
 * session (platform-vocabulary for blog, question-generator +
 * content-standard for skillup). This script does the same dependency
 * resolution deterministically instead of by hand.
 *
 * Usage:
 *   node scripts/sync-vertical-agents.mjs <vertical> <path-to-vertical-checkout>
 *
 * Exits 0 with "no changes" if the target already matches (idempotent —
 * safe to run repeatedly, only ever writes when something actually
 * differs). Never touches ajch_platform's own files — read-only here.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const VERTICALS = {
  blog: {
    repo: 'ajeetchouksey/ajch_aaryaai_blogs',
    entryAgents: ['content-lead', 'tech-writer', 'release-engineer', 'appsec-engineer'],
  },
  skillup: {
    repo: 'ajeetchouksey/ajch_skillup',
    entryAgents: ['curriculum-engineer', 'assessment-engineer', 'docs-engineer', 'scenario-engineer', 'appsec-engineer'],
  },
  usecases: {
    repo: 'ajeetchouksey/ajch_ai_usecases',
    entryAgents: ['usecase-lead', 'usecase-writer', 'usecase-publisher', 'appsec-engineer', 'qa-engineer'],
  },
  'hol-labs': {
    repo: 'ajeetchouksey/ajch_hol_labs',
    entryAgents: ['hol-lab-lead', 'hol-lab-writer', 'hol-lab-publisher', 'appsec-engineer', 'qa-engineer'],
  },
};

const SKILL_REF_RE = /\.claude\/skills\/([a-z0-9-]+)\/SKILL\.md/g;

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const [, , vertical, targetPath] = process.argv;
if (!vertical || !targetPath) {
  fail('Usage: node scripts/sync-vertical-agents.mjs <vertical> <path-to-vertical-checkout>');
}
const config = VERTICALS[vertical];
if (!config) {
  fail(`Unknown vertical "${vertical}". Known: ${Object.keys(VERTICALS).join(', ')}`);
}
if (!existsSync(targetPath)) {
  fail(`Target checkout path does not exist: ${targetPath}`);
}

// ── 1. Resolve the full agent + skill file set ─────────────────────────────

function resolveSkillDeps(agentContent) {
  const skills = new Set();
  let match;
  SKILL_REF_RE.lastIndex = 0;
  while ((match = SKILL_REF_RE.exec(agentContent)) !== null) {
    skills.add(match[1]);
  }
  return skills;
}

const agentFiles = new Map(); // relPath -> content
const skillNames = new Set();

for (const agentName of config.entryAgents) {
  const relPath = `.claude/agents/${agentName}.md`;
  const absPath = join(ROOT, relPath);
  if (!existsSync(absPath)) {
    fail(`Entry agent not found: ${relPath} — check VERTICALS config in this script`);
  }
  const content = readFileSync(absPath, 'utf-8');
  agentFiles.set(relPath, content);
  for (const skill of resolveSkillDeps(content)) skillNames.add(skill);
}

const skillFiles = new Map(); // relPath -> content
for (const skillName of skillNames) {
  const relPath = `.claude/skills/${skillName}/SKILL.md`;
  const absPath = join(ROOT, relPath);
  if (!existsSync(absPath)) {
    fail(`Skill referenced but not found: ${relPath} (required by one of ${config.entryAgents.join(', ')})`);
  }
  skillFiles.set(relPath, readFileSync(absPath, 'utf-8'));
}

console.log(`Resolved for ${vertical}: ${agentFiles.size} agent file(s), ${skillFiles.size} skill file(s)`);
console.log(`  Agents: ${[...agentFiles.keys()].join(', ')}`);
console.log(`  Skills: ${[...skillFiles.keys()].join(', ')}`);

// ── 2. Rewrite paths + strip the "content moved, go elsewhere" notice ──────
//
// Entry agents in ajch_platform carry a relocation notice ("> **{X} content
// moved.** ... Invoke this agent from a session in {vertical repo} instead")
// telling a session running IN ajch_platform to go elsewhere. That notice is
// meaningless — actively self-contradictory — inside the vertical repo
// itself, which IS "elsewhere". Strip it before writing. Caught by this
// script's own dry-run verification before ever reaching a real sync.
//
// The banner is sometimes one blockquote paragraph (usecase-lead.md,
// curriculum-engineer.md), sometimes two, joined by a bare "&gt;" line
// (content-lead.md, release-engineer.md — a second "Cross-repo write
// target" paragraph). `[\s\S]*?` (not `.*`) is required to span that
// internal line break; `.*` alone silently matched only the first
// paragraph and left the second one — including its own correct
// `public/content/{vertical}/` mention — sitting in the spoke's copy
// telling it to "invoke this agent from ajch_aaryaai_blogs instead"
// while already being the ajch_aaryaai_blogs copy. Lazy (`*?`) so it
// stops at the first genuine blank line, not the last one in the file.
const RELOCATION_NOTICE_RE = /^> \*\*[A-Za-z ]+ content moved\.\*\*[\s\S]*?\n\n/m;

function rewrite(content) {
  return content.replace(RELOCATION_NOTICE_RE, '');
}

// Every vertical repo also gets a copy of the root Copilot instructions —
// written unconditionally (not resolved via entryAgents/skill deps, since
// it isn't scoped to one agent) so Copilot reads the same diagram/prose
// standards in every repo in this family. Written verbatim: it contains no
// public/content/{vertical}/ path or "content moved" relocation notice, so
// it needs no rewrite() pass.
const copilotInstructionsPath = '.github/copilot-instructions.md';
const fixedFiles = new Map();
if (existsSync(join(ROOT, copilotInstructionsPath))) {
  fixedFiles.set(copilotInstructionsPath, readFileSync(join(ROOT, copilotInstructionsPath), 'utf-8'));
}

const allFiles = new Map([...agentFiles, ...skillFiles]);
const rewritten = new Map();
for (const [relPath, content] of allFiles) {
  rewritten.set(relPath, rewrite(content));
}
for (const [relPath, content] of fixedFiles) {
  rewritten.set(relPath, content);
}

// ── 3. Diff against target, write only what changed ────────────────────────

let changedCount = 0;
for (const [relPath, content] of rewritten) {
  const targetFile = join(targetPath, relPath);
  const existing = existsSync(targetFile) ? readFileSync(targetFile, 'utf-8') : null;
  if (existing === content) continue;

  mkdirSync(dirname(targetFile), { recursive: true });
  writeFileSync(targetFile, content, 'utf-8');
  changedCount++;
  console.log(`  ${existing === null ? '+ new' : '~ updated'}: ${relPath}`);
}

if (changedCount === 0) {
  console.log(`✓ ${vertical} is already up to date — no changes.`);
  process.exit(0);
}

console.log(`✓ ${changedCount} file(s) written to ${targetPath}`);
