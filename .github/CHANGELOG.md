# Changelog

All notable changes to Aarya — My AI Learning Hub are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versioning: [Semantic Versioning 2.0.0](https://semver.org/)

> **Owned by DevOps Agent.** Entries are added automatically during the release flow.  
> To add an entry manually, open a PR and have DevOps Agent review.

---

## [Unreleased]

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
