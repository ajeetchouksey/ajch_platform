# Aarya — My AI Learning Hub

> **v3.5.0** · [aaryaai.dev](https://aaryaai.dev) · React 19 + TypeScript + Vite + Tailwind CSS v4 · Deployed on Cloudflare Pages

An AI-powered learning platform for practitioners building production AI systems — exam prep, technical blog, developer tools, interview preparation, and architecture notes, all shipped through a 34-agent agentic development pipeline.

---

## Platform at a Glance

| Metric | Value |
|--------|-------|
| Practice questions | **810+** across 6 exams |
| Blog articles | **62+** field notes & deep dives |
| Study notes | **25** architecture & domain guides |
| AI scenarios | **13** production-grade walkthroughs |
| AI agents | **34** specialised agents (all open-source) |
| Certifications covered | CCA-F · AB-100 · GH Copilot · AI-900 |

---

## Features

| Route | What it does |
|-------|-------------|
| `/skillup` | Practice exam questions with instant scoring, explanations, and progress tracking |
| `/blog` | Technical field notes on AI, DevOps, Azure, and agentic systems |
| `/tools` | Client-side Claude API utilities — token counter, context visualiser, MCP scaffolder, prompt tester |
| `/interview` | Interview-prep packs from JDs: competency maps, Q&A bank with industry angles |
| `/notes` | Architecture decision records, system design guides, platform runbooks |
| `/horizons` | Learning pathways for AI architecture and enterprise governance |
| `/learn` | Platform orientation and getting-started guide |
| `/team` | Full 34-agent system map with live status and spec links |
| `/docs` | Platform architecture, release notes, content schema, agent ecosystem reference |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 + custom design system (`src/components/ui/`) |
| Routing | React Router v7 |
| Deployment | Cloudflare Pages + Cloudflare Workers (OG handler) |
| CI/CD | GitHub Actions (ci · deploy · release · analytics-sync · codeql · dependency-review) |
| Content | Static JSON/MD in `public/content/` — no database |
| Agents | 34 specialised AI agents via Claude Code native subagents (`.claude/agents/`) |

---

## Project Structure

```
ajch_platform/
├── content-manifest.json   # Pins each vertical repo (blog, skillup) to a promoted commit SHA
├── public/
│   └── content/
│       ├── questions/      # Exam MCQ JSON files
│       ├── notes/          # Study notes markdown
│       ├── scenarios/      # Applied scenario JSON
│       ├── interviews/     # Interview prep packs + canonical Q&A bank
│       ├── usecases/       # Use-case walkthroughs
│       ├── pathways/       # Learning pathways
│       ├── tools/          # Tool metadata
│       ├── platform-docs/  # Architecture docs, release notes, agent ecosystem
│       └── stats.json      # Auto-generated content statistics
├── src/
│   ├── app/                # Router + layout
│   ├── components/
│   │   └── ui/             # Design system primitives (zero raw Tailwind in components)
│   ├── features/           # Feature modules (skillup, blog, tools, interview, home, profile)
│   ├── lib/                # Content loaders, GitHub stats, content-manifest resolver, utilities
│   └── types/              # Shared TypeScript types
├── .claude/
│   ├── agents/             # 34 agent specification files (Claude Code native subagents)
│   └── skills/             # On-demand reference skills agents load explicitly
├── .github/
│   └── workflows/          # CI/CD pipelines
├── scripts/                # Build scripts, content validation, stats sync, vertical-repo sync
├── workers/                # Cloudflare Workers (subscribe, OG handler)
└── cli/                    # Content curator CLI (tsx)
```

Blog and SkillUp content live in their own repos (`ajeetchouksey/ajch_aaryaai_blogs`, `ajeetchouksey/ajch_skillup`) and are pulled in at a pinned commit SHA via `content-manifest.json` — see `docs/content-architecture.md`.

---

## Agentic Development System

Every feature ships through a **7-step gated pipeline** operated by 34 specialised AI agents:

```
Staff Engineer → Product Manager (Issue Gate)
              → AppSec Engineer (Pre-build PASS/BLOCK)
              → Domain Lead (Platform Architect / Content Lead / Curriculum Engineer / …)
              → AppSec Engineer (Post-build audit)
              → Design Systems Engineer (UX compliance)
              → SRE (semver release + CHANGELOG)
              → DevRel (announcement copy)
```

Agent specs live in [`.claude/agents/`](.claude/agents/) as native Claude Code subagents. Blog and SkillUp each keep their own copy of the relevant content-authoring agents in their own repo, kept current via `.github/workflows/sync-vertical-agents.yml` (see `docs/content-architecture.md`).

---

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Validate content schema
npm run validate-content

# Build for production
npm run build
```

### Content Scripts

```bash
# Sync content statistics (run after any content write)
python3 scripts/sync-stats.py

# Curator CLI — stats, validate, coverage
npm run curator:stats
npm run curator:validate
npm run curator:coverage
```

---

## Content Model

Content is static JSON/Markdown — no database, no backend. Some content lives in this repo's `public/content/`; blog and SkillUp content live in their own repos and are resolved through `content-manifest.json` (pinned commit SHA, served via jsDelivr CDN) — see `src/lib/content-manifest.ts` and `docs/content-architecture.md` for the resolution logic.

- **Blog posts**: `ajeetchouksey/ajch_aaryaai_blogs` (`content/blog/*.md` + `index.json`)
- **SkillUp exam content**: `ajeetchouksey/ajch_skillup` (`content/skillup/<examId>/`)
- **Exam questions (local)**: `public/content/questions/<exam>/<domain>.json`
- **Study notes (local)**: `public/content/notes/*.md`
- **Interview packs**: `public/content/interviews/<role>/pack.json` + `canonical-bank.json`
- **Platform docs**: `public/content/platform-docs/*.md` + `index.json`
- **Stats**: `public/content/stats.json` (auto-generated by `scripts/sync-stats.py`)

Schema validation runs on every commit via `scripts/validate-content.mjs` (husky pre-commit hook).

---

## Contributing

Branch naming: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`

All PRs require:
- ESLint passing (`--max-warnings=0`)
- Content schema validation passing
- TypeScript clean (`tsc --noEmit`)
- `stats.json` updated if content was added/removed

Pre-commit hooks (husky + lint-staged) enforce ESLint and content validation automatically.

---

## Links

- **Live site**: [aaryaai.dev](https://aaryaai.dev)
- **Agent specs**: [`.claude/agents/`](.claude/agents/)
- **Blog content repo**: [`ajeetchouksey/ajch_aaryaai_blogs`](https://github.com/ajeetchouksey/ajch_aaryaai_blogs)
- **SkillUp content repo**: [`ajeetchouksey/ajch_skillup`](https://github.com/ajeetchouksey/ajch_skillup)
- **Platform docs**: [aaryaai.dev/docs](https://aaryaai.dev/docs)
- **Release notes**: [aaryaai.dev/docs](https://aaryaai.dev/docs) → Release Notes tab
