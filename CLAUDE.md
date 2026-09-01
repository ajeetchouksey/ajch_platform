# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Aarya — My AI Learning Hub** (`ajch_platform`, v3.5.0) — a React 19 + TypeScript + Vite 6 SPA (Tailwind CSS v4) deployed on Cloudflare Pages, plus a small Cloudflare Worker backend (`workers/subscribe.ts`, D1-backed) for newsletter subscription, GitHub/Google OAuth, and an `/mentor/*` AI proxy. Content (blog posts, exam questions, study notes, interview packs) is static JSON/Markdown — there is no application database for the content layer.

The distinguishing feature of this repo: every feature ships through a **33-subagent** system running natively on Claude Code, defined under `.claude/agents/*.md` and `.claude/skills/*/SKILL.md`. If you are Claude Code operating here, you likely *are* one of these subagents (or the orchestrator) — read `.claude/agents/staff-engineer.md` first if routing/delegation is in scope for your task.

## Commands

```bash
npm install                 # install deps (postinstall runs husky)
npm run dev                 # dev server → http://localhost:5173
npx tsc --noEmit             # type-check only (or: npx tsc -b --noEmit, matches pre-commit)
npm run lint                 # eslint . (CI/pre-commit require --max-warnings=0)
npm run build                # tsc -b && vite build && generate-og-shells + generate-sitemap
npm run preview              # preview a production build
npm run validate-content     # node scripts/validate-content.mjs — schema-checks public/content/**
npm run health                # node scripts/content-health-report.mjs — drift report (dup IDs, gaps)
node scripts/build-content-intelligence.mjs  # regenerate public/content/stats.json (schema 2.0, all 6 verticals + freshness) — auto-runs via content-intelligence-sync.yml and promote-content.yml; scripts/sync-stats.py is deprecated, kept only until its remaining doc references are cleaned up
node scripts/build-taxonomy.mjs  # regenerate public/content/taxonomy.json Tier-1 topics from .claude/skills/platform-vocabulary/SKILL.md
npm run test -- --run         # vitest — unit/integration tests (src/lib/**)
npm run test:coverage         # vitest run --coverage — v8 coverage, scoped to src/lib/** and src/shared/lib/**
npm run test:scripts          # node --test scripts/*.test.mjs — tests for scripts/ (outside vitest's src/-only scope)
npm run test:e2e              # playwright test — needs the dev server running at http://localhost:5173
```

`build-content-intelligence.mjs` also writes `public/content/relationships.json` — computed cross-vertical relationships (taxonomyIds overlap, weighted by recency; see `src/lib/relationships.ts` for the tested TS reference and `relationships.test.ts` for its Vitest suite — the script's own scorer is a plain-JS port, tested separately in `build-content-intelligence.test.mjs`, since CI's Node 22 can't import a `.ts` file directly). Only HOL Labs and Use Cases have `taxonomyIds` as of IDEA-0008 Phase 2, and their tag vocabularies don't overlap yet, so this legitimately produces few-to-zero edges today — verify the algorithm via its test suites, not live output. `RelatedContent.tsx`'s hardcoded skill/tool keyword maps are deliberately NOT yet replaced by this (see that file's own header comment for why) — `ComputedRelatedList`/`useRelationships` are wired into HOL Lab and Use Case detail pages only so far.

Vitest + Playwright are installed per `test-engineer.md`'s canonical setup (`vitest.config.ts` merges `vite.config.ts` so the `@/` alias and plugins aren't duplicated; jsdom environment; `src/test/setup.ts` clears `localStorage` between tests). Coverage is intentionally scoped to `src/lib/**`/`src/shared/lib/**` only — UI components are meant to be covered by Playwright E2E instead, not unit tests. Only TEST-MODULE-1 (the lib files that existed when the framework landed — `storage.test.ts`, `gist-sync.test.ts`, `content-manifest.test.ts`) is implemented so far; TEST-MODULE-2 through 6 (schema migration, bookmarks, search index, scheduling algorithm, full E2E user flows) are still planned, see `test-engineer.md`. E2E beyond a basic smoke test (`e2e/smoke.spec.ts`) is blocked on `data-testid` attributes not existing yet in page components — add them before writing real E2E flows. `npm run build` (`tsc -b && vite build`) remains the fastest correctness check for anything outside `src/lib/`.

To actually run/click through the app or smoke-test the Worker (not just build it), use the `run-ajch-platform` skill — it drives a headless-Chromium REPL (`.claude/skills/run-ajch-platform/driver.mjs`) and covers `wrangler dev` + D1 seeding for the Worker. Key gotcha it documents: this is Windows/Git Bash, `lsof` doesn't exist and fails silently — use `netstat -ano | grep ":<port>" | grep LISTENING` + `taskkill //F //PID <pid>` to free a port, not `lsof`.

Pre-commit (husky + lint-staged) runs `eslint --fix --max-warnings=0` on `.ts`/`.tsx` and `node scripts/validate-content.mjs` on any `public/content/**/*.{json,md}`, plus a bare `npx tsc -b --noEmit`. CI (`ci.yml`) runs `npm install --ignore-scripts` + `npm run build` on every PR and enforces a 700KB budget per JS chunk in `dist/assets`.

## Architecture

### Frontend structure
- `src/app/router.tsx` — all routes, lazily loaded per page (`React.lazy`). Route changes and nav entries are the *only* things `platform-engineer` (a narrow subagent) is allowed to touch (`App.tsx` routes / `Layout.tsx` nav) — everything else in `src/` routes through other specialists.
- `src/features/<name>/pages/*` — feature modules (exams/skillup, blog, tools, interview, usecases, hol-labs, pathways, profile, admin, monitoring, mvp, community, analytics, docs, home).
- `src/components/ui/` — the typed design-system primitive library (`GlassCard`, `Badge`, `Button`, `StatGrid`, `Timeline`, `Avatar`, `SectionHeader`, `Breadcrumb`, `VersionTag`, `ContentMeta`, `PulsingDot`), barrel-exported via `index.ts`, imported as `@/components/ui`. **Zero raw Tailwind variant strings are allowed outside this directory** — no raw hex colors, no ad-hoc badge/card class strings in page/feature components; those go through a primitive or a `VARIANT_MAP`. This is enforced by the `design-systems-engineer` subagent as a post-build audit gate, not by lint.
- `src/components/*.tsx` (non-`ui/`) — domain-specific composite components (e.g. `Navbar`, `SearchModal`, `MermaidDiagram`, `SubscribeForm`) — these *may* wrap `ui/` primitives but own business/domain logic.
- `src/lib/` — content loaders, adaptive-quiz engine, auth, analytics, GitHub stats, search, storage, scheduling. Owned by the `platform-dev-expert` subagent.
- Path alias: `@/` → `src/` (set in `vite.config.ts` and mirrored in `tsconfig.app.json`).
- Three separate `tsconfig`s compose the build: `tsconfig.app.json` (browser app), `tsconfig.node.json` (Vite/build tooling), `tsconfig.worker.json` (Cloudflare Worker code) — referenced from the root `tsconfig.json`.

### Content model — manifest-driven vertical promotion
All content is served from `public/content/<vertical>/` by default (blog, questions, notes, interviews, platform-docs, stats.json). A "vertical" (blog, skillup, usecases, hol-labs, interviews, pathways, tools) can be **promoted** to its own standalone public repo without a big-bang migration:

- `content-manifest.json` (repo root) is the **live runtime switch** for the SPA: for each promoted vertical it holds `{repo, sha, baseUrl, schemaVersion, promotedAt}`. `src/lib/content-manifest.ts`'s loader checks this manifest first — if an entry has `repo`+`sha`, content is fetched from jsDelivr pinned to that exact commit SHA (immutable, cache-safe, rollback-able); otherwise it falls back to the local `public/content/{vertical}/` path. Every content payload declares a `schemaVersion`/`schema` field checked against `SUPPORTED_SCHEMA_VERSIONS` (currently `{1, 2}`) — a mismatch throws loudly rather than silently rendering incompatible content.
- `.claude/vertical-registry.json` is the **separate, agent-authoring-only** source of truth — do not confuse the two. It holds each promoted vertical's sibling-repo local checkout path (Windows-absolute), `contentRoot`, its now-removed `staleLocalPath` (old `public/content/{vertical}/` — AppSec Engineer must BLOCK any write there), and which subagents own its Lead/Writer/Publisher roles, plus its `pipelineShape` (`strict-4-role` or `loose-2-role`).
- Currently promoted: **blog** → `ajeetchouksey/ajch_aaryaai_blogs`, **usecases** → `ajch_ai_usecases`, **hol-labs** → `ajch_hol_labs` (all `strict-4-role`); **skillup** → `ajch_skillup` (`loose-2-role`, no single Publisher — each specialist writes its own directory). See `docs/content-architecture.md` for the full promotion flow and rollout rationale.
- `scripts/sync-vertical-repo.mjs` updates `content-manifest.json` for a promoted vertical; `scripts/sync-vertical-agents.mjs <vertical> <path>` mirrors that vertical's subagent/skill dependency chain into its own repo (idempotent, diff-only) — it does **not** sync `scripts/` itself (a known gap).

### The 33-subagent pipeline
`.claude/agents/staff-engineer.md` is the orchestrator: it classifies user intent, runs a mandatory **AppSec Engineer** security gate (`.claude/agents/appsec-engineer.md`) both pre-build (path/input/schema validation) and post-build (regression/XSS/secret re-audit) around every mutating task, then delegates to a domain lead (Platform Architect, Content Lead, Curriculum Engineer, Usecase Lead, HOL Lab Lead, Interview Prep Engineer, Product Manager, SRE, …). Full routing table and the standard 9-step flow (Issue Gate → pre-build security → implement → content-sync → post-build security → UX audit → diagram QA → close issue) live in that file — read it rather than re-deriving the routing logic.

The canonical **Lead → Writer → Security Gate → Publisher** authoring pattern (used by every promoted vertical) is documented once in the `vertical-pipeline` skill (`.claude/skills/vertical-pipeline/SKILL.md`), not repeated per-agent:
- **Shape A — strict 4-role** (blog, usecases, hol-labs): Lead (intent/context) → Writer (drafts, no file I/O) → AppSec Engineer PASS ✓ → Publisher (writes + updates index/manifest) → AppSec Engineer post-build PASS ✓ → Lead reports back.
- **Shape B — loose 2-role** (skillup): Lead does research/classification directly → AppSec pre-flight → parallel specialists (Assessment Engineer, Docs Engineer, Scenario Engineer) each write to their own scoped directory → AppSec post-build → Lead reports back.
- Hard rule: only the Publisher/Specialist role ever calls `Write`/`Edit` — Lead and Writer roles are read/research-only by tool grant. Adding a vertical or changing pipeline shape happens in exactly two places: one entry in `.claude/vertical-registry.json` and (if needed) one subsection in `appsec-engineer.md`'s Vertical Schema & Path Addenda — never by editing the generic Core logic in `staff-engineer.md`/`appsec-engineer.md`.

**Hard ownership boundaries** the orchestrator (and by extension, you) must never bypass by writing directly: `package.json` version + `.github/CHANGELOG.md` + `.github/workflows/*.yml` → SRE only; `src/components/ui/*.tsx` → Design Systems Engineer only; any promoted vertical's `contentRoot` → that vertical's Publisher/Lead only, resolved via `.claude/vertical-registry.json`, never its `staleLocalPath`.

Model tiering (see `docs/agent-framework.md`): most subagents run `model: inherit`; four narrow/mechanical ones are pinned to Haiku — `sre`, `qa-engineer`, `platform-engineer`, `release-engineer`.

**Historical note:** through mid-2026 this repo also ran a parallel GitHub Copilot-format agent registry (`.github/agents/*.agent.md`). It was retired after the two definitions drifted out of sync — `.claude/agents/*.md` is now the single source of truth. Don't resurrect the Copilot format or expect `.github/agents/` to exist.

### Platform vocabulary
`.claude/skills/platform-vocabulary/SKILL.md` defines canonical, platform-coined terms (e.g. *The Context Budget Rule*, *The 4-Layer Agent Stack*, *The Degradation Ladder*, *The Boring Interface*, *Domain Boundary*) and v3.x content types (`ContentType`, `ExamPalette`, `RichScenario`/`LegacyScenario`, `QuestionAttempt`, `DomainReadiness`, `PrepLoop`, `contentVersion`). Content-authoring subagents must use these exact names, never synonyms — check this file before writing platform-facing content that touches architecture concepts.

## Contributing conventions

- Branch naming: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`.
- PRs require: ESLint passing with `--max-warnings=0`, content schema validation passing, `tsc --noEmit` clean, and `stats.json` updated (via `python3 scripts/sync-stats.py`) whenever content under `public/content/` changed.
