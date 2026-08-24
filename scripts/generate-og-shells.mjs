/**
 * generate-og-shells.mjs
 *
 * Runs after `vite build`. For every blog post, skillup exam, role-prep pack,
 * and use case it writes:
 *   dist/blog/{slug}/index.html
 *   dist/skillup/{examId}/index.html
 *   dist/roleprep/{roleId}/index.html
 *   dist/usecases/{id}/index.html
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
import { loadBlogIndex, loadSkillupCatalog, loadInterviewsIndex, loadUsecasesSourceIntel } from './lib/content-sources.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');
const distDir   = join(root, 'dist');

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

// Appends a page-specific JSON-LD <script> before </head>, alongside the
// site-wide WebSite/Organization block already in the template.
function injectJsonLd(html, jsonLd) {
  const script = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`;
  return html.replace('</head>', script);
}

function articleJsonLd({ url, title, description, image, datePublished, dateModified, author }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || DEFAULT_IMAGE,
    datePublished,
    dateModified: dateModified || datePublished,
    author: { '@type': 'Person', name: author || 'Aarya' },
    publisher: {
      '@type': 'Organization',
      name: 'Aarya — My AI Learning Hub',
      logo: { '@type': 'ImageObject', url: `${SITE}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

function learningResourceJsonLd({ url, title, description, level }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: title,
    description,
    url,
    provider: { '@type': 'Organization', name: 'Aarya — My AI Learning Hub', url: SITE },
    ...(level ? { educationalLevel: level } : {}),
  };
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

const blogIndex = await loadBlogIndex();
const posts = blogIndex.posts.filter(p => !p.draft);

for (const post of posts) {
  const url = `${SITE}/blog/${post.slug}`;
  const title = `${post.title} | Aarya`;
  const description = post.excerpt || `Read "${post.title}" on Aarya — My AI Learning Hub.`;
  let html = injectOG(template, { url, title, description, type: 'article' });
  html = injectJsonLd(html, articleJsonLd({
    url, title: post.title, description,
    datePublished: post.date,
    dateModified: post.updated,
    author: post.author,
  }));
  writeShell(`blog/${post.slug}`, html);
  count++;
}

// ── skillup exams ─────────────────────────────────────────────────────────────

const skillupCatalog = await loadSkillupCatalog();
if (skillupCatalog) {
  const exams = (skillupCatalog.exams || []).filter(e => e.available);

  for (const exam of exams) {
    const url = `${SITE}/skillup/${exam.id}`;
    const title = `${exam.title} (${exam.shortTitle}) | Aarya`;
    const description = exam.description || `Practitioner-built certification prep for ${exam.shortTitle} on Aarya.`;
    let html = injectOG(template, { url, title, description, type: 'website' });
    html = injectJsonLd(html, learningResourceJsonLd({
      url, title: exam.title, description, level: exam.contentLevel,
    }));
    writeShell(`skillup/${exam.id}`, html);
    count++;
  }
}

// ── role-prep packs ──────────────────────────────────────────────────────────

const interviewsIndex = await loadInterviewsIndex();
if (interviewsIndex) {
  const roles = (interviewsIndex.roles || []).filter(r => r.available);

  for (const role of roles) {
    const html = injectOG(template, {
      url:         `${SITE}/roleprep/${role.id}`,
      title:       `${role.title} — Interview Prep | Aarya`,
      description: role.description || `Interview prep pack for ${role.title} on Aarya.`,
      type:        'article',
    });
    writeShell(`roleprep/${role.id}`, html);
    count++;
  }
}

// ── use cases ─────────────────────────────────────────────────────────────────

const usecasesIntel = await loadUsecasesSourceIntel();
if (usecasesIntel) {
  const featuredIds = new Set((usecasesIntel.featuredUseCases || []).map(u => u.id));
  const catalogOnly = (usecasesIntel.catalogUseCases || []).filter(u => !featuredIds.has(u.id));
  const cases = [...(usecasesIntel.featuredUseCases || []), ...catalogOnly];

  for (const useCase of cases) {
    const html = injectOG(template, {
      url:         `${SITE}/usecases/${useCase.id}`,
      title:       `${useCase.title} | Aarya Use Cases`,
      description: useCase.problem || `Enterprise AI agent use case: ${useCase.title} on Aarya.`,
      type:        'article',
    });
    writeShell(`usecases/${useCase.id}`, html);
    count++;
  }
}

console.log(`✓ generate-og-shells: wrote ${count} OG shell files into dist/`);
