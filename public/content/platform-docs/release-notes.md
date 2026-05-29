# Release Notes

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
