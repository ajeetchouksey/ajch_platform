#!/usr/bin/env node
/**
 * validate-agent-file.mjs
 * Lightweight sanity gate for files written by sync-vertical-agents.mjs.
 *
 * Deliberately NOT a full content review — the content itself was already
 * human-reviewed when it landed on ajch_platform's own protected main via
 * normal PR review. This only catches mechanical sync/rewrite bugs:
 *   - malformed/missing frontmatter
 *   - leftover placeholder text
 *   - a public/content/{vertical}/ reference the path-rewrite regex missed
 *
 * Usage: node scripts/validate-agent-file.mjs <vertical> <file> [<file> ...]
 * Exit 0 = all files pass. Exit 1 = at least one violation (printed to stderr).
 */
import { readFileSync } from 'fs';

const [, , vertical, ...files] = process.argv;
if (!vertical || files.length === 0) {
  console.error('Usage: node scripts/validate-agent-file.mjs <vertical> <file> [<file> ...]');
  process.exit(1);
}

const PLACEHOLDER_RE = /\b(TODO|FIXME|REPLACE_WITH_[A-Z_]*)\b/;
const STALE_PATH_RE = new RegExp(`public/content/${vertical}/`);

let errors = 0;
function fail(file, msg) {
  console.error(`  ❌  ${file}: ${msg}`);
  errors++;
}

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf-8');
  } catch (err) {
    fail(file, `could not read: ${err.message}`);
    continue;
  }

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    fail(file, 'missing or malformed frontmatter (expected --- ... --- block at top)');
  } else {
    const fm = fmMatch[1];
    if (!/^name:/m.test(fm)) fail(file, 'frontmatter missing "name" field');
    if (!/^description:/m.test(fm)) fail(file, 'frontmatter missing "description" field');
  }

  const placeholderMatch = content.match(PLACEHOLDER_RE);
  if (placeholderMatch) {
    fail(file, `leftover placeholder text: "${placeholderMatch[0]}"`);
  }

  if (STALE_PATH_RE.test(content)) {
    fail(file, `contains public/content/${vertical}/ — path-rewrite missed a reference`);
  }
}

if (errors > 0) {
  console.error(`\n  ${errors} violation(s) found.`);
  process.exit(1);
}

console.log(`  ✅  ${files.length} file(s) passed agent-file validation`);
