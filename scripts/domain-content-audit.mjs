#!/usr/bin/env node
/**
 * domain-content-audit.mjs
 * Per-domain content readiness audit for a given exam.
 * Default exam: ccaf (use --exam <id> to target another exam).
 *
 * Usage:
 *   node scripts/domain-content-audit.mjs
 *   node scripts/domain-content-audit.mjs --exam gh300
 *
 * Reports per domain:
 *  - Questions count + difficulty coverage
 *  - Notes file exists
 *  - Task-statement coverage (questionIds that resolve)
 *  - Tag distribution (top tags)
 *  - Readiness rating: ✅ Ready / ⚠️ Partial / ❌ Needs work
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT        = resolve(__dirname, '..');
const SKILLUP_DIR = join(ROOT, 'public', 'content', 'skillup');

// Minimum thresholds (from content-standard.md)
const MIN_QUESTIONS_PER_DOMAIN = 10;
const MIN_DIFFICULTY_COVERAGE  = 0.5; // 50%

// ── helpers ──────────────────────────────────────────────────────────────────

function loadJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { return null; }
}

function absContent(ref) {
  return ref.startsWith('content/') ? join(ROOT, 'public', ref) : join(ROOT, ref);
}

function col(s, w) { return String(s).padEnd(w); }

// ── main ──────────────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const examFlag = args.indexOf('--exam');
const examId   = examFlag !== -1 ? args[examFlag + 1] : 'ccaf';

const idxPath = join(SKILLUP_DIR, examId, 'index.json');
if (!existsSync(idxPath)) {
  console.error(`Exam "${examId}" not found — expected ${idxPath}`);
  process.exit(1);
}

const idx = loadJson(idxPath);
if (!idx) { console.error('Failed to parse index.json'); process.exit(1); }

console.log(`\n  Domain Content Audit — ${examId.toUpperCase()} (v${idx.contentVersion ?? '?'}) — ${new Date().toISOString().slice(0, 10)}\n`);
console.log(`  Exam: ${idx.title}`);
console.log(`  Total declared questions: ${idx.questions} · Domains: ${idx.domains.length}\n`);

// Load all questions grouped by domain
const allQuestions = [];
for (const qf of (idx.questionFiles ?? [])) {
  const qPath = absContent(qf);
  if (!existsSync(qPath)) continue;
  const qs = loadJson(qPath);
  if (Array.isArray(qs)) allQuestions.push(...qs);
}

// Load task statements
const tsPath = idx.taskStatementsFile ? absContent(idx.taskStatementsFile) : null;
const taskStatements = tsPath && existsSync(tsPath) ? loadJson(tsPath) : null;

// Build task-statement questionId set per domain
const tsQids = {}; // domainId → Set of questionIds
if (taskStatements?.domains) {
  for (const td of taskStatements.domains) {
    const ids = new Set();
    for (const task of (td.tasks ?? [])) {
      for (const qid of (task.questionIds ?? [])) ids.add(qid);
    }
    tsQids[td.id] = ids;
  }
}

const allQids = new Set(allQuestions.map((q) => q.id).filter(Boolean));

// ── per-domain audit ──────────────────────────────────────────────────────────

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

const domainResults = [];
let totalIssues = 0;

for (const domain of idx.domains) {
  const dqs = allQuestions.filter((q) => String(q.domain) === String(domain.id));
  const withDiff = dqs.filter((q) => VALID_DIFFICULTIES.has(q.difficulty)).length;
  const diffPct  = dqs.length > 0 ? withDiff / dqs.length : 0;

  // Notes file
  const notesExists = domain.notesFile ? existsSync(absContent(domain.notesFile)) : false;

  // Task-statement coverage
  const tsSet = tsQids[domain.id];
  let tsCoverage = null;
  if (tsSet && tsSet.size > 0) {
    const covered = [...tsSet].filter((id) => allQids.has(id)).length;
    tsCoverage = { covered, total: tsSet.size };
  }

  // Top tags
  const tagCounts = {};
  for (const q of dqs) {
    for (const t of (q.tags ?? [])) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // Issues
  const issues = [];
  if (dqs.length < MIN_QUESTIONS_PER_DOMAIN) issues.push(`only ${dqs.length} questions (min ${MIN_QUESTIONS_PER_DOMAIN})`);
  if (!notesExists) issues.push('notes file missing');
  if (diffPct < MIN_DIFFICULTY_COVERAGE) issues.push(`difficulty ${Math.round(diffPct * 100)}% < 50%`);
  if (tsCoverage && tsCoverage.covered < tsCoverage.total) {
    issues.push(`task-stmts ${tsCoverage.covered}/${tsCoverage.total} resolved`);
  }

  const rating = issues.length === 0 ? '✅ Ready' : issues.length <= 2 ? '⚠️  Partial' : '❌ Needs work';
  totalIssues += issues.length;
  domainResults.push({ domain, dqs: dqs.length, diffPct, notesExists, tsCoverage, topTags, issues, rating });
}

// ── print table ───────────────────────────────────────────────────────────────

console.log(`  ${col('Domain', 5)}${col('Qs', 5)}${col('Diff%', 7)}${col('Notes', 7)}${col('Tasks', 8)}${col('Status', 14)}Issues`);
console.log('  ' + '─'.repeat(72));

for (const r of domainResults) {
  const ts = r.tsCoverage ? `${r.tsCoverage.covered}/${r.tsCoverage.total}` : 'n/a';
  console.log(
    `  ${col('D' + r.domain.id, 5)}` +
    `${col(r.dqs, 5)}` +
    `${col(Math.round(r.diffPct * 100) + '%', 7)}` +
    `${col(r.notesExists ? '✓' : '✗', 7)}` +
    `${col(ts, 8)}` +
    `${col(r.rating, 14)}` +
    (r.issues.length ? r.issues.join(' · ') : '—')
  );
}

console.log('  ' + '─'.repeat(72));

// ── domain detail breakdown ───────────────────────────────────────────────────

for (const r of domainResults) {
  if (r.issues.length === 0) continue;
  console.log(`\n  D${r.domain.id}: ${r.domain.title}`);
  for (const issue of r.issues) {
    console.log(`    • ${issue}`);
  }
  if (r.topTags.length) {
    console.log(`    Top tags: ${r.topTags.join(', ')}`);
  }
}

// ── summary ───────────────────────────────────────────────────────────────────

const readyCount = domainResults.filter((r) => r.issues.length === 0).length;
console.log(`\n  Summary: ${readyCount}/${idx.domains.length} domains ready · ${totalIssues} total issue(s)`);

if (totalIssues > 0) {
  console.log(`  Run this report again after addressing the issues above.\n`);
  process.exit(1);
} else {
  console.log(`  All domains meet the content standard. ✅\n`);
}
