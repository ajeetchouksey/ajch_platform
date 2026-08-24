/**
 * generate-sitemap.mjs
 *
 * Runs after `vite build` (alongside generate-og-shells.mjs, which it reuses
 * the content loaders from). Writes dist/sitemap.xml covering every static
 * public route plus every individual blog post, skillup exam, role-prep pack,
 * and use case — the same content-backed pages generate-og-shells.mjs already
 * makes crawlable with per-page metadata. Replaces the old hand-maintained
 * public/sitemap.xml, which only listed 7 top-level routes.
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadBlogIndex, loadSkillupCatalog, loadInterviewsIndex, loadUsecasesSourceIntel } from './lib/content-sources.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');
const distDir   = join(root, 'dist');

const SITE = 'https://aaryaai.dev';
const TODAY = new Date().toISOString().slice(0, 10);

function esc(str = '') {
  return String(str).replace(/&/g, '&amp;');
}

function urlEntry(path, { lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${esc(SITE + path)}</loc>`,
    `    <lastmod>${lastmod || TODAY}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

const entries = [];

// ── static public routes ─────────────────────────────────────────────────────
// Only marketing/content-facing routes — excludes admin/maintainer/auth/
// profile/dashboard/monitoring (private or utility) and redirect-only routes
// (/learn, /exams, /mvp-progress, /analytics).

const STATIC_ROUTES = [
  { path: '/',            changefreq: 'weekly',  priority: '1.0' },
  { path: '/skillup',     changefreq: 'weekly',  priority: '0.9' },
  { path: '/blog',        changefreq: 'daily',   priority: '0.9' },
  { path: '/roleprep',    changefreq: 'weekly',  priority: '0.8' },
  { path: '/usecases',    changefreq: 'weekly',  priority: '0.8' },
  { path: '/notes',       changefreq: 'weekly',  priority: '0.8' },
  { path: '/discovery',   changefreq: 'weekly',  priority: '0.7' },
  { path: '/tools',       changefreq: 'monthly', priority: '0.7' },
  { path: '/tools/token-counter',         changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/context-visualizer',    changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/mcp-scaffold',          changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/system-prompt-builder', changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/model-cost-calc',       changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/tool-schema-builder',   changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/rag-chunk-visualizer',  changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/prompt-tester',         changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/prompt-library',        changefreq: 'monthly', priority: '0.6' },
  { path: '/docs',        changefreq: 'monthly', priority: '0.6' },
  { path: '/contribute',  changefreq: 'monthly', priority: '0.5' },
  { path: '/team',        changefreq: 'monthly', priority: '0.5' },
  { path: '/subscribe',   changefreq: 'monthly', priority: '0.5' },
];

for (const route of STATIC_ROUTES) {
  entries.push(urlEntry(route.path, route));
}

// ── blog posts ────────────────────────────────────────────────────────────────

const blogIndex = await loadBlogIndex();
for (const post of blogIndex.posts.filter(p => !p.draft)) {
  entries.push(urlEntry(`/blog/${post.slug}`, {
    lastmod: post.updated || post.date,
    changefreq: 'monthly',
    priority: '0.7',
  }));
}

// ── skillup exams ─────────────────────────────────────────────────────────────

const skillupCatalog = await loadSkillupCatalog();
if (skillupCatalog) {
  for (const exam of (skillupCatalog.exams || []).filter(e => e.available)) {
    entries.push(urlEntry(`/skillup/${exam.id}`, {
      lastmod: exam.contentUpdatedAt || skillupCatalog.generated,
      changefreq: 'weekly',
      priority: '0.8',
    }));
  }
}

// ── role-prep packs ──────────────────────────────────────────────────────────

const interviewsIndex = await loadInterviewsIndex();
if (interviewsIndex) {
  for (const role of (interviewsIndex.roles || []).filter(r => r.available)) {
    entries.push(urlEntry(`/roleprep/${role.id}`, {
      lastmod: interviewsIndex.generated,
      changefreq: 'monthly',
      priority: '0.6',
    }));
  }
}

// ── use cases ─────────────────────────────────────────────────────────────────

const usecasesIntel = await loadUsecasesSourceIntel();
if (usecasesIntel) {
  const featuredIds = new Set((usecasesIntel.featuredUseCases || []).map(u => u.id));
  const catalogOnly = (usecasesIntel.catalogUseCases || []).filter(u => !featuredIds.has(u.id));
  for (const useCase of [...(usecasesIntel.featuredUseCases || []), ...catalogOnly]) {
    entries.push(urlEntry(`/usecases/${useCase.id}`, {
      lastmod: usecasesIntel.generated,
      changefreq: 'monthly',
      priority: '0.6',
    }));
  }
}

// ── write ─────────────────────────────────────────────────────────────────────

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

writeFileSync(join(distDir, 'sitemap.xml'), xml, 'utf-8');
console.log(`✓ generate-sitemap: wrote ${entries.length} URLs to dist/sitemap.xml`);
