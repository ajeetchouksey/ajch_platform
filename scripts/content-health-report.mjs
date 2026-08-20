#!/usr/bin/env node
/**
 * content-health-report.mjs
 * Full-scan content health check — not limited to staged files.
 * Run by the weekly GHA or manually: node scripts/content-health-report.mjs
 *
 * Exit 0: all exams pass minimum thresholds.
 * Exit 1: one or more critical violations found.
 *
 * Checks per exam:
 *  - Duplicate question IDs (across all question files for that exam)
 *  - Minimum question count per domain (≥ 1)
 *  - Tags: non-empty array of strings on every question
 *  - Difficulty coverage: reports % of questions that have the field
 *    (warn if < 50%; does not hard-fail, as back-filling is in-progress)
 *  - Palette, contentVersion, provider present in index.json
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT        = resolve(__dirname, '..');
const SKILLUP_DIR = join(ROOT, 'public', 'content', 'skillup');

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

// ── helpers ──────────────────────────────────────────────────────────────────

let criticalErrors = 0;

function error(examId, msg) {
  console.error(`  ❌  [${examId}] ${msg}`);
  criticalErrors++;
}

function warn(examId, msg) {
  console.warn(`  ⚠️   [${examId}] ${msg}`);
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

// ── discovery ─────────────────────────────────────────────────────────────────

function discoverExams() {
  if (!existsSync(SKILLUP_DIR)) return [];
  return readdirSync(SKILLUP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => {
      const idx = join(SKILLUP_DIR, name, 'index.json');
      return existsSync(idx);
    });
}

// ── per-exam checks ────────────────────────────────────────────────────────────

function checkExam(examId) {
  const examDir  = join(SKILLUP_DIR, examId);
  const idxPath  = join(examDir, 'index.json');
  const idx      = loadJson(idxPath);
  if (!idx) { error(examId, 'index.json missing or unreadable'); return null; }

  const stats = {
    examId,
    totalQuestions:  0,
    withDifficulty:  0,
    withTags:        0,
    duplicateIds:    0,
    missingDomains:  [],
    domainCounts:    {},
  };

  // Check required v3.0 fields
  for (const f of ['contentVersion', 'contentUpdatedAt', 'provider', 'palette']) {
    if (!(f in idx)) error(examId, `index.json missing required field "${f}"`);
  }

  // Load all questions
  const seenIds = new Map(); // id → file
  const allQuestions = [];

  for (const qf of (idx.questionFiles ?? [])) {
    const qPath = qf.startsWith('content/')
      ? join(ROOT, 'public', qf)
      : join(ROOT, qf);
    if (!existsSync(qPath)) { error(examId, `questionFile not found: ${qf}`); continue; }
    const questions = loadJson(qPath);
    if (!Array.isArray(questions)) { error(examId, `${qf} is not a JSON array`); continue; }
    allQuestions.push(...questions.map((q) => ({ ...q, _file: qf })));
  }

  // Analyse questions
  for (const q of allQuestions) {
    stats.totalQuestions++;

    // Duplicate ID check
    if (q.id) {
      if (seenIds.has(q.id)) {
        error(examId, `duplicate question id "${q.id}" (also in ${seenIds.get(q.id)})`);
        stats.duplicateIds++;
      } else {
        seenIds.set(q.id, q._file);
      }
    }

    // Tags taxonomy check
    if (!Array.isArray(q.tags) || q.tags.length === 0) {
      error(examId, `question "${q.id ?? '?'}" has missing or empty tags`);
    } else if (q.tags.some((t) => typeof t !== 'string')) {
      error(examId, `question "${q.id ?? '?'}" has non-string tag entries`);
    } else {
      stats.withTags++;
    }

    // Difficulty coverage
    if ('difficulty' in q) {
      if (!VALID_DIFFICULTIES.has(q.difficulty)) {
        error(examId, `question "${q.id ?? '?'}" has invalid difficulty "${q.difficulty}"`);
      } else {
        stats.withDifficulty++;
      }
    }

    // Per-domain count
    if (q.domain != null) {
      stats.domainCounts[q.domain] = (stats.domainCounts[q.domain] ?? 0) + 1;
    }
  }

  // Domain coverage: every domain in index should have at least 1 question
  for (const domain of (idx.domains ?? [])) {
    const count = stats.domainCounts[domain.id] ?? 0;
    if (count === 0) {
      error(examId, `domain ${domain.id} ("${domain.title}") has 0 questions`);
      stats.missingDomains.push(domain.id);
    }
  }

  // Difficulty coverage warning (< 50% is noteworthy — not a hard failure)
  const diffPct = stats.totalQuestions > 0
    ? Math.round((stats.withDifficulty / stats.totalQuestions) * 100)
    : 0;
  if (diffPct < 50) {
    warn(examId, `difficulty coverage ${diffPct}% (${stats.withDifficulty}/${stats.totalQuestions}) — target ≥ 50%`);
  }

  return stats;
}

// ── main ──────────────────────────────────────────────────────────────────────

// Once skillup is CDN-promoted (a `skillup` entry exists in
// content-manifest.json), this repo no longer holds the raw content these
// deep per-question checks (duplicate IDs, per-domain counts, tag/difficulty
// coverage) operate on — that quality gate is now the vertical repo's own
// concern (its CI already runs schema validation; deep quality auditing is a
// natural extension there, not something to fetch-and-recheck here). Skip
// cleanly rather than hard-failing the weekly cron against a directory that
// may no longer exist.
const manifestPath = join(ROOT, 'content-manifest.json');
if (existsSync(manifestPath)) {
  const manifest = loadJson(manifestPath) ?? {};
  if (manifest.skillup?.repo && manifest.skillup?.sha) {
    console.log('⚠ skillup is CDN-promoted — content health checks now live in that repo. Skipping.');
    process.exit(0);
  }
}

const examIds = discoverExams();
if (examIds.length === 0) {
  console.error('No exams found in public/content/skillup/');
  process.exit(1);
}

console.log(`\n  Content Health Report — ${new Date().toISOString().slice(0, 10)}\n`);
console.log(`  Exams found: ${examIds.join(', ')}\n`);

const results = [];
for (const id of examIds) {
  const stats = checkExam(id);
  if (stats) results.push(stats);
}

// ── summary table ─────────────────────────────────────────────────────────────

if (results.length > 0) {
  const col = (s, w) => String(s).padEnd(w);
  const header = `  ${ col('Exam', 8) }${ col('Qs', 6) }${ col('Difficulty%', 12) }${ col('Dupes', 7) }${ col('MissingDomains', 16) }`;
  console.log(header);
  console.log('  ' + '-'.repeat(header.length - 2));
  for (const s of results) {
    const diffPct = s.totalQuestions > 0
      ? Math.round((s.withDifficulty / s.totalQuestions) * 100)
      : 0;
    console.log(
      `  ${ col(s.examId, 8) }${ col(s.totalQuestions, 6) }${ col(diffPct + '%', 12) }${ col(s.duplicateIds, 7) }${ col(s.missingDomains.join(',') || '—', 16) }`
    );
  }
}

console.log('');

if (criticalErrors > 0) {
  console.error(`  Content health: ${criticalErrors} critical error(s). ❌\n`);
  process.exit(1);
} else {
  console.log(`  Content health: all checks passed. ✅\n`);
}
