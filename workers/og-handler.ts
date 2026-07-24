/**
 * aarya-og — Cloudflare Worker
 * Per-page Open Graph tag injector for aaryaai.dev
 *
 * Problem: aaryaai.dev is a client-side React SPA. Social crawlers
 * (LinkedInBot, Twitterbot, Slackbot…) fetch raw HTML before JavaScript runs,
 * so they always see the same site-level og:title/og:description from index.html.
 *
 * Solution: This Worker intercepts requests from known bot User-Agents and
 * returns a minimal HTML shell with correct per-page OG meta tags.
 * Real users pass straight through to the SPA, unchanged.
 *
 * No secrets required. No KV bindings. Fully stateless.
 *
 * ── Deployment ────────────────────────────────────────────────────────────────
 * Prerequisites:
 *   1. aaryaai.dev DNS must be proxied through Cloudflare (orange-cloud icon).
 *   2. Fill in your zone_id in wrangler.og.toml (Cloudflare Dashboard → Zone).
 *
 * Deploy:
 *   npx wrangler deploy --config wrangler.og.toml
 *
 * Verify with LinkedIn Post Inspector:
 *   https://www.linkedin.com/post-inspector/inspect/?url=https://aaryaai.dev/blog/<slug>
 */

// ── Bot User-Agent patterns ───────────────────────────────────────────────────
// Matches LinkedIn, Twitter/X, Slack, Facebook, WhatsApp, Discord, Telegram,
// and generic SEO crawlers. Real browsers never match these.
const BOT_UA_RE =
  /LinkedInBot|Twitterbot|Slackbot|facebookexternalhit|WhatsApp|Discordbot|TelegramBot|Googlebot|bingbot|crawler|spider|preview/i;

// ── Site constants ────────────────────────────────────────────────────────────
const SITE_URL = 'https://aaryaai.dev';
const SITE_NAME = 'Aarya — My AI Learning Hub';
const SITE_TITLE = 'Aarya — Learn, Build, and Scale with AI';
const SITE_DESCRIPTION =
  'Practitioner-built AI learning hub. Certification prep, 60+ technical articles, and developer tools. Free forever, open source.';
const OG_IMAGE_FALLBACK = `${SITE_URL}/og-preview.png`;

// Manifest cache — avoids a fetch-on-every-request for bots
// Workers are single-threaded so no race conditions.
let _manifestCache: BlogManifest | null = null;
let _manifestFetchedAt = 0;
const MANIFEST_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _interviewBankCache: InterviewQuestion[] | null = null;
let _interviewBankFetchedAt = 0;

let _interviewIndexCache: InterviewIndex | null = null;
let _interviewIndexFetchedAt = 0;

// ── Types ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Env {} // no bindings needed

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string[];
  category: string;
  readingTime: number;
  featured?: boolean;
  draft?: boolean;
  heroImage?: string;
}

interface BlogManifest {
  posts: BlogPost[];
}

interface InterviewQuestion {
  id: string;
  question: string;
  type: string;
  difficulty: string;
  detailedAnswer: { summary: string };
  tags: string[];
}

interface InterviewIndex {
  roles: Array<{ id: string; title: string; description: string }>;
}

// ── OWASP A03 — HTML entity escaping ─────────────────────────────────────────
// All dynamic values interpolated into HTML must pass through esc().
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Blog manifest loader ──────────────────────────────────────────────────────
async function getBlogManifest(): Promise<BlogManifest> {
  const now = Date.now();
  if (_manifestCache && now - _manifestFetchedAt < MANIFEST_TTL_MS) {
    return _manifestCache;
  }
  try {
    const res = await fetch(`${SITE_URL}/content/blog/index.json`, {
      cf: { cacheEverything: true, cacheTtl: 300 },
    });
    if (!res.ok) return { posts: [] };
    _manifestCache = (await res.json()) as BlogManifest;
    _manifestFetchedAt = now;
    return _manifestCache;
  } catch {
    return { posts: [] };
  }
}

async function getInterviewBank(): Promise<InterviewQuestion[]> {
  const now = Date.now();
  if (_interviewBankCache && now - _interviewBankFetchedAt < MANIFEST_TTL_MS) {
    return _interviewBankCache;
  }
  try {
    const res = await fetch(`${SITE_URL}/content/interviews/bank/questions.json`, {
      cf: { cacheEverything: true, cacheTtl: 300 },
    });
    if (!res.ok) return [];
    _interviewBankCache = (await res.json()) as InterviewQuestion[];
    _interviewBankFetchedAt = now;
    return _interviewBankCache;
  } catch {
    return [];
  }
}

async function getInterviewIndex(): Promise<InterviewIndex> {
  const now = Date.now();
  if (_interviewIndexCache && now - _interviewIndexFetchedAt < MANIFEST_TTL_MS) {
    return _interviewIndexCache;
  }
  try {
    const res = await fetch(`${SITE_URL}/content/interviews/index.json`, {
      cf: { cacheEverything: true, cacheTtl: 300 },
    });
    if (!res.ok) return { roles: [] };
    _interviewIndexCache = (await res.json()) as InterviewIndex;
    _interviewIndexFetchedAt = now;
    return _interviewIndexCache;
  } catch {
    return { roles: [] };
  }
}

// ── OG HTML shell builder ─────────────────────────────────────────────────────
function buildOgShell(params: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}): Response {
  const { title, description, image, url, type = 'website' } = params;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="${esc(type)}" />
  <meta property="og:url"         content="${esc(url)}" />
  <meta property="og:title"       content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image"       content="${esc(image)}" />
  <meta property="og:site_name"   content="${esc(SITE_NAME)}" />
  <meta property="og:locale"      content="en_US" />

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image"       content="${esc(image)}" />

  <!-- Canonical points back to the real page -->
  <link rel="canonical" href="${esc(url)}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=300',
      // Don't let search engines index this thin shell — only the real SPA page
      'X-Robots-Tag': 'noindex',
    },
  });
}

// ── Route: /blog/:slug ────────────────────────────────────────────────────────
async function handleBlogSlug(slug: string, pageUrl: string): Promise<Response> {
  const manifest = await getBlogManifest();
  const post = manifest.posts.find((p) => p.slug === slug && !p.draft);

  if (!post) {
    // Unknown slug — return site-level fallback rather than a 404 shell
    return buildOgShell({ title: SITE_TITLE, description: SITE_DESCRIPTION, image: OG_IMAGE_FALLBACK, url: SITE_URL });
  }

  const image = post.heroImage ? `${SITE_URL}${post.heroImage}` : OG_IMAGE_FALLBACK;

  return buildOgShell({
    title: post.title,
    description: post.excerpt,
    image,
    url: pageUrl,
    type: 'article',
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request): Promise<Response> {
    const ua = request.headers.get('user-agent') ?? '';

    // ── Real user — transparent pass-through to the SPA ──────────────────────
    if (!BOT_UA_RE.test(ua)) {
      return fetch(request);
    }

    // ── Bot detected — serve a per-page OG shell ──────────────────────────────
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\//, '').split('/').filter(Boolean);
    const [section, ...rest] = segments;

    // /blog/:slug
    if (section === 'blog' && rest[0]) {
      return handleBlogSlug(rest[0], `${SITE_URL}${url.pathname}`);
    }

    // /horizons/:track/:slug — Horizons learning-path articles (also in blog manifest)
    if (section === 'horizons' && rest.length >= 2 && rest[1]) {
      return handleBlogSlug(rest[1], `${SITE_URL}${url.pathname}`);
    }

    // /interview/q/:id — individual question detail page
    if (section === 'interview' && rest[0] === 'q' && rest[1]) {
      const bank = await getInterviewBank();
      const q = bank.find((item) => item.id === rest[1]);
      if (q) {
        const stem = q.question.length > 120 ? q.question.slice(0, 120) + '…' : q.question;
        return buildOgShell({
          title: `${stem} · Interview Prep | Aarya`,
          description: q.detailedAnswer.summary,
          image: OG_IMAGE_FALLBACK,
          url: `${SITE_URL}${url.pathname}`,
          type: 'article',
        });
      }
    }

    // /interview/:roleId — role pack overview page
    if (section === 'interview' && rest[0] && rest[0] !== 'q') {
      const index = await getInterviewIndex();
      const role = index.roles.find((r) => r.id === rest[0]);
      if (role) {
        return buildOgShell({
          title: `${role.title} Interview Prep · Aarya`,
          description: role.description,
          image: OG_IMAGE_FALLBACK,
          url: `${SITE_URL}${url.pathname}`,
        });
      }
    }

    // /interview — catalog
    if (section === 'interview' && rest.length === 0) {
      return buildOgShell({
        title: 'AI Interview Prep — Aarya',
        description: 'Deep-dive Q&A for AI platform engineers and architects. Real scenarios, worked examples, and architecture diagrams. Free forever.',
        image: OG_IMAGE_FALLBACK,
        url: `${SITE_URL}/interview`,
      });
    }

    // /skillup/:exam — certification exam pages
    if (section === 'skillup' && rest[0]) {
      const exam = rest[0].toUpperCase();
      return buildOgShell({
        title: `${exam} Exam Prep — Aarya`,
        description: `Practice questions, study notes, and concept maps for ${exam} certification. Practitioner-built, free forever.`,
        image: OG_IMAGE_FALLBACK,
        url: `${SITE_URL}${url.pathname}`,
      });
    }

    // /tools
    if (section === 'tools') {
      return buildOgShell({
        title: 'AI Developer Tools — Aarya',
        description:
          'Free AI developer tools: token calculators, prompt templates, schema validators. Built by practitioners, for practitioners.',
        image: OG_IMAGE_FALLBACK,
        url: `${SITE_URL}/tools`,
      });
    }

    // /learn
    if (section === 'learn') {
      return buildOgShell({
        title: 'Learn AI — Paths, Horizons & Certification Prep | Aarya',
        description:
          'Structured AI learning paths from fundamentals to enterprise architecture. Pick your horizon, prep your certification, build real things.',
        image: OG_IMAGE_FALLBACK,
        url: `${SITE_URL}/learn`,
      });
    }

    // Root / and everything else → site-level OG
    return buildOgShell({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      image: OG_IMAGE_FALLBACK,
      url: SITE_URL,
    });
  },
} satisfies ExportedHandler<Env>;
