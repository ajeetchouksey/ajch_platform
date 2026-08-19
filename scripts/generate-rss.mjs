/**
 * Build-time RSS 2.0 feed generator (GAP-6 increment 2).
 * Reads:  blog/index.json — from the CDN-promoted vertical repo if
 *         content-manifest.json has a `blog` entry, else the local
 *         public/content/blog/index.json (pre-migration fallback).
 * Writes: public/rss.xml
 * Usage:  node scripts/generate-rss.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BASE_URL = 'https://aaryaai.dev';
const CONTENT_MANIFEST_PATH = join(ROOT, 'content-manifest.json');
const LOCAL_MANIFEST_PATH = join(ROOT, 'public', 'content', 'blog', 'index.json');
const OUTPUT_PATH = join(ROOT, 'public', 'rss.xml');

// Security: escape all user-controlled strings before insertion into XML.
// & must be replaced first to avoid double-escaping subsequent replacements.
function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Convert ISO YYYY-MM-DD to RFC 822 (e.g. "Mon, 07 Jul 2025 00:00:00 GMT").
function toRfc822(isoDate) {
  return new Date(isoDate + 'T00:00:00Z').toUTCString();
}

// --- Resolve & read blog manifest ---------------------------------------------
// Mirrors src/lib/content-manifest.ts's resolution rule (manifest repo+sha wins,
// else local path) — reimplemented here since that module is browser-oriented
// (import.meta.env/window) and this script runs in a plain Node build step.
async function loadBlogManifest() {
  if (existsSync(CONTENT_MANIFEST_PATH)) {
    const manifest = JSON.parse(readFileSync(CONTENT_MANIFEST_PATH, 'utf-8'));
    const blog = manifest.blog;
    if (blog?.repo && blog?.sha) {
      const baseUrl = (blog.baseUrl ?? 'https://cdn.jsdelivr.net/gh').replace(/\/$/, '');
      const url = `${baseUrl}/${blog.repo}@${blog.sha}/content/blog/index.json`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[rss] ERROR: could not fetch ${url} — HTTP ${res.status}`);
        process.exit(1);
      }
      return res.json();
    }
  }

  try {
    return JSON.parse(readFileSync(LOCAL_MANIFEST_PATH, 'utf-8'));
  } catch (err) {
    console.error(`[rss] ERROR: could not read ${LOCAL_MANIFEST_PATH}`);
    console.error(err.message);
    process.exit(1);
  }
}

const manifest = await loadBlogManifest();

// Security: validate slug before embedding in URLs — slugs must be URL-safe
// and contain no XML-special characters.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// --- Filter & sort -----------------------------------------------------------
const posts = (manifest.posts ?? [])
  .filter((p) => {
    if (p.draft === true) return false;
    if (!SLUG_RE.test(p.slug)) {
      console.warn(`[rss] SKIP: invalid slug "${p.slug}"`);
      return false;
    }
    return true;
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

// --- Build XML ---------------------------------------------------------------
const lastBuildDate = posts.length > 0 ? toRfc822(posts[0].date) : new Date().toUTCString();

const items = posts
  .map((post) => {
    const url = `${BASE_URL}/blog/${post.slug}`;
    return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${xmlEscape(post.excerpt)}</description>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <author>${xmlEscape(post.author)}</author>
      <category>${xmlEscape(post.category)}</category>
    </item>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Aarya — My AI Learning Hub</title>
    <link>${BASE_URL}</link>
    <description>AI learning resources, exam prep, and engineering insights</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

// --- Write output ------------------------------------------------------------
writeFileSync(OUTPUT_PATH, xml, 'utf-8');
console.log(`[rss] Generated public/rss.xml — ${posts.length} posts`);
