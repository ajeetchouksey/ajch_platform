# SEO Setup Plan — aaryaai.dev

**Prepared:** August 23, 2026, grounded in the live `ajch_platform` repo (v3.5.0)

This is a technical setup plan, not the marketing campaign — it's about making sure Google (and other engines) can actually find, crawl, and rank the site correctly. Distribution/community-sharing (the thing that actually drives backlinks and traffic) is covered in the separate campaign plan already in `marketing/campaign-plan-aaryaai.md` — the two work together: this plan makes sure the site is *findable*, that plan makes sure people *find out about it*.

**What I checked in the repo to ground this:** `index.html`, `public/sitemap.xml`, `public/_headers`, `public/_redirects`, `scripts/generate-og-shells.mjs`, and the full `public/` directory listing.

---

## What's already in good shape

Worth knowing before the fix list, so nothing gets redone unnecessarily:

- **Homepage meta is solid** — real title, meta description, keywords, canonical link, full Open Graph + Twitter Card tags, and JSON-LD structured data (`WebSite` + `Organization`/`EducationalOrganization` schema) already in `index.html`.
- **Per-page shells exist for blog and skillup exam pages.** `scripts/generate-og-shells.mjs` runs after every build and writes a real static `index.html` for every blog post (`dist/blog/{slug}/`) and every skillup exam (`dist/skillup/{examId}/`), each with its own title, description, canonical URL, and OG/Twitter tags injected. Cloudflare Pages serves these static files directly (ahead of the SPA catch-all in `_redirects`), so crawlers hitting those specific URLs get correct per-page metadata instead of the generic homepage tags — genuinely good practice for a client-rendered SPA, and not something every small project bothers to do.

## The gaps

### 1. No `robots.txt`
There's no `robots.txt` anywhere in `public/`. It's not strictly required — crawlers fall back to "crawl everything" without one — but it's the conventional place to point crawlers at the sitemap and to block anything that shouldn't be indexed (e.g. `/tools` API-adjacent routes, if any exist). **Fix:** add a minimal `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://aaryaai.dev/sitemap.xml
```

### 2. `sitemap.xml` is static and stale — ✅ Fixed 2026-08-23
It was hand-maintained, last modified June 2, 2026, and listed only 7 top-level routes (`/`, `/blog`, `/exams`, `/tools`, `/docs`, `/notes`, `/team`) — missing individual blog posts and exam pages entirely, and referencing routes (`/interview`, `/horizons`) that don't actually exist in the router (the real paths are `/roleprep/:roleId` and `/usecases/:id`; `/horizons` was never a route). **Fixed:** `scripts/generate-sitemap.mjs` now runs after `generate-og-shells.mjs` in the build (`npm run build`), reusing the same content loaders (`scripts/lib/content-sources.mjs`), and writes `dist/sitemap.xml` covering every static public route plus every individual blog post, skillup exam, role-prep pack, and use case, with `lastmod` pulled from the content itself. The old static `public/sitemap.xml` was removed.

### 3. No Google Search Console verification
Nothing in the repo verifies the site with Search Console (no `google-site-verification` meta tag, no verification HTML file in `public/`). Without this, there's no way to see what Google actually indexed, what queries the site ranks for, or whether anything's broken from Google's point of view — which is exactly the "SEO results" gap from before. **Fix:** verify the domain in Search Console (the fastest method for a Cloudflare-hosted domain is DNS TXT record verification, done once in Cloudflare's DNS settings — no code change needed), then submit `sitemap.xml` there once it's fixed per item 2.

### 4. Per-page metadata coverage stops at blog/skillup — ✅ Partially fixed 2026-08-23
The OG-shell approach only covered two content-backed routes (`/blog/*`, `/skillup/*`). Correction to the original framing here: the router has no `/notes/{slug}` or `/interview/{role}` routes — `/notes` is a flat page (no per-item sub-route), and the actual per-item interview-pack route is `/roleprep/:roleId`. The two real content-backed routes that were missing shells were `/roleprep/:roleId` and `/usecases/:id`. **Fixed:** `generate-og-shells.mjs` now also writes `dist/roleprep/{roleId}/index.html` and `dist/usecases/{id}/index.html` shells, sourced via the new `scripts/lib/content-sources.mjs` loaders. Still open: hand-written per-page `<title>`/description overrides for the static top-level routes (`/tools`, `/team`, `/docs`) that only have one instance each and don't need full shell generation.

### 5. Structured data covers the site, not the content
The homepage's JSON-LD only describes the site as a whole. Individual blog posts and exam pages have no `Article` or `LearningResource`/`Course` schema, which is what lets Google show richer results (author, publish date, article snippets) for content pages specifically. **Fix:** add `Article` schema (`headline`, `datePublished`, `author`) to each blog OG shell, and `LearningResource` or `Course` schema to each skillup exam shell — both can be generated in the same `generate-og-shells.mjs` pass, since it already has the post/exam metadata in hand.

### 6. GA4 data isn't actually flowing yet
`stats.json`'s `audience`/`pageViews` fields are empty, meaning `fetch-ga4.py` either hasn't run successfully or `GA4_PROPERTY_ID`/`GA4_SERVICE_ACCOUNT_KEY` aren't set as repo secrets yet. This isn't strictly an SEO item, but Search Console + GA4 linked together is the normal way to see "what people searched to find us" next to "what they did once they landed" — worth confirming this is actually wired up while touching the analytics side of things.

## Setup sequence

Roughly in dependency order — items 1–3 are quick and unblock measurement; 4–5 are the real content-SEO work; 6 closes the loop so results are visible.

| Step | What | Depends on |
|---|---|---|
| 1 | Add `public/robots.txt` | — |
| 2 | Verify domain in Google Search Console (DNS TXT record via Cloudflare) | — |
| 3 | Write `scripts/generate-sitemap.mjs`, wire into the build (same step as `generate-og-shells.mjs`), submit the resulting sitemap in Search Console | 2 |
| 4 | Extend per-page shells to `/notes/{slug}` and `/interview/{role}`; add manual per-page `<title>`/meta to the remaining static routes | — |
| 5 | Add `Article`/`LearningResource` JSON-LD to the existing blog and skillup shells | 4 (same script) |
| 6 | Confirm `GA4_PROPERTY_ID`/`GA4_SERVICE_ACCOUNT_KEY` are set and `analytics-sync.yml` is running; link the GA4 property to Search Console | 2 |

## After setup: what to actually watch

Once Search Console is verified and the sitemap's submitted, the useful signals to check periodically are: **Coverage** (are pages getting indexed, or are any excluded/erroring), **Performance** (impressions/clicks by query — this is the real "SEO results" data), and whether the individual blog/exam pages start showing up as separate indexed URLs rather than just the homepage. That data isn't something I can pull without either a Search Console export or a connected SEO tool — see the earlier message for the options there (export CSV and share it, or connect Ahrefs/Semrush/OpenRush).

---

Want me to go ahead and implement the quick wins now — `robots.txt` and the sitemap generator script — or would you rather review this plan first?
