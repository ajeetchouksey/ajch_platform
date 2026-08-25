# Content architecture

## Goal

Keep the current single-repo product working while enabling independent content repos for verticals such as blog, skillup, interviews, and use cases.

The design uses a manifest-driven promotion model, not a big-bang repo split.

## Core model

### 1) Local content remains the default

`ajch_platform` continues to serve content from `public/content/...` unless a vertical is explicitly promoted. This keeps all existing tooling and publishing flows working during the transition.

### 2) A vertical can be promoted to a dedicated repo

When a vertical is promoted, it gets:

- its own public GitHub repository
- its own content files
- its own validator and PR checks
- a pinned SHA in the root `content-manifest.json`

### 3) The SPA resolves content by manifest entry

The runtime loader checks the manifest first. If the vertical has a `repo` and `sha`, it resolves the content via jsDelivr using the pinned SHA. Otherwise it falls back to the local `public/content/{vertical}` directory.

This ensures:

- current content keeps working
- migrated content can live in a separate repo
- the app does not require a monolithic content rebuild

## Promotion flow

1. Content is authored in the vertical repo.
2. The vertical repo runs its own validator on each PR.
3. A human reviews the PR and merges it.
4. The maintainers run or trigger the `promote-content` workflow from `ajch_platform`.
5. The workflow validates the target SHA and schema.
6. A PR is opened that updates the root `content-manifest.json`.
7. After that PR is reviewed and merged, the new content becomes live to the app.

This keeps the promotion step explicit and auditable.

## Why SHA pinning matters

Pinning to a commit SHA rather than `main` gives us:

- immutable URLs
- cache safety
- predictable production behaviour
- clear rollback points

The content manifest is the live switch, and the SHA is the exact version behind it.

## Schema guardrails

Every content payload is expected to declare a small integer schema version, using the supported set defined in the loader. The platform uses the live fetched content to validate the declared version and fails loudly when the content is incompatible.

This gives defense in depth:

- vertical content can evolve independently
- stale or mismatched manifest entries are rejected
- the app does not silently load incompatible payloads

## Rollout order

### Phase 1: blog pilot

Blog is the lowest-risk pilot because it is already well-structured and easy to reason about. Once the blog content repo is live and the JS deliver path is proven, the pattern can be reused for the other verticals.

### Phase 2: skillup and interviews

These are higher-complexity content types, but they are still well-scoped and compatible with the same pattern.

### Phase 3: steady state

Once each vertical is independently governed and promoted through the manifest, the core platform remains light and focused on the app shell, routing, and orchestration logic.

## Operational rules

- The core platform repo remains the source of truth for the promotion flow.
- Content repos remain independent and contributor-friendly.
- Local content remains valid until a vertical is deliberately moved.
- No vertical is migrated without the manifest + schema validation path being proven first.

## Vertical promotion tooling

`scripts/sync-vertical-repo.mjs` updates `content-manifest.json` with a vertical's
`{repo, sha, baseUrl, promotedAt}` — that's its full scope. It does not touch
agent definitions or validators.

`scripts/sync-vertical-agents.mjs` handles that separately: it resolves an
entry agent's full `.claude/agents/` + `.claude/skills/` dependency chain,
rewrites `public/content/{vertical}/` references to `content/{vertical}/`,
strips the `> **{Vertical} content moved.**` relocation notice (meaningless
once you're already inside the vertical repo), and writes the result into an
already-checked-out copy of the target vertical repo — idempotent, diff-only.
Usage: `node scripts/sync-vertical-agents.mjs <vertical> <path-to-checkout>`.
It does **not** sync `scripts/` (e.g. `validate-content.mjs` is still kept in
sync by hand, per its own header comment) — a known gap, not yet built.

`.claude/vertical-registry.json` is the source of truth for the facts that
used to be hand-duplicated across `staff-engineer.md`, `appsec-engineer.md`,
and every vertical's Lead/Writer/Publisher files: each promoted vertical's
repo, local checkout path, content root, stale pre-migration path, and which
agents own its Lead/Writer/Publisher roles. It is distinct from
`content-manifest.json` — that file is live SPA runtime config for the
jsDelivr content loader (repo/sha/baseUrl) and must not be conflated with
agent-authoring metadata.

## Summary

The architecture intentionally keeps the existing app working while creating a clear path toward independent, community-friendly content repos. The key idea is simple: nothing becomes live until the manifest says so, and that manifest is always promoted through a reviewed PR.
