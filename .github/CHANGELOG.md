# Changelog

All notable changes to My AI Hub are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versioning: [Semantic Versioning 2.0.0](https://semver.org/)

> **Owned by DevOps Agent.** Entries are added automatically during the release flow.  
> To add an entry manually, open a PR and have DevOps Agent review.

---

## [Unreleased]

---

## [2.1.0] - 2026-05-29

### Added
- Agent Profile Drawer redesigned as structured product card (no raw markdown)
- DevOps Agent (`devops.agent.md`) — CI/CD, agent versioning, platform release management
- Post-build Security + UX validation gates in Orchestrator workflow
- Issue Gate (Module 0) in Product Owner Agent — mandatory before every build task
- PO Agent: migrated issue creation from `GH_PO_TOKEN` REST to `gh` CLI (`gh issue create`)
- CI workflow (`.github/workflows/ci.yml`) — PR build check on every PR to `main`
- **`release.yml`** — automated GitHub Release workflow: CHANGELOG extraction + agent registry snapshot on every `v*` tag
- Agent version headers backfilled across all 20 `.agent.md` files
- DevOps Agent wired into Orchestrator Operations registry
- Scrum Master Agent (`scrum-master.agent.md`) — sprint facilitation, retrospectives, velocity
- AI Research Tool Agent (`ai-research-tool.agent.md`) — paper/article fetch + summarise, tooling radar
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
- DevOps Agent `devops.agent.md` updated to `v1.1.0`: improved release checklist, `last_modified:` field requirement for agent versioning, `release.yml` documented as release authority
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
