#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
// The running app fetches /content-manifest.json at runtime, which Vite
// serves from public/ -- not the repo-root copy. Both must stay in sync or
// a "successful" promotion silently never reaches the live site.
const manifestPaths = [
  path.join(repoRoot, 'content-manifest.json'),
  path.join(repoRoot, 'public', 'content-manifest.json'),
];

const usage = `Usage:
  node scripts/sync-vertical-repo.mjs <vertical> <repo> <sha> [--base-url <url>]

Examples:
  node scripts/sync-vertical-repo.mjs blog ajch-platform-blog abc1234
  node scripts/sync-vertical-repo.mjs skillup ajch-platform-skillup def5678 --base-url https://cdn.jsdelivr.net/gh
`;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 3) {
  fail(usage);
}

const [vertical, repo, sha, ...rest] = args;
const baseUrlIndex = rest.indexOf('--base-url');
const baseUrl = baseUrlIndex >= 0 ? rest[baseUrlIndex + 1] : 'https://cdn.jsdelivr.net/gh';

if (!vertical || !repo || !sha) {
  fail(usage);
}

if (!/^blog|skillup|usecases|interviews|pathways|platform-docs$/.test(vertical)) {
  fail(`Unsupported vertical: ${vertical}. Expected one of: blog, skillup, usecases, interviews, pathways, platform-docs`);
}

const promotedAt = new Date().toISOString();

for (const manifestPath of manifestPaths) {
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {};

  manifest[vertical] = { repo, sha, baseUrl, promotedAt };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ Updated ${vertical} in ${path.relative(repoRoot, manifestPath)}`);
}

console.log(`  repo: ${repo}`);
console.log(`  sha: ${sha}`);
console.log(`  baseUrl: ${baseUrl}`);
