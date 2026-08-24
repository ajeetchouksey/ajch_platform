# ADR 0003: /mentor/* cost and abuse posture

- Status: Accepted
- Date: 2026-08-23

## Context

The `/mentor/*` endpoints in `workers/subscribe.ts` (`handleMentorPlan`, `handleMentorChat`) proxy requests to the Anthropic API and are reachable by any visitor to the site — every call spends real API budget. The 2026-08-23 architecture review flagged that while KV-based rate limiting already exists, it wasn't confirmed to be tuned for *cost containment* specifically (as opposed to generic abuse prevention), and that there's no alerting if spend spikes.

## Decision

Confirm and document the existing rate limit as a deliberate cost-containment control, not just abuse prevention: `checkMentorRateLimit` (`workers/subscribe.ts:444`) enforces the `mentor` policy in `RATE_LIMIT_POLICIES` (`workers/subscribe.ts:240-245`) — **2 requests per 15 minutes per IP**, backed by the `RATE_LIMITER` KV namespace via the shared `checkWindowedRateLimit` helper (consolidated under Track C2). This limit was deliberately set low (relative to the `subscribe`/`signals` policies) specifically because each request has a real dollar cost, not only because of abuse risk.

This ADR does not change the limit — 2/15min/IP is treated as the accepted baseline going forward — but it does record the *reasoning* so a future change to this number is a deliberate decision, not an accidental regression during a refactor (e.g. Track C3's Worker split).

## Consequences

### Positive

- Makes the cost-containment intent explicit and discoverable, instead of living only as an inline code comment.
- Gives Track C3 (splitting the Worker by concern) a documented constraint to preserve when the mentor handler is extracted into its own module.

### Negative

- Spend alerting is still not implemented — a sustained low-and-slow abuse pattern (many distinct IPs, each under the per-IP limit) would not currently trigger any alert. This gap is intentionally deferred to Track C8 (observability baseline), not solved here.
- Per-IP limiting is imperfect behind shared IPs (NAT, corporate proxies) — accepted trade-off for now given the low cost of a false-positive rate limit (retry later) versus the cost of a laxer limit.

## Follow-up

When Track C8 observability lands, add spend-based alerting (e.g. daily Anthropic API spend threshold) as a second, independent layer on top of the existing per-IP rate limit.
