#!/usr/bin/env node
/**
 * validate-content.mjs
 * Pre-commit content quality gate.
 * Called by lint-staged with staged file paths as arguments.
 *
 * Checks:
 *  - JSON: parse validity
 *  - questions/*.json: MCQ schema (domain, id, question, options, correct, explanation, tags)
 *  - blog/index.json: post index schema (slug, title, author, date, tags)
 *  - *.md: empty file check, unclosed frontmatter check
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const files = process.argv.slice(2);
if (files.length === 0) {
  process.exit(0);
}

let errors = 0;

function fail(file, msg) {
  console.error(`  ❌  ${file}: ${msg}`);
  errors++;
}

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
        for (const [i, item] of items.entries()) {
          validateQuestion(rawPath, item, i);
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
