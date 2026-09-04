#!/usr/bin/env node
/**
 * sync-vertical-agents.mjs
 *
 * Resolves an entry-point agent's full skill-dependency chain in
 * .claude/agents/ and .claude/skills/, rewrites public/content/{vertical}/
 * references to content/{vertical}/ (this repo's own layout uses the
 * public/ prefix; every vertical repo does not), and writes the result
 * into a second, already-checked-out copy of the target vertical repo.
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
    pathPrefix: 'blog',
  },
  skillup: {
    repo: 'ajeetchouksey/ajch_skillup',
    entryAgents: ['curriculum-engineer', 'assessment-engineer', 'docs-engineer', 'scenario-engineer'],
    pathPrefix: 'skillup',
  },
  usecases: {
    repo: 'ajeetchouksey/ajch_ai_usecases',
    entryAgents: ['usecase-lead', 'usecase-writer', 'usecase-publisher', 'appsec-engineer', 'qa-engineer'],
    pathPrefix: 'usecases',
  },
  'hol-labs': {
    repo: 'ajeetchouksey/ajch_hol_labs',
    entryAgents: ['hol-lab-lead', 'hol-lab-writer', 'hol-lab-publisher', 'appsec-engineer', 'qa-engineer'],
    pathPrefix: 'hol-labs',
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
const RELOCATION_NOTICE_RE = /^> \*\*[A-Za-z]+ content moved\.\*\*.*\n\n/m;

function rewrite(content) {
  const pathPattern = new RegExp(`public/content/${config.pathPrefix}/`, 'g');
  return content
    .replace(pathPattern, `content/${config.pathPrefix}/`)
    .replace(RELOCATION_NOTICE_RE, '');
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
