# Architecture Review — ajch_platform (Aarya)

**Status:** Review — informational, not a single go/no-go decision
**Date:** August 23, 2026
**Deciders:** @ajeetchouksey (owner)
**Scope:** Full platform — content architecture, agent/skill system, Cloudflare Workers backend, and documentation accuracy against actual repo state.

This isn't a single ADR because there isn't one pending decision to make — the platform already has a well-thought-out refactor plan (`platform_refactor.md`) and one existing ADR (`0001-content-split-cdn-fetch.md`). So this review does three things instead: validates the decisions already made against standard trade-off dimensions, checks the written plan against what's actually in the repo right now, and surfaces a few things not yet on the existing Track C backlog.

---

## 1. Architecture snapshot

A static React 19 + TypeScript SPA (Vite, Tailwind v4) deployed to Cloudflare Pages, with no application backend for content — content is JSON/Markdown fetched at runtime, either from `public/content/{vertical}` locally or, for promoted verticals, from jsDelivr's GitHub CDN pinned to a commit SHA via `content-manifest.json`. A separate Cloudflare Worker (`aarya-subscribe`) handles everything stateful: newsletter subscription, an AI mentor proxy to the Anthropic API, GitHub OAuth, and engagement signals — backed by a D1 database (subscriber list) and a KV namespace (rate limiting). Feature development runs through 33 Claude Code subagents defined in `.claude/agents/*.md`, orchestrated by a `staff-engineer` dispatcher subagent.

## 2. Reviewing the existing decisions

### 2.1 Content: pinned-SHA CDN fetch over submodules/monorepo (ADR 0001)

| Dimension | Assessment |
|---|---|
| Complexity | Low incremental complexity — reuses the fetch-based loader that already existed; the manifest is one JSON file |
| Cost | $0 — jsDelivr is free, no additional hosting per vertical |
| Scalability | Scales well for read traffic (CDN-cached); scales poorly for write/promotion frequency, since every content update requires a manifest PR |
| Team familiarity | High — plain `fetch()` + GitHub, no new infrastructure to learn |

This is a good decision for a single-maintainer, content-heavy site, and the ADR itself is well-reasoned. One thing worth naming explicitly that the ADR doesn't: **jsDelivr becomes a hard runtime dependency once a vertical's local fallback is removed** (Phase 1, step 11 in the refactor plan calls for deleting `public/content/blog/` after the CDN path is verified). Today, an unmigrated vertical still has the local path as an implicit fallback; a fully-migrated vertical does not — if jsDelivr has an outage or a SHA'd URL gets rate-limited, that vertical's content is unavailable with no fallback. This is a reasonable trade-off for a free CDN with jsDelivr's track record, but it's worth writing down as an accepted risk (or adding a "keep last-known-good content cached client-side" fallback) rather than leaving it implicit.

### 2.2 D1 database replacing the subscriber-list Gist

`wrangler.toml` shows this already happened: the subscriber list moved from a Gist (read-modify-write, and Gists have no real concurrency control) to a proper D1 database, while the *public aggregate stats* gist stays as-is. This is the right call — a Gist is fine for a single-writer, low-frequency, publicly-readable stat blob, but wrong for anything with concurrent writes (two people subscribing at once). Nothing to flag here; this is a resolved decision, not an open one.

### 2.3 Agent system: native Claude Code subagents over the parallel GitHub Copilot format

`docs/agent-framework.md` documents that the repo used to run **two parallel agent-definition systems** (`.claude/agents/*.md` and a GitHub Copilot-format `.github/agents/*.agent.md`) that drifted out of sync with each other, and that the Copilot format was deliberately retired — confirmed by `.github/agents/` no longer existing in the repo and `agents-validate.yml` being gone from the workflow list. This was the right call: two parallel definitions of the same thing is a classic drift trap, and consolidating onto one system with git history as the audit trail is simpler to reason about than a bespoke `version:`/`last_modified:` frontmatter scheme.

**This is also where the review found the most concrete, fixable issue** — see below.

## 3. Findings: documentation vs. actual repo state

Three places where written docs and actual repo state have drifted apart. None of these are architecturally risky by themselves, but they compound — a reader (including future-you, a contributor, or an AI agent context-loading these files) gets a wrong picture of the system from the docs alone.

1. **`README.md` describes the retired agent system.** It says the platform ships through "24 specialised agents (all open-source)... All agents run on Claude Sonnet via GitHub Copilot — zero external API keys required," and separately documents a 7-step pipeline through `.github/agents/`. Per `docs/agent-framework.md`, that system was fully retired — the actual count in `.claude/agents/` today is **33** subagents, running on Claude Code natively (some pinned to `claude-haiku-4-5`, most on `model: inherit`), not GitHub Copilot. The README also states `v2.7.0` while `package.json` is at `3.5.0`. Both are worth fixing in the same pass since they're in the same file.

   *This also affects deliverables already produced in this conversation* — the campaign plan and its Hacker News/Show-HN pitch leaned on "24-agent pipeline... open-source specs" as the hook, sourced from this same README. I'd recommend updating that pitch to the accurate framing (33 Claude Code subagents, not a GitHub Copilot pipeline) before it goes anywhere public — a "Show HN" post that gets a technical detail wrong about its own build process is a bad look in exactly the audience it's targeting. Say the word and I'll fix both documents in the same pass.

2. **`platform_refactor.md`'s progress log is behind actual execution.** The doc is dated "last updated 2026-08-12" and its progress log ends with Track B Phase 0 items. But `content-manifest.json` shows blog, skillup, and usecases were already promoted (Aug 19–20), and `.github/CODEOWNERS` already has the `content-manifest.json` strict-review line from Track C1. In other words, real work continued past what's logged. Not urgent, but a living plan doc that stops reflecting reality loses its value as "the single source of truth" it claims to be in its own opening line — worth a five-minute pass to log what's actually landed (Phase 1 blog pilot, part of Phase 2, C1) so the next planning session starts from an accurate baseline instead of re-discovering what's already done.

3. **README's "no database" claim is narrower than it reads.** The Content Model section says "No database — no backend," which is true for the *content* layer specifically, but the platform does have a backend now (`aarya-subscribe` Worker) and a database (D1, for subscribers). Minor, but a contributor reading only the README would be surprised to find `workers/schema.sql`.

## 4. A few items not yet on the Track C backlog

The existing Track C list (C1–C9 in `platform_refactor.md`) already covers most of what a review like this would normally surface — governance tiers, rate-limiter dedup (done), Worker source splitting, schema versioning, ADRs, feature flags, observability, a governance dashboard. Two things worth adding:

- **Secret rotation policy for the GH App private key and `ANTHROPIC_API_KEY`.** `wrangler.toml` documents how to *set* these secrets but nothing in the repo says how/when they rotate, or what happens to the `/mentor/*` endpoint (which spends real Anthropic API budget per request, proxied through a public Worker) if that key is ever compromised. Worth a short `docs/adr/000X-secret-rotation.md` alongside C6's other planned ADRs — even a simple "rotate every N months, here's the runbook" is better than tribal knowledge.
- **`/mentor/*` abuse/cost exposure.** The Worker already has KV-based rate limiting (`checkMentorRateLimit`, soon to be consolidated per C2), which is the right instinct — but since this endpoint burns real Anthropic API spend per call and is reachable by anyone, it's worth confirming the current rate limit is tuned for cost containment specifically (not just abuse prevention), and that there's alerting if spend spikes — this pairs naturally with C8 (observability baseline), which is already planned but not yet built.

## 5. Recommended next steps, in order

1. Fix `README.md`: agent count (33) and platform (Claude Code, not GitHub Copilot), and the version number (3.5.0). Quick, and unblocks accuracy everywhere else that cites it — including the marketing materials from earlier in this conversation.
2. Update the campaign plan / SEO plan's agentic-pipeline framing to match (I can do this now if you want).
3. Bring `platform_refactor.md`'s progress log current — log Phase 1 (blog pilot) and the C1 governance-tier work as done.
4. Pick up Track C3 (split the Worker by concern) next, since it's the one item on the existing backlog with real blast-radius risk today — a bug in the mentor proxy currently shares a deploy with subscribe/OAuth/signals.
5. Write the two additional ADRs suggested above (secret rotation, mentor cost/abuse posture) as part of the C6 ADR backlog you've already planned.

---

Want me to go ahead and fix the README (item 1) and correct the campaign/SEO plans (item 2) now, or hold everything for your review first?
