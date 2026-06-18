/**
 * generate-og-shells.mjs
 *
 * Runs after `vite build`. For every blog post and skillup exam it writes:
 *   dist/blog/{slug}/index.html
 *   dist/skillup/{examId}/index.html
 *
 * Each file is a copy of dist/index.html with per-page OG / Twitter meta tags
 * injected. Bots (LinkedIn, Twitter, Slack…) read the meta tags and stop.
 * Real users get the full React SPA because the Vite JS bundle is still linked.
 *
 * No Cloudflare, no DNS changes, no extra runtime — works on GitHub Pages.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');
const distDir   = join(root, 'dist');
const contentDir = join(root, 'public', 'content');

const SITE          = 'https://aaryaai.dev';
const DEFAULT_IMAGE = `${SITE}/og-preview.png`;

// ── helpers ───────────────────────────────────────────────────────────────────

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectOG(template, { url, title, description, image, type }) {
  image = image || DEFAULT_IMAGE;
  return template
    .replace(/<meta property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url"         content="${url}" />`)
    .replace(/<meta property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title"       content="${esc(title)}" />`)
    .replace(/<meta property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:image"\s+content="[^"]*"\s*\/>/, `<meta property="og:image"       content="${image}" />`)
    .replace(/<meta property="og:type"\s+content="[^"]*"\s*\/>/, `<meta property="og:type"        content="${type || 'article'}" />`)
    .replace(/<meta name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title"       content="${esc(title)}" />`)
    .replace(/<meta name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(description)}" />`)
    .replace(/<meta name="twitter:image"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:image"       content="${image}" />`)
    .replace(/<link rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`);
}

function writeShell(relPath, html) {
  const dir = join(distDir, relPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

// ── load dist/index.html template ─────────────────────────────────────────────

let template;
try {
  template = readFileSync(join(distDir, 'index.html'), 'utf-8');
} catch {
  console.error('✗ generate-og-shells: dist/index.html not found — run vite build first');
  process.exit(1);
}

let count = 0;

// ── blog posts ────────────────────────────────────────────────────────────────

const blogIndex = JSON.parse(readFileSync(join(contentDir, 'blog', 'index.json'), 'utf-8'));
const posts = blogIndex.posts.filter(p => !p.draft);

for (const post of posts) {
  const html = injectOG(template, {
    url:         `${SITE}/blog/${post.slug}`,
    title:       `${post.title} | Aarya`,
    description: post.excerpt || `Read "${post.title}" on Aarya — My AI Learning Hub.`,
    type:        'article',
  });
  writeShell(`blog/${post.slug}`, html);
  count++;
}

// ── skillup exams ─────────────────────────────────────────────────────────────

try {
  const catalog = JSON.parse(readFileSync(join(contentDir, 'skillup', 'catalog.json'), 'utf-8'));
  const exams = (catalog.exams || []).filter(e => e.available);

  for (const exam of exams) {
    const html = injectOG(template, {
      url:         `${SITE}/skillup/${exam.id}`,
      title:       `${exam.title} (${exam.shortTitle}) | Aarya`,
      description: exam.description || `Practitioner-built certification prep for ${exam.shortTitle} on Aarya.`,
      type:        'website',
    });
    writeShell(`skillup/${exam.id}`, html);
    count++;
  }
} catch {
  // catalog may not exist yet — silently skip
}

console.log(`✓ generate-og-shells: wrote ${count} OG shell files into dist/`);
