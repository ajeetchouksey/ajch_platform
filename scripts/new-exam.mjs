#!/usr/bin/env node
/**
 * new-exam.mjs
 * Scaffolds a new exam directory under public/content/skillup/{examId}/
 * with all required files pre-populated from canonical templates.
 *
 * Usage:
 *   node scripts/new-exam.mjs \
 *     --id ab999 \
 *     --code "AB-999" \
 *     --title "Microsoft Certified: Example Expert" \
 *     --short "AB-999" \
 *     --level 201 \
 *     --domains "Domain 1 Title,Domain 2 Title,Domain 3 Title" \
 *     --provider "Microsoft" \
 *     --fee "$165 USD" \
 *     --duration "60 min" \
 *     --pass 700 \
 *     --color blue
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SKILLUP_DIR = join(ROOT, 'public', 'content', 'skillup');

// ── Input validation ─────────────────────────────────────────────────────────

const EXAM_ID_PATTERN   = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXAM_CODE_PATTERN = /^[A-Z0-9]{2,10}(?:-[A-Z0-9]{1,10})*$/;
const LEVEL_ALLOWLIST   = new Set(['101', '201', '301']);
const COLOR_ALLOWLIST   = new Set(['blue', 'violet', 'emerald', 'rose', 'amber', 'gray', 'sky']);
const MAX_TITLE_LEN     = 120;

function parseArgs(argv) {
  const map = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && i + 1 < argv.length) {
      map[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return map;
}

function validateArgs(a) {
  const errors = [];
  if (!a.id)     errors.push('--id is required');
  if (!a.code)   errors.push('--code is required');
  if (!a.title)  errors.push('--title is required');
  if (!a.level)  errors.push('--level is required (101 | 201 | 301)');
  if (!a.domains) errors.push('--domains is required (comma-separated list of domain titles)');

  if (a.id    && !EXAM_ID_PATTERN.test(a.id))     errors.push(`--id must match ${EXAM_ID_PATTERN} (e.g. "ab731", "ghbp")`);
  if (a.code  && !EXAM_CODE_PATTERN.test(a.code)) errors.push(`--code must match ${EXAM_CODE_PATTERN} (e.g. "AB-731")`);
  if (a.level && !LEVEL_ALLOWLIST.has(a.level))   errors.push(`--level must be one of: 101, 201, 301`);
  if (a.title && a.title.trim().length === 0)      errors.push('--title cannot be empty');
  if (a.title && a.title.length > MAX_TITLE_LEN)   errors.push(`--title too long (max ${MAX_TITLE_LEN} chars)`);
  if (a.color && !COLOR_ALLOWLIST.has(a.color))    errors.push(`--color must be one of: ${[...COLOR_ALLOWLIST].join(', ')}`);

  if (errors.length > 0) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
}

function buildExamDir(examId) {
  const resolved = resolve(SKILLUP_DIR, examId);
  // Guard against path traversal
  if (!resolved.startsWith(SKILLUP_DIR + '/') && !resolved.startsWith(SKILLUP_DIR + '\\')) {
    console.error(`  ✗ Path traversal detected: ${resolved}`);
    process.exit(1);
  }
  return resolved;
}

// ── Domain colour palette ─────────────────────────────────────────────────────

const DOMAIN_COLORS = ['bg-sky-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];
const ACCENT_COLORS = {
  blue: '#0078d4', violet: '#7c3aed', emerald: '#059669',
  rose: '#e11d48', amber: '#d97706', gray: '#6b7280', sky: '#0284c7',
};

// ── Template generators ───────────────────────────────────────────────────────

function makeIndexJson(a, domainList) {
  const domains = domainList.map((title, i) => ({
    id: i + 1,
    title,
    weight: Math.floor(100 / domainList.length),
    color: DOMAIN_COLORS[i % DOMAIN_COLORS.length],
    notesFile: `content/skillup/${a.id}/notes/${a.id}-d${i + 1}-${slugify(title)}.md`,
  }));

  const questionFiles = domainList.map((_, i) =>
    `content/skillup/${a.id}/questions/${a.id}-domain${i + 1}.json`
  );

  return {
    schemaVersion: '1.0',
    id: a.id,
    examCode: a.code,
    title: a.title,
    shortTitle: a.short ?? a.code,
    contentLevel: a.level,
    description: `Practice exam for ${a.title}. Covers ${domainList.join(', ')}.`,
    questions: 0,
    duration: a.duration ?? '60 min',
    passScore: a.pass ? `${a.pass}/1000` : '700/1000',
    passThreshold: a.pass ? parseInt(a.pass, 10) / 10 : 70,
    examFee: a.fee ?? 'TBD',
    available: false,
    accentColor: ACCENT_COLORS[a.color ?? 'blue'],
    colorScheme: a.color ?? 'blue',
    domains,
    questionFiles,
    taskStatementsFile: `content/skillup/${a.id}/task-statements.json`,
    scenarioFiles: [],
    resources: [
      { label: `${a.provider ?? 'Provider'} Official Study Guide`, url: 'https://learn.microsoft.com' },
    ],
  };
}

function makeTaskStatementsJson(a, domainList) {
  return {
    schemaVersion: '1.0',
    examCode: a.code,
    source: `Official study guide for ${a.code}`,
    sourceUrl: '',
    domains: domainList.map((title, i) => ({
      id: i + 1,
      title,
      weight: Math.floor(100 / domainList.length),
      officialWeight: `${Math.floor(100 / domainList.length)}%`,
      tasks: [
        {
          id: `${i + 1}.1`,
          title: `[TODO: official task title for domain ${i + 1}]`,
          knowledge: ['[TODO: knowledge statement]'],
          skills: ['[TODO: skill statement]'],
          questionIds: [],
        },
      ],
    })),
  };
}

function makeNotesMd(domainTitle, examCode) {
  return `# ${domainTitle}

> Study notes for **${examCode}** — ${domainTitle}

## Overview

<!-- TODO: brief domain overview -->

## Key Concepts

<!-- TODO: core concepts, definitions, diagrams -->

## Exam Traps

<div class="note-trap">
<!-- TODO: add exam trap callouts -->
</div>

## Quick Reference

| Concept | Description |
|---------|-------------|
| TODO    | TODO        |
`;
}

function makeQuestionJson(domainNum) {
  return [
    {
      domain: domainNum,
      id: `TODO-d${domainNum}-001`,
      scenario: 'TODO: describe a real-world scenario that sets the context.',
      question: 'TODO: ask a specific question about the scenario.',
      options: [
        'TODO: option A',
        'TODO: option B (correct)',
        'TODO: option C',
        'TODO: option D',
      ],
      correct: 1,
      explanation: 'TODO: explain why option B is correct and why the others are wrong.',
      tags: ['todo'],
    },
  ];
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function write(path, content) {
  writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  console.log(`  ✓ ${path.replace(ROOT, '').replace(/^[/\\]/, '')}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0 || rawArgs.includes('--help')) {
  console.log(`
Usage: node scripts/new-exam.mjs \\
  --id <examId>        e.g. ab999
  --code <EXAM-CODE>   e.g. AB-999
  --title <string>     e.g. "Microsoft Certified: Example Expert"
  --short <string>     e.g. AB-999  (defaults to --code)
  --level 101|201|301
  --domains "D1 Title,D2 Title,D3 Title"
  --provider <string>  e.g. Microsoft  (optional)
  --fee <string>       e.g. "$165 USD"  (optional)
  --duration <string>  e.g. "60 min"  (optional)
  --pass <number>      pass threshold out of 1000, e.g. 700  (optional)
  --color blue|violet|emerald|rose|amber|gray|sky  (optional)
`);
  process.exit(0);
}

const a = parseArgs(rawArgs);
validateArgs(a);

const examDir = buildExamDir(a.id);
if (existsSync(examDir)) {
  console.error(`  ✗ Exam directory already exists: ${examDir}`);
  process.exit(1);
}

const domainList = a.domains.split(',').map(d => d.trim()).filter(Boolean);
if (domainList.length === 0) {
  console.error('  ✗ --domains produced no entries after parsing');
  process.exit(1);
}

console.log(`\nScaffolding exam: ${a.code} (${a.id})\n`);

// Create directory structure
for (const sub of ['questions', 'notes', 'scenarios']) {
  mkdirSync(join(examDir, sub), { recursive: true });
}

// index.json
write(join(examDir, 'index.json'), makeIndexJson(a, domainList));

// task-statements.json
write(join(examDir, 'task-statements.json'), makeTaskStatementsJson(a, domainList));

// Per-domain: notes + questions
for (let i = 0; i < domainList.length; i++) {
  const n = i + 1;
  const slug = slugify(domainList[i]);
  write(join(examDir, 'notes', `${a.id}-d${n}-${slug}.md`), makeNotesMd(domainList[i], a.code));
  write(join(examDir, 'questions', `${a.id}-domain${n}.json`), makeQuestionJson(n));
}

console.log(`
Done. Next steps:
  1. Fill in notes/${a.id}-d*-*.md  with real study content
  2. Replace placeholder questions in questions/${a.id}-domain*.json
  3. Update task-statements.json with official study-guide task statements
  4. Set  "available": true  in index.json when ready to publish
  5. Run  python scripts/sync-stats.py  to update catalog and stats

Validate at any time:
  node scripts/check-exam-completeness.mjs --exam ${a.id}
`);
