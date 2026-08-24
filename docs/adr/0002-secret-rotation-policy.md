# ADR 0002: Secret rotation policy for the GH App key and ANTHROPIC_API_KEY

- Status: Accepted
- Date: 2026-08-23

## Context

The `aarya-subscribe` Worker (`workers/subscribe.ts`) holds several secrets set via `wrangler secret put` and documented only as setup instructions in `wrangler.toml`: `GIST_TOKEN`, `GH_APP_ID`, `GH_APP_PRIVATE_KEY`, `GH_APP_INSTALLATION_ID`, `ANTHROPIC_API_KEY`, `GH_CLIENT_ID`, and `GH_CLIENT_SECRET`. Two of these carry outsized blast radius if leaked: `GH_APP_PRIVATE_KEY` (mints installation tokens with repo-write access via the GitHub App JWT flow in `workers/subscribe.ts`) and `ANTHROPIC_API_KEY` (spends real money on every `/mentor/*` call, and is reachable by any visitor to the site). Nothing in the repo currently says how or when these rotate, or what the runbook is if one is compromised — this ADR closes that gap, flagged in the 2026-08-23 architecture review.

## Decision

Adopt a fixed rotation cadence plus an incident runbook, rather than ad hoc/never rotation:

- **`ANTHROPIC_API_KEY`**: rotate every 90 days, or immediately on suspected compromise (e.g. an unexplained spend spike — see ADR 0003).
- **`GH_APP_PRIVATE_KEY`**: rotate every 180 days via the GitHub App settings page (GitHub allows multiple active keys during a rotation window, so this is zero-downtime), or immediately on suspected compromise.
- **`GH_CLIENT_SECRET` / `GIST_TOKEN`**: rotate every 180 days, same immediate-rotation trigger on compromise.
- **Runbook on suspected compromise**: revoke the old secret at the source (Anthropic console / GitHub App settings / GitHub PAT settings) *before* issuing the new one, run `wrangler secret put <NAME>`, then `wrangler deploy`. Revoking first accepts a short availability gap over a window where both old and new secrets are valid.
- Rotation is a manual, calendared task for now (owner: @ajeetchouksey) — no automation is introduced by this ADR.

## Consequences

### Positive

- Bounds the exposure window for any single leaked secret to a known maximum instead of indefinite.
- Gives the team a pre-agreed runbook instead of improvising during an incident.
- Zero new infrastructure — uses the existing `wrangler secret put` mechanism.

### Negative

- Rotation is manual and depends on the calendar reminder actually happening; nothing enforces it automatically.
- No automated alerting yet if a rotation is skipped — this pairs with the observability work in Track C8.

## Follow-up

Automate a rotation reminder (e.g. a scheduled GitHub Issue) once Track C8 observability lands, and consider moving `ANTHROPIC_API_KEY` behind a proxy that supports key aliasing for zero-downtime rotation.
