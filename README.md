# Aarya — My AI Learning Hub

> **v3.5.0** · [aaryaai.dev](https://aaryaai.dev) · React 19 + TypeScript + Vite + Tailwind CSS v4 · Deployed on Cloudflare Pages

An AI-powered learning platform for practitioners building production AI systems — exam prep, technical blog, developer tools, interview preparation, and architecture notes, all shipped through a 33-subagent agentic development pipeline running natively on Claude Code.

---

## Platform at a Glance

| Metric | Value |
|--------|-------|
| Practice questions | **590+** across 4 certifications |
| Blog articles | **58+** field notes & deep dives |
| Study notes | **19** architecture & domain guides |
| AI scenarios | **13** production-grade walkthroughs |
| AI agents | **33** specialised subagents (all open-source) |
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
| `/team` | Full 24-agent system map with live status and spec links |
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
| Agents | 33 subagents running natively on Claude Code (`.claude/agents/`) |

---

## Project Structure

```
ajch_platform/
├── public/
│   └── content/
│       ├── blog/           # Blog post markdown + index.json
│       ├── questions/      # Exam MCQ JSON files
│       ├── notes/          # Study notes markdown
│       ├── interviews/     # Interview prep packs + canonical Q&A bank
│       ├── platform-docs/  # Architecture docs, release notes, agent ecosystem
│       └── stats.json      # Auto-generated content statistics
├── src/
│   ├── app/                # Router + layout
│   ├── components/
│   │   └── ui/             # Design system primitives (zero raw Tailwind in components)
│   ├── features/           # Feature modules (skillup, blog, tools, interview, home, profile)
│   ├── lib/                # Content loaders, GitHub stats, utilities
│   └── types/              # Shared TypeScript types
├── .github/
│   ├── agents/             # 24 agent specification files (.agent.md)
│   └── workflows/          # CI/CD pipelines
├── scripts/                # Build scripts, content validation, stats sync
└── workers/                # Cloudflare Workers (OG handler)
```

---

## Agentic Development System

Every feature ships through a **7-step gated pipeline** operated by 33 specialised Claude Code subagents:

```
Staff Engineer → Product Manager (Issue Gate)
              → AppSec Engineer (Pre-build PASS/BLOCK)
              → Domain Lead (Platform Architect / Content Lead / Curriculum Engineer / …)
              → AppSec Engineer (Post-build audit)
              → Design Systems Engineer (UX compliance)
              → SRE (semver release + CHANGELOG)
              → DevRel (announcement copy)
```

Subagent specs live in [`.claude/agents/`](.claude/agents/) — one file per subagent, run natively via Claude Code's subagent system. (An earlier version of this pipeline ran a parallel GitHub Copilot-format agent registry under `.github/agents/`; that format was retired in mid-2026 after the two definitions drifted out of sync — see [`docs/agent-framework.md`](docs/agent-framework.md) for the full history.) Most subagents default to `model: inherit`; a few narrow, mechanical ones (`sre`, `qa-engineer`, `platform-engineer`, `release-engineer`) are pinned to a cheaper model — see that same doc for the current tiering.

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
# Sync content statistics + cross-vertical relationships (run after any content write —
# also runs automatically via content-intelligence-sync.yml and promote-content.yml)
node scripts/build-content-intelligence.mjs

# Content health report
npm run health
```

---

## Content Model

All content is static JSON/Markdown served from `public/content/` (or, for promoted verticals, fetched from a pinned CDN URL — see `docs/content-architecture.md`). No database, no backend, for the content layer specifically. (The platform does have a small backend elsewhere — the `aarya-subscribe` Cloudflare Worker, backed by a D1 database, handles newsletter subscription, the AI mentor proxy, and OAuth. See `workers/`.)

- **Blog posts**: `public/content/blog/*.md` + `index.json` manifest
- **Exam questions**: `public/content/questions/<exam>/<domain>.json`
- **Study notes**: `public/content/notes/*.md`
- **Interview packs**: `public/content/interviews/<role>/pack.json` + `canonical-bank.json`
- **Platform docs**: `public/content/platform-docs/*.md` + `index.json`
- **Stats**: `public/content/stats.json` (auto-generated by `scripts/build-content-intelligence.mjs`)

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
- **Platform docs**: [aaryaai.dev/docs](https://aaryaai.dev/docs)
- **Release notes**: [aaryaai.dev/docs](https://aaryaai.dev/docs) → Release Notes tab
