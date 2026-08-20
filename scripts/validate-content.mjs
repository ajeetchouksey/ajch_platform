#!/usr/bin/env node
/**
 * validate-content.mjs
 * Pre-commit content quality gate.
 * Called by lint-staged with staged file paths as arguments.
 *
 * Checks:
 *  - JSON: parse validity
 *  - questions/*.json: MCQ schema (domain, id, question, options, correct, explanation, tags)
 *  - skillup/{examId}/index.json: required fields + file references exist
 *  - skillup/{examId}/task-statements.json: questionIds resolve to actual question files
 *  - blog/index.json: post index schema (slug, title, author, date, tags)
 *  - *.md: empty file check, unclosed frontmatter check
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const files = process.argv.slice(2);
if (files.length === 0) {
  process.exit(0);
}

let errors = 0;

function fail(file, msg) {
  console.error(`  ❌  ${file}: ${msg}`);
  errors++;
}

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

function validateQuestion(file, item, index) {
  const required = ['domain', 'id', 'question', 'options', 'correct', 'explanation', 'tags'];
  for (const field of required) {
    if (!(field in item)) {
      fail(file, `item[${index}] missing required field "${field}"`);
    }
  }
  if (Array.isArray(item.options) && item.options.length < 2) {
    fail(file, `item[${index}] "options" must have at least 2 entries`);
  }
  if (
    typeof item.correct === 'number' &&
    Array.isArray(item.options) &&
    item.correct >= item.options.length
  ) {
    fail(file, `item[${index}] "correct" index ${item.correct} is out of range (${item.options.length} options)`);
  }
  // tags must be a non-empty array of strings
  if ('tags' in item) {
    if (!Array.isArray(item.tags) || item.tags.length === 0) {
      fail(file, `item[${index}] "tags" must be a non-empty array`);
    } else if (item.tags.some((t) => typeof t !== 'string')) {
      fail(file, `item[${index}] "tags" entries must all be strings`);
    }
  }
  // difficulty is optional but must be a recognised value when set
  if ('difficulty' in item && !VALID_DIFFICULTIES.has(item.difficulty)) {
    fail(file, `item[${index}] "difficulty" must be easy|medium|hard, got "${item.difficulty}"`);
  }
}

function validateBlogIndex(file, data) {
  if (!Array.isArray(data.posts)) {
    fail(file, '"posts" must be an array');
    return;
  }
  for (const [i, post] of data.posts.entries()) {
    for (const field of ['slug', 'title', 'author', 'date', 'tags']) {
      if (!post[field]) {
        fail(file, `posts[${i}] missing required field "${field}"`);
      }
    }
    if (post.date && !/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
      fail(file, `posts[${i}] "date" must be YYYY-MM-DD format, got "${post.date}"`);
    }
  }
}

function validateScenario(file, item, index) {
  const required = ['id', 'title', 'description'];
  for (const field of required) {
    if (!(field in item)) {
      fail(file, `item[${index}] missing required field "${field}"`);
    }
  }
}

const INDEX_REQUIRED = [
  'schemaVersion', 'id', 'examCode', 'title', 'shortTitle',
  'contentLevel', 'description', 'questions', 'duration',
  'passScore', 'passThreshold', 'examFee',
  'available', 'accentColor', 'colorScheme',
  'domains', 'questionFiles', 'taskStatementsFile', 'resources',
  // v3.0 content-versioning fields (required)
  'contentVersion', 'contentUpdatedAt', 'provider', 'palette',
];

// This script is a canonical copy synced verbatim across ajch_platform (where
// content lives at public/content/...) and each standalone vertical repo
// (where the same relative paths, e.g. "content/skillup/...", live directly
// at the repo root with no public/ prefix). Auto-detect which layout we're
// running in rather than hardcoding one — keeps the copies genuinely
// identical instead of needing a per-repo fork of this file.
const CONTENT_BASE = existsSync(join(ROOT, 'public')) ? join(ROOT, 'public') : ROOT;

function absContent(relativePath) {
  if (relativePath.startsWith('content/')) return join(CONTENT_BASE, relativePath);
  return join(ROOT, relativePath);
}

function validateExamIndex(file, data) {
  for (const f of INDEX_REQUIRED) {
    if (!(f in data)) fail(file, `missing required field "${f}"`);
  }
  // palette must have all five CSS sub-fields
  if (data.palette && typeof data.palette === 'object') {
    for (const pf of ['color', 'bg', 'border', 'glow', 'btn']) {
      if (!(pf in data.palette)) fail(file, `palette missing required sub-field "${pf}"`);
    }
  }
  // provider must be a non-empty string
  if ('provider' in data && (typeof data.provider !== 'string' || !data.provider.trim())) {
    fail(file, `"provider" must be a non-empty string`);
  }
  // Domain notesFile references
  if (Array.isArray(data.domains)) {
    for (const d of data.domains) {
      if (d.notesFile && !existsSync(absContent(d.notesFile))) {
        fail(file, `domain ${d.id}: notesFile not found → ${d.notesFile}`);
      }
    }
  }
  // questionFiles references
  if (Array.isArray(data.questionFiles)) {
    for (const qf of data.questionFiles) {
      if (!existsSync(absContent(qf))) fail(file, `questionFile not found → ${qf}`);
    }
  }
  // taskStatementsFile reference
  if (data.taskStatementsFile && !existsSync(absContent(data.taskStatementsFile))) {
    fail(file, `taskStatementsFile not found → ${data.taskStatementsFile}`);
  }
}

function validateTaskStatements(file, data, idx) {
  if (!idx) return; // no companion index.json found — skip cross-check

  // Collect all real question IDs from the exam's question files
  const allIds = new Set();
  if (Array.isArray(idx.questionFiles)) {
    for (const qf of idx.questionFiles) {
      const qPath = absContent(qf);
      if (!existsSync(qPath)) continue;
      try {
        const qs = JSON.parse(readFileSync(qPath, 'utf8'));
        if (Array.isArray(qs)) qs.forEach(q => { if (q.id) allIds.add(q.id); });
      } catch { /* parse errors caught by the question validator */ }
    }
  }
  if (allIds.size === 0) return;

  if (Array.isArray(data.domains)) {
    for (const domain of data.domains) {
      if (!Array.isArray(domain.tasks)) continue;
      for (const task of domain.tasks) {
        if (!Array.isArray(task.questionIds)) continue;
        for (const qid of task.questionIds) {
          if (!allIds.has(qid)) {
            fail(file, `task ${task.id}: questionId "${qid}" not found in question files`);
          }
        }
      }
    }
  }
}

for (const rawPath of files) {
  const file = resolve(rawPath);
  const normalized = rawPath.replace(/\\/g, '/');

  if (rawPath.endsWith('.json')) {
    let data;
    try {
      const raw = readFileSync(file, 'utf8');
      data = JSON.parse(raw);
    } catch (e) {
      if (e instanceof SyntaxError) {
        fail(rawPath, `Invalid JSON — ${e.message}`);
      } else {
        fail(rawPath, e.message);
      }
      continue;
    }

    // MCQ question files
    if (/\/questions\//.test(normalized)) {
      const items = Array.isArray(data) ? data : [];
      if (!Array.isArray(data)) {
        fail(rawPath, 'Question file must be a JSON array');
      } else {
        const seenIds = new Set();
        for (const [i, item] of items.entries()) {
          validateQuestion(rawPath, item, i);
          if (item.id) {
            if (seenIds.has(item.id)) {
              fail(rawPath, `duplicate question id "${item.id}" at index ${i}`);
            }
            seenIds.add(item.id);
          }
        }
      }
      continue;
    }

    // Blog index
    if (/\/blog\/index\.json$/.test(normalized)) {
      validateBlogIndex(rawPath, data);
      continue;
    }

    // Scenario files
    if (/\/scenarios\//.test(normalized)) {
      const items = Array.isArray(data) ? data : [data];
      for (const [i, item] of items.entries()) {
        validateScenario(rawPath, item, i);
      }
      continue;
    }

    // Exam index.json files
    if (/\/skillup\/[^/]+\/index\.json$/.test(normalized)) {
      validateExamIndex(rawPath, data);
      continue;
    }

    // task-statements.json — cross-check questionIds against sibling question files
    if (/\/skillup\/[^/]+\/task-statements\.json$/.test(normalized)) {
      // Load the companion index.json to get questionFiles list
      const idxPath = file.replace('task-statements.json', 'index.json');
      let idx = null;
      if (existsSync(idxPath)) {
        try { idx = JSON.parse(readFileSync(idxPath, 'utf8')); } catch { /* ignore */ }
      }
      validateTaskStatements(rawPath, data, idx);
      continue;
    }

    // All other JSON: parse-only check (already passed above)
  } else if (rawPath.endsWith('.md')) {
    try {
      const raw = readFileSync(file, 'utf8');
      if (raw.trim().length === 0) {
        fail(rawPath, 'File is empty');
        continue;
      }
      // Validate frontmatter closure if present
      if (raw.startsWith('---')) {
        const end = raw.indexOf('\n---', 3);
        if (end === -1) {
          fail(rawPath, 'Unclosed frontmatter — "---" opened but never closed');
        }
      }
    } catch (e) {
      fail(rawPath, e.message);
    }
  }
}

if (errors > 0) {
  console.error(`\n  Content validation: ${errors} error(s). Commit blocked.\n`);
  process.exit(1);
} else {
  console.log(`  ✅  Content validation passed (${files.length} file(s))`);
}
