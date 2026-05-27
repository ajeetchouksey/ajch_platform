# Changelog

All notable changes to AI Architect Hub are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
Versioning: [Semantic Versioning 2.0.0](https://semver.org/)

> **Owned by DevOps Agent.** Entries are added automatically during the release flow.  
> To add an entry manually, open a PR and have DevOps Agent review.

---

## [Unreleased]

### Added
- Agent Profile Drawer redesigned as structured product card (no raw markdown)
- DevOps Agent (`devops.agent.md`) — CI/CD, agent versioning, platform release management
- Post-build Security + UX validation gates in Orchestrator workflow
- Issue Gate (Module 0) in Product Owner Agent — mandatory before every build task
- PO Agent: migrated issue creation from `GH_PO_TOKEN` REST to `gh` CLI (`gh issue create`)
- CI workflow (`.github/workflows/ci.yml`) — PR build check on every PR to `main`
- Agent version headers backfilled across all 16 `.agent.md` files (`version: 1.0.0`)
- DevOps Agent wired into Orchestrator Operations registry

### Changed
- `AgentProfileDrawer` replaced raw markdown fetch with in-memory structured card layout
- Orchestrator Response Pattern expanded to 7 steps including post-build Security + UX gates
- Security agent: dual invocation documented (pre-build + post-build)
- UX agent: Post-build UX Audit added as Responsibility #4

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
