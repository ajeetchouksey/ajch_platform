# Release Notes

## v2.2.0 — 2026-05-29

### Platform

- **Multi-agent orchestration hardened** — Staff Engineer v2.2.0 with full legacy section removed, stale agent names corrected across all routing tables
- **21 agent files renamed** to consistent kebab-case (`component-builder` → `frontend-engineer`, etc.)
- **Agent registry regenerated** — all 21 agents with `last_modified: "2026-05-29"` and proper `version:` fields
- **Platform Docs** — new `/docs` route with architecture guide, agent ecosystem reference, content schema, and release notes
- **Dynamic home page stats** — proof bar now reads live counts from `public/content/stats.json` instead of hardcoded values
- **`scripts/sync-stats.py`** — new maintenance script to regenerate stats after content writes
- **`scripts/freeze_registry.py`** encoding fix — UTF-8 explicit open prevents cp1252 crash on Windows

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
