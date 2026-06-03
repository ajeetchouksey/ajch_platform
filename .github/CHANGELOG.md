# Changelog

All notable changes to Aarya — My AI Learning Hub are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versioning: [Semantic Versioning 2.0.0](https://semver.org/)

> **Owned by DevOps Agent.** Entries are added automatically during the release flow.  
> To add an entry manually, open a PR and have DevOps Agent review.

---

## [Unreleased]

---

## [2.5.0] - 2026-06-03

### Added
- **Newsletter subscribe feature** (Issue #69) — `SubscribeForm` component with Kit (ConvertKit) integration; compact + full layout modes; `/subscribe` page with GlassCard; `VITE_CONVERTKIT_FORM_ID` env var
- **Footer redesign** — seamlessly integrated glass-card footer with newsletter CTA, brand row, nav links, version badge; replaces the old pinned block footer
- **Version display** — `__APP_VERSION__` injected at build time from `package.json` via `vite.config.ts define`; `VersionTag` rendered in footer brand row; `src/vite-env.d.ts` type declaration

### Fixed
- Footer was pinned to viewport (`shrink-0` outside `<main>`); moved inside `<main>` scroll container — now scrolls naturally with page content

---

## [2.4.0] - 2026-06-02

### Added
- **Community Contributions page** (`/contribute`) — 4-tab form gated behind GitHub login; tabs: Exam Question (MCQ submission, credited `@username`), Blog Post (full in-browser Markdown editor with live preview, word count, reading time, `.md` download + review issue), Tool Idea (tool suggestion), New Course (propose a new exam/certification with cert body, official URL, rationale, domain outline)
- **GA4 analytics** (Issue #14) — `initGA()`, `trackPageView()`, `trackEvent()` in `src/lib/analytics.ts`; cookieless mode (`storage: none`, `client_storage: none`); `VITE_GA_MEASUREMENT_ID` env var; script injected dynamically from `main.tsx`; route-change tracking via `GATracker` component in `App.tsx`; added to `deploy.yml` as GitHub Actions Variable

### Changed
- `src/App.tsx` — added `GATracker` component (wraps `useLocation()` → `trackPageView()` on route change)
- `src/main.tsx` — calls `initGA()` before React renders to prime the `dataLayer` queue
- `.github/workflows/deploy.yml` — build env now includes `VITE_GA_MEASUREMENT_ID` from `vars.VITE_GA_MEASUREMENT_ID`

---

## [2.3.0] - 2026-05-29

### Added
- **`scripts/sync-stats.py`** — content freshness pipeline; regenerates `public/content/stats.json` from actual file counts (blog posts, questions, exams, notes, scenarios, agents, tool routes in `App.tsx`)
- **`public/content/stats.json`** — live platform statistics; loaded by home page on mount; auto-updated by `sync-stats.py` after every content write; updated in STANDARD FLOW step 3b
- **`/docs` route** — new Platform Documentation page (`Docs.tsx`) with tab selector and Markdown renderer supporting Mermaid diagrams; 4 initial docs shipped
- **`public/content/platform-docs/`** — architecture guide, agent ecosystem reference, content schema, release notes
- **`platform-docs.agent.md`** v1.0.0 — new agent scoped to `public/content/platform-docs/`; wired into Staff Engineer STEP 3 routing

### Changed
- `HomeV2.tsx` — proof bar (`Articles`, `Practice Qs`, `Dev Tools`) and feature card bullets now driven dynamically by `stats.json`; hardcoded values used as fallback only
- Staff Engineer v2.3.0 — content-sync step (3b) added to STANDARD FLOW; Platform Docs routing added to STEP 3; modeInstructions updated to match
- `registry.json` — `platform_version` bumped to `2.3.0`; staff-engineer entry updated; platform-docs entry added

---

## [2.2.0] - 2026-05-29

### Added
- **`agents-validate.yml`** — CI gate on every `.github/agents/*.agent.md` change: validates `version:` + `last_modified:` fields, blocks PR merge if version was not bumped vs base branch, regenerates `registry.json` on push to main (items 16)
- **`public/content/agents/registry.json`** — committed agent registry; single source of truth for all 21 agent versions, readable by the UI; auto-updated by `agents-validate.yml`, frozen per stable release by `release.yml` (item 17)
- **`release.yml` deployment dispatch (step 11)** — stable releases auto-dispatch `deploy.yml` on `main` via `gh workflow run`; pre-releases are excluded; requires `actions: write` permission (item 14)
- **`release.yml` rich job summary (step 12)** — structured table in `$GITHUB_STEP_SUMMARY` with release status, date, commit SHA, release URL, artifact size, agent count, and deployment status (item 14)
- **`release.yml` registry freeze (step 9)** — on stable tag push, regenerates `registry.json` with `platform_version` set to the release tag and commits back to `main [skip ci]` (item 18)

### Changed
- **`release.yml`** upgraded from 5 → 12 steps: concurrency guard, build artifact + SHA256 checksum, release header, commit log since previous stable tag, duplicate release guard, `--latest` flag, deployment dispatch, rich job summary (items 13–15)
- **`sre.agent.md`** bumped to `v1.2.0`: owns `agents-validate.yml`, `registry.json`, Hard Rules 8+9 (no bypass of agent gate, registry is automation-owned)
- **`qa-engineer.agent.md`** — added missing `version: 1.0.0` and `last_modified: 2026-05-29` fields (was blocking `agents-validate.yml` gate)
- Platform renamed to **"Aarya — My AI Learning Hub"** across all agents, workflows, 404 page, CHANGELOG
- Six page redesigns: `Notes.tsx`, `Progress.tsx`, `ExamHome.tsx`, `Scenarios.tsx`, `ExamCatalog.tsx`, `Quiz.tsx`

---

## [2.1.0] - 2026-05-29

### Added
- Agent Profile Drawer redesigned as structured product card (no raw markdown)
- DevOps Agent (`sre.agent.md`) — CI/CD, agent versioning, platform release management
- Post-build Security + UX validation gates in Orchestrator workflow
- Issue Gate (Module 0) in Product Owner Agent — mandatory before every build task
- PO Agent: migrated issue creation from `GH_PO_TOKEN` REST to `gh` CLI (`gh issue create`)
- CI workflow (`.github/workflows/ci.yml`) — PR build check on every PR to `main`
- **`release.yml`** — automated GitHub Release workflow: CHANGELOG extraction + agent registry snapshot on every `v*` tag
- Agent version headers backfilled across all 20 `.agent.md` files
- DevOps Agent wired into Orchestrator Operations registry
- Scrum Master Agent (`delivery-manager.agent.md`) — sprint facilitation, retrospectives, velocity
- AI Research Tool Agent (`ai-researcher.agent.md`) — paper/article fetch + summarise, tooling radar
- Standardised `Breadcrumb` UI component (`src/components/ui/Breadcrumb.tsx`) — single canonical breadcrumb with full route labelMap; removed 9 inline duplicates across tool pages
- `HomeV2.tsx` full sales-quality redesign — animated orbs hero, proof bar, benefit-driven feature cards, creator authority section, bottom conversion CTA
- `Blog.tsx` full rewrite — read tracking, category pills, 3-col grid, accented cards
- `BlogPost.tsx` full rewrite — sticky TOC sidebar, circular reading progress, mobile TOC drawer
- `Tools.tsx` creative redesign — category-coloured cards, terminal hero, hover glow
- `TeamV2.tsx` promoted to main `/team` route (replaces legacy `Team.tsx`)
- Three new tool pages: RAG Chunk Visualizer, Prompt Tester, Prompt Library

### Changed
- `TeamV2` is now the canonical team page at `/team` and `/maintainer/team`
- `/team/v2` alias removed (traffic now goes directly to `/team`)
- DevOps Agent `sre.agent.md` updated to `v1.1.0`: improved release checklist, `last_modified:` field requirement for agent versioning, `release.yml` documented as release authority
- `package.json` version field brought from `0.0.0` to `2.1.0`

---

## [2.0.0] - 2026-05-01

### Added
- Multi-agent architecture: Security & Governance Agent, UX Framework Agent
- Bidirectional governance rails (SecurityPillar/UXPillar) in Team page
- Study Companion split into Expert Teacher Agent + Student Simulator Agent
- Agent hierarchy visual (L0 → L1 → L2 connectors, FanConnector, VerticalConnector)
- Human feedback loop indicators on agent cards

### Changed
- Platform Control Agent refactored as commander: delegates to Routing Agent, Component Builder, UX Framework Agent
- Blog Agent refactored: Content Writer → Security Gate → Content Publisher pipeline

---

## [1.0.0] - 2026-01-15

### Added
- Initial platform: React 19 + TypeScript + Vite + Tailwind CSS v4
- Core pages: Home, Blog, Exam (CCA-F), Notes, Scenarios, Tools, Team
- Orchestrator + Product Owner Agent (L0)
- Platform Control, Blog, Exam Content agents (L1)
- GitHub Pages deployment via `actions/deploy-pages`
- RICE-scored backlog, sprint planning (Product Owner Agent)
- CCA-F question bank (50 questions)
