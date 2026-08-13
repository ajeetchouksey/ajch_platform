# ADR 0001: Content split via pinned GitHub SHA + jsDelivr CDN

- Status: Accepted
- Date: 2026-08-12

## Context

The platform content is already loaded at runtime from `public/content` via fetch calls. That makes the app highly flexible, but it also means the content layer is coupled to the monorepo structure. The next step is to allow independent verticals (blog, skillup, interviews, etc.) to evolve in their own public repos without freezing the product or forcing a big-bang migration.

We need a mechanism that is:

- safe to roll out incrementally
- cache-friendly and deterministic
- easy to audit
- compatible with the current single-repo product as it exists today

## Decision

We will split each vertical into its own public GitHub repository and serve it through jsDelivr using a pinned commit SHA.

`ajch_platform` keeps a root `content-manifest.json` that maps each vertical to its live repo + commit SHA. A vertical is considered live only when its manifest entry is promoted through the standard PR flow. Until then, the app continues to use the existing local `public/content/{vertical}` path.

This gives us a single, clear promotion point without requiring submodules, rebuilds, or a repo-wide cutover.

We also treat vertical agent instructions and validator files as generated mirrors rather than independent source files. The canonical definitions live in the central platform repo and are synced into each vertical repo via the standard sync script. This avoids duplicated logic, drift, and conflicting standards across multiple track repos.

## Consequences

### Positive

- Zero content freeze while the new architecture is being prepared
- Immutable content URLs for caching and auditability
- No dependency on build-time content bundling
- Each vertical can evolve independently and still work inside the same SPA

### Negative

- The platform now has a second source of truth during rollout: local content vs. promoted CDN content
- Manifest promotion must be reviewed and deliberate; stale entries can be rejected by schema validation
- Cross-repo content ownership becomes a governance concern, not just a coding concern

## Follow-up

This ADR is the foundation for the later promotion workflow, repo governance, and community contribution model described in the refactor plan.
