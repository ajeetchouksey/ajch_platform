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

## Vertical-agent sync policy

Vertical repos should treat agent instructions and validator files as generated mirrors, not as independent source files.

- The canonical definitions live in the central platform repo, under `.github/agents/` and the synced validator scripts.
- Each vertical repo receives only the relevant subset via `scripts/sync-vertical-repo.mjs`.
- Direct edits in a vertical repo are temporary and should be treated as drift; the sync process should overwrite them.
- Any behavior change or new rule is made once in the central repo, reviewed there, and then propagated out.
- The vertical repo’s CI should verify that the mirrored files still match the approved central version to prevent duplication and drift.

This keeps one source of truth for agent behavior and ensures the same standards are enforced across all content tracks without copying logic into multiple repos.

## Summary

The architecture intentionally keeps the existing app working while creating a clear path toward independent, community-friendly content repos. The key idea is simple: nothing becomes live until the manifest says so, and that manifest is always promoted through a reviewed PR.
