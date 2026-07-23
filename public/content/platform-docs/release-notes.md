# Release Notes

## v2.7.0 — 2026-07-23

### Features

- **Interview Prep** (`/interview`) — full interview-preparation module: role catalog with industry badges, faceted Q&A pack view (competency-weight bars, keyword search, facet chips), and detailed question pages with first-person spoken-answer content; wired into global search and sidebar nav
- **Interview content bank** (`public/content/interviews/`) — canonical Q&A bank with 11 questions across 3 role packs: Agentic AI Platform Architect, HR AI Lead (GDPR Art. 22 / disparate impact / Works Council angles), Agentic AI Platform Architect v2 (SDK/dedup demo model)
- **Industry-context system** — `industry` block on every role (label, domain, summary, focusAreas); `industryAngle` per question rendered as a callout sub-section

### Platform

- **Interview Prep Engineer agent** v1.0.0 — Interview Commander with 6 skills: `jd-parser`, `competency-mapper`, `question-generator`, `industry-contextualizer`, `dedup-resolver`, `cross-jd-linker`; canonical bank schema with reference/delta dedup model documented
- **GitHub Actions node24 upgrade** — `actions/checkout` v4 → v5.1.0, `actions/setup-node` v4 → v5 across all 7 workflow files; eliminates Node.js 20 deprecation warning

---

## v2.6.0 — 2026-06-16

### Features

- **OG Worker** (`workers/og-handler.ts`) — Cloudflare Worker intercepts social bot User-Agents (LinkedInBot, Twitterbot, Slackbot) and returns per-page OG meta HTML; covers `/blog/:slug`, `/horizons/:track/:slug`, `/skillup/:exam`, `/tools`, `/learn`
- **Branded OG preview image** (`public/og-preview.png`) — 1200×628 px dark-gradient brand card with logo, headline, differentiator pills, and `aaryaai.dev` watermark
- **Notes page sidebar redesign** — CircularProgress ring (% complete + min left), TOC with past/active/future states, Meta card with exam traps as tag pills

### Fixed

- Horizons page branding aligned to platform violet→orange palette
- PathwayTrack duplicate breadcrumb removed
- PathwayArticle reading progress bar colour corrected to brand gradient
- Blog page heading flicker resolved (removed `will-change` causing GPU repaint)

---

## v2.5.0 — 2026-06-03

### Features

- **Newsletter subscribe** (`/subscribe`) — Kit (ConvertKit) integration with compact + full layout modes; footer newsletter CTA; `VITE_CONVERTKIT_FORM_ID` env var
- **Footer redesign** — glass-card footer with newsletter CTA, brand row, nav links, version badge; now scrolls naturally with page content (no longer pinned to viewport)
- **Version display** — `__APP_VERSION__` injected at build time from `package.json` via Vite; `VersionTag` rendered in footer brand row

---

## v2.4.0 — 2026-06-02

### Features

- **Community Contributions page** (`/contribute`) — 4-tab form gated behind GitHub login: MCQ submission, full Markdown blog editor with live preview and `.md` download, Tool Idea, New Course proposal
- **GA4 analytics** — cookieless mode (`storage: none`), route-change tracking via `GATracker`; `VITE_GA_MEASUREMENT_ID` env var; injected at build time via `deploy.yml`

---

## v2.3.0 — 2026-05-29

### Platform

- **Content freshness pipeline** — `scripts/sync-stats.py` regenerates `public/content/stats.json` from actual content counts after every agent write
- **Dynamic home page stats** — proof bar and feature card bullets now read live counts from `stats.json` (55 posts · 158 questions · 9 tools); hardcoded fallbacks kept for resilience
- **`/docs` route** — new Platform Documentation page with tab selector and Mermaid-capable Markdown renderer
- **`public/content/platform-docs/`** — 4 initial documents: Platform Architecture, Agent Ecosystem, Content Schema, Release Notes
- **Platform Docs agent** v1.0.0 — new specialist agent scoped to `public/content/platform-docs/`
- **Staff Engineer v2.3.0** — content-sync step (STEP 3b) added to STANDARD FLOW; Platform Docs routing added to STEP 3

---

## v2.2.0 — 2026-05-29

### Platform

- **21 agent files renamed** to consistent kebab-case across `.github/agents/` (`component-builder` → `frontend-engineer`, `product-owner` → `product-manager`, etc.)
- **Orchestration audit** — Staff Engineer v2.2.0: stale role names corrected, DevRel + QA Engineer wired into routing tables, legacy v1 duplicate section removed (320 lines → 209 lines)
- **`last_modified` backfilled** across all 21 agent files
- **`agents-validate.yml`** CI gate — validates frontmatter on every push; blocks merge if `version:` or `last_modified:` missing
- **`scripts/freeze_registry.py`** UTF-8 fix — explicit `encoding="utf-8"` prevents cp1252 crash on Windows

### Content

- No new exam content in this release

---

## v2.1.0 — 2026-05-27

### Platform

- **Agent ecosystem** — Initial 21-agent system deployed; `agents-validate.yml` CI gate added
- **`public/content/agents/registry.json`** — machine-readable agent metadata manifest

### Content

- **GitHub Best Practices** exam — Domain 1 (Branch Management), Domain 2 (Actions/CI-CD), Domain 3 (Repository Governance)
- **AB-100** exam — 4 domains added: Plan AI Solutions, Design Agentic, Monitor & Test, Lifecycle & Responsible AI

---

## v2.0.0 — 2026-05-10

### Platform

- **React 19 + Vite 6 migration** — rewritten from Jekyll to full SPA
- **HomeV2** — new landing page with animated proof bar, feature cards, and live GitHub stats
- **Dark theme** — slate/violet/sky brand system via Tailwind CSS v4
- **GitHub OAuth** — client-side login for progress sync via Gist

### Content

- **CCA-F exam** — 68 questions across 5 domains; full study notes and scenarios
- **Blog** — 55 articles migrated from Jekyll; full-text Markdown rendering

---

## v1.x — Legacy (Jekyll)

Platform previously ran as a Jekyll static site hosted on GitHub Pages. Migrated to React SPA in v2.0.0.
