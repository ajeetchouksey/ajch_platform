#!/usr/bin/env node
/**
 * check-exam-completeness.mjs
 * Audits every exam in public/content/skillup/ and prints a completeness
 * dashboard to stdout.
 *
 * Usage:
 *   node scripts/check-exam-completeness.mjs
 *   node scripts/check-exam-completeness.mjs --strict      (exit 1 if any issues found)
 *   node scripts/check-exam-completeness.mjs --exam ab731  (single exam)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SKILLUP_DIR = join(ROOT, 'public', 'content', 'skillup');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const FILTER_EXAM = (() => {
  const i = args.indexOf('--exam');
  return i !== -1 ? args[i + 1] : null;
})();

// ANSI colours
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const DIM    = '\x1b[2m';

// ── Helpers ───────────────────────────────────────────────────────────────────

function readJson(absPath) {
  try { return JSON.parse(readFileSync(absPath, 'utf8')); }
  catch { return null; }
}

/** Resolve a content-relative path (e.g. "content/skillup/...") to absolute. */
function absContent(relativePath) {
  if (relativePath.startsWith('content/')) return join(ROOT, 'public', relativePath);
  return join(ROOT, relativePath);
}

function pct(score, total) {
  if (total === 0) return 100;
  return Math.round((score / total) * 100);
}

function bar(score, total) {
  const p = pct(score, total);
  const filled = Math.round(p / 5);
  return '[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + `] ${p}%`;
}

function colorFor(p) {
  if (p === 100) return GREEN;
  if (p >= 80)   return YELLOW;
  return RED;
}

// ── Canonical required fields for index.json ──────────────────────────────────

const INDEX_REQUIRED = [
  'schemaVersion', 'id', 'examCode', 'title', 'shortTitle',
  'contentLevel', 'description', 'questions', 'duration',
  'passScore', 'passThreshold', 'examFee',
  'available', 'accentColor', 'colorScheme',
  'domains', 'questionFiles', 'taskStatementsFile', 'resources',
];

// ── Check functions ───────────────────────────────────────────────────────────

function checkIndex(idx) {
  const issues = [];
  const warnings = [];

  for (const f of INDEX_REQUIRED) {
    if (!(f in idx)) issues.push(`missing required field: "${f}"`);
  }

  if (Array.isArray(idx.domains)) {
    for (const d of idx.domains) {
      if (!d.notesFile) {
        warnings.push(`domain ${d.id} ("${d.title}"): missing notesFile`);
      } else if (!existsSync(absContent(d.notesFile))) {
        issues.push(`domain ${d.id}: notesFile not found → ${d.notesFile}`);
      }
    }
  }

  if (Array.isArray(idx.questionFiles)) {
    for (const qf of idx.questionFiles) {
      if (!existsSync(absContent(qf))) issues.push(`questionFile not found → ${qf}`);
    }
  }

  if (idx.taskStatementsFile && !existsSync(absContent(idx.taskStatementsFile))) {
    issues.push(`taskStatementsFile not found → ${idx.taskStatementsFile}`);
  }

  if (Array.isArray(idx.scenarioFiles)) {
    for (const sf of idx.scenarioFiles) {
      if (!existsSync(absContent(sf))) issues.push(`scenarioFile not found → ${sf}`);
    }
  }

  // Actual question count vs declared
  if (Array.isArray(idx.questionFiles)) {
    let actual = 0;
    for (const qf of idx.questionFiles) {
      const data = readJson(absContent(qf));
      if (Array.isArray(data)) actual += data.length;
    }
    if (actual > 0 && actual !== idx.questions) {
      issues.push(`question count mismatch: index.json says ${idx.questions}, files contain ${actual}`);
    }
  }

  return { issues, warnings };
}

function checkTaskStatements(idx) {
  const issues = [];
  const warnings = [];

  if (!idx.taskStatementsFile) return { issues, warnings };
  const tsPath = absContent(idx.taskStatementsFile);
  if (!existsSync(tsPath)) return { issues, warnings };

  const ts = readJson(tsPath);
  if (!ts) { issues.push('task-statements.json is invalid JSON'); return { issues, warnings }; }

  const allIds = new Set();
  if (Array.isArray(idx.questionFiles)) {
    for (const qf of idx.questionFiles) {
      const data = readJson(absContent(qf));
      if (Array.isArray(data)) data.forEach(q => { if (q.id) allIds.add(q.id); });
    }
  }

  const mappedIds = new Set();
  if (Array.isArray(ts.domains)) {
    for (const domain of ts.domains) {
      if (!Array.isArray(domain.tasks)) continue;
      for (const task of domain.tasks) {
        if (!Array.isArray(task.questionIds) || task.questionIds.length === 0) {
          warnings.push(`task ${task.id}: no questionIds — consider adding coverage`);
          continue;
        }
        if (task.questionIds.length < 3) {
          warnings.push(`task ${task.id}: only ${task.questionIds.length} question(s) — low coverage`);
        }
        for (const qid of task.questionIds) {
          mappedIds.add(qid);
          if (!allIds.has(qid)) {
            issues.push(`task ${task.id}: questionId "${qid}" not found in question files`);
          }
        }
      }
    }
  }

  for (const id of allIds) {
    if (!mappedIds.has(id)) warnings.push(`orphaned question: "${id}" not mapped to any task`);
  }

  return { issues, warnings };
}

function checkNotesCoverage(idx) {
  const warnings = [];
  if (!Array.isArray(idx.domains)) return warnings;
  for (const d of idx.domains) {
    if (!d.notesFile) continue;
    const p = absContent(d.notesFile);
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf8');
    if ((content.match(/^#{1,3} /gm) || []).length === 0) {
      warnings.push(`domain ${d.id}: notes file has no headings`);
    }
  }
  return warnings;
}

// ── Audit one exam ────────────────────────────────────────────────────────────

function auditExam(examId) {
  const idxPath = join(SKILLUP_DIR, examId, 'index.json');
  if (!existsSync(idxPath)) return null;

  const idx = readJson(idxPath);
  if (!idx) {
    return { examId, examCode: examId, title: examId, score: 0, totalChecks: 1,
             issues: ['index.json is invalid JSON'], warnings: [] };
  }

  const { issues: i1, warnings: w1 } = checkIndex(idx);
  const { issues: i2, warnings: w2 } = checkTaskStatements(idx);
  const w3 = checkNotesCoverage(idx);

  const allIssues   = [...i1, ...i2];
  const allWarnings = [...w1, ...w2, ...w3];

  const totalChecks =
    INDEX_REQUIRED.length +
    (idx.domains?.length ?? 0) +
    (idx.questionFiles?.length ?? 0) +
    (idx.taskStatementsFile ? 1 : 0);

  return {
    examId,
    examCode: idx.examCode ?? examId,
    title: idx.title ?? examId,
    score: Math.max(0, totalChecks - allIssues.length),
    totalChecks,
    issues: allIssues,
    warnings: allWarnings,
  };
}

// ── Discover exams ─────────────────────────────────────────────────────────────

if (!existsSync(SKILLUP_DIR)) {
  console.error(`SkillUp directory not found: ${SKILLUP_DIR}`);
  process.exit(1);
}

const examIds = readdirSync(SKILLUP_DIR)
  .filter(d => statSync(join(SKILLUP_DIR, d)).isDirectory())
  .filter(d => existsSync(join(SKILLUP_DIR, d, 'index.json')))
  .filter(d => !FILTER_EXAM || d === FILTER_EXAM);

if (examIds.length === 0) {
  console.error(FILTER_EXAM
    ? `Exam "${FILTER_EXAM}" not found in ${SKILLUP_DIR}`
    : `No exams found in ${SKILLUP_DIR}`);
  process.exit(1);
}

// ── Render ─────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}╔════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║       SkillUp — Exam Completeness Audit             ║${RESET}`);
console.log(`${BOLD}╚════════════════════════════════════════════════════╝${RESET}\n`);

let totalIssues = 0;

for (const examId of examIds) {
  const r = auditExam(examId);
  if (!r) continue;

  const p = pct(r.score, r.totalChecks);
  const c = colorFor(p);

  console.log(`${BOLD}${c}${r.examCode}${RESET}  ${DIM}${r.title}${RESET}`);
  console.log(`  ${c}${bar(r.score, r.totalChecks)}${RESET}  ${DIM}(${r.score}/${r.totalChecks} checks)${RESET}`);

  for (const issue of r.issues) {
    console.log(`  ${RED}✗${RESET} ${issue}`);
    totalIssues++;
  }
  for (const warn of r.warnings) {
    console.log(`  ${YELLOW}⚠${RESET} ${warn}`);
  }
  if (r.issues.length === 0 && r.warnings.length === 0) {
    console.log(`  ${GREEN}✓ All checks passed${RESET}`);
  }
  console.log();
}

if (totalIssues === 0) {
  console.log(`${GREEN}${BOLD}All ${examIds.length} exam(s) passed all checks ✓${RESET}\n`);
} else {
  console.log(`${RED}${BOLD}${totalIssues} issue(s) found. Fix before adding new content.${RESET}`);
  console.log(`${DIM}Tip: node scripts/check-exam-completeness.mjs --exam <id> to focus on one exam.${RESET}\n`);
}

if (STRICT && totalIssues > 0) process.exit(1);
