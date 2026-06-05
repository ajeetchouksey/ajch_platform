#!/usr/bin/env pwsh
# Creates 1 epic + 7 child issues for the dual-channel subscription system
# (GitHub App + Gist + Cloudflare Worker)
# Uses gh CLI session auth — no PAT file required.
# Run from workspace root: .\scripts\create-subscription-issues.ps1

$repo    = "ajeetchouksey/ajch_platform"
$results = @()

# ── Ensure labels exist ──────────────────────────────────────────────────────
Write-Host "Ensuring labels exist..."
foreach ($label in @(
    @{ name = 'epic';           color = '6366f1'; desc = 'Parent tracking issue for a feature' },
    @{ name = 'infrastructure'; color = '0ea5e9'; desc = 'Infra, CI, backend, secrets' },
    @{ name = 'frontend';       color = 'f472b6'; desc = 'React/TypeScript UI component work' },
    @{ name = 'enhancement';    color = '84b6eb'; desc = 'New feature or request' },
    @{ name = 'chore';          color = '94a3b8'; desc = 'Maintenance, cleanup, removal' },
    @{ name = 'documentation';  color = '0075ca'; desc = 'Documentation improvements' }
)) {
    $existing = gh label list --repo $repo --json name | ConvertFrom-Json | Where-Object { $_.name -eq $label.name }
    if (-not $existing) {
        gh label create $label.name --repo $repo --color $label.color --description $label.desc 2>$null
        Write-Host "  created: $($label.name)"
    } else {
        Write-Host "  exists:  $($label.name)"
    }
}

# ── Helper ───────────────────────────────────────────────────────────────────
function New-Issue {
    param([string]$Title, [string]$Body, [string[]]$Labels)
    $labelArgs = $Labels | ForEach-Object { "--label"; $_ }
    $url = gh issue create --repo $repo --title $Title --body $Body @labelArgs 2>&1
    $num = ($url | Select-String -Pattern '/issues/(\d+)').Matches[0].Groups[1].Value
    Write-Host "  #$num  $Title"
    Write-Host "         $url"
    return [int]$num
}

# ── Child Issue 1 — Phase 1: Activity strip ──────────────────────────────────
Write-Host "`nCreating child issues..."
$body1 = @'
## Summary
Add live GitHub stars and watcher counts to the HomeV2 activity strip and a "Watch" CTA button to the community section.

## Problem
The activity strip currently shows only page views from `stats.json` (cron-updated). GitHub stars and watchers are already available from `fetchGitHubRepo()` in `src/lib/github-stats.ts` — they're just not displayed. This is the quickest engagement signal to surface, requires zero infra, and unblocks the rest of the subscription work visually.

## Scope
- `src/features/home/pages/HomeV2.tsx`
  - Import `fetchGitHubRepo` from `@/lib/github-stats`
  - Add `ghRepo` state (`GitHubRepoStats | null`) + `useEffect` to fetch on mount (parallel to existing `pStats` fetch)
  - Extend activity strip pill row: `👁 N views · ⭐ N stars · 👀 N watching`
  - Each signal shown only when its value `> 0`
  - Community section (~line 840): add "Watch" button linking to `https://github.com/ajeetchouksey/ajch_platform/subscription`

## Files to change
- `src/features/home/pages/HomeV2.tsx` only

## Acceptance Criteria
- [ ] Activity strip shows ⭐ stars count (live from GitHub API)
- [ ] Activity strip shows 👀 watchers count (live from GitHub API)
- [ ] Both signals hidden when value is 0 or API unavailable
- [ ] "Watch on GitHub" button appears in community section
- [ ] No layout regression on mobile or desktop
- [ ] `pnpm build` passes with zero TypeScript errors
- [ ] No new API calls beyond existing `fetchGitHubRepo()` pattern

## Notes
`fetchGitHubRepo()` already handles 5-minute `sessionStorage` cache and returns `null` on failure. No error handling changes needed. This phase requires no new env vars, no secrets, no backend.
'@

$num1 = New-Issue `
    -Title "feat(home): add GitHub stars + watchers to HomeV2 activity strip" `
    -Body  $body1 `
    -Labels @('enhancement', 'frontend')

# ── Child Issue 2 — Phase 2: SubscribeForm dual-channel ──────────────────────
$body2 = @'
## Summary
Refactor `SubscribeForm.tsx` from a single Kit-only email form into a dual-channel form: **Email** tab and **GitHub handle** tab. Both channels POST to the Cloudflare Worker. The component reads live subscriber count from the public Gist raw URL.

## Problem
The current form is hardcoded to Kit via `VITE_CONVERTKIT_FORM_ID`. Kit is being dropped entirely. The new form must support both email and GitHub handle subscriptions, display a live count, and be safe to render without a Worker deployed (returns `null` if `VITE_SUBSCRIBE_WORKER_URL` is unset).

## Scope
- `src/components/SubscribeForm.tsx` — full rewrite:
  - Two tabs: `Email` | `GitHub`
  - Email tab: validates email format, `POST {type:"email", value}` to Worker
  - GitHub tab: validates handle format, `POST {type:"gh", value}` to Worker
  - Live count: fetches `https://gist.githubusercontent.com/ajeetchouksey/{VITE_STATS_GIST_ID}/raw/aarya-stats.json` → shows `email_count + gh_count`
  - Returns `null` if `VITE_SUBSCRIBE_WORKER_URL` is not set
  - `compact` prop preserved (used in hero/footer)
  - State machine: `idle | loading | success | error | already_subscribed`
- `src/pages/Subscribe.tsx` — update `hasForm` guard: `VITE_SUBSCRIBE_WORKER_URL` instead of `VITE_CONVERTKIT_FORM_ID`
- `.env.example` — remove `VITE_CONVERTKIT_FORM_ID`, add `VITE_SUBSCRIBE_WORKER_URL` + `VITE_STATS_GIST_ID`
- `src/features/home/pages/HomeV2.tsx` — update activity strip to show subscriber count from Gist (replaces `pStats.audience.subscribers`)

## New env vars
| Variable | Safe to bundle? | Purpose |
|---|---|---|
| `VITE_SUBSCRIBE_WORKER_URL` | Yes (public endpoint) | Cloudflare Worker URL |
| `VITE_STATS_GIST_ID` | Yes (public Gist ID) | Public stats Gist ID for live count |

## Acceptance Criteria
- [ ] Email tab submits successfully to Worker
- [ ] GitHub handle tab submits successfully to Worker
- [ ] Live subscriber count displayed when `VITE_STATS_GIST_ID` is set
- [ ] `compact` prop renders correctly in hero/footer
- [ ] Component returns `null` when Worker URL is not set
- [ ] Duplicate submission shows "already subscribed" message, not error
- [ ] `pnpm build` passes with zero TypeScript errors

## Dependencies
- Depends on Worker being deployed (#4 in this series) for end-to-end testing
- Gist IDs must exist for count display (can be seeded manually)
'@

$num2 = New-Issue `
    -Title "feat(subscribe): refactor SubscribeForm to dual-channel (email + GitHub handle)" `
    -Body  $body2 `
    -Labels @('enhancement', 'frontend')

# ── Child Issue 3 — Phase 2: Remove Kit ──────────────────────────────────────
$body3 = @'
## Summary
Remove all ConvertKit/Kit integration from the codebase — env vars, TypeScript types, stats.json schema, and the fetch-ga4.py script.

## Problem
Kit is no longer used after the SubscribeForm refactor (#N). Keeping dead code and unused secrets creates confusion and unnecessary security surface area. `KIT_API_SECRET` is a repo secret that should be revoked and removed.

## Scope
- `public/content/stats.json` — remove `audience.subscribers` key
- `src/lib/content-loader.ts` — remove `subscribers?: number | null` from `PlatformStats.audience`
- `.github/scripts/fetch-ga4.py` — remove `_fetch_kit_subscribers()` function, `kit_secret` env var read, and all Kit conditional logic. Remove `subscribers` key from `stats["audience"]` write.
- `.github/workflows/analytics-sync.yml` — remove `KIT_API_SECRET` from env block
- `.env.example` — confirm `VITE_CONVERTKIT_FORM_ID` is removed (done in #2)

## Acceptance Criteria
- [ ] No `convertkit`, `kit`, `KIT_API_SECRET`, `VITE_CONVERTKIT_FORM_ID` references remain
- [ ] `PlatformStats.audience` has no `subscribers` field
- [ ] `stats.json` has no `subscribers` field under `audience`
- [ ] `fetch-ga4.py` has no Kit imports or function calls
- [ ] `analytics-sync.yml` has no `KIT_API_SECRET` env entry
- [ ] `pnpm build` passes
- [ ] Reminder comment in PR: revoke `KIT_API_SECRET` GitHub secret after merge

## Files to change
- `public/content/stats.json`
- `src/lib/content-loader.ts`
- `.github/scripts/fetch-ga4.py`
- `.github/workflows/analytics-sync.yml`
'@

$num3 = New-Issue `
    -Title "chore: remove ConvertKit/Kit integration from codebase" `
    -Body  $body3 `
    -Labels @('chore')

# ── Child Issue 4 — Phase 3: Cloudflare Worker ───────────────────────────────
$body4 = @'
## Summary
Build and deploy a Cloudflare Worker (`aarya-subscribe`) that handles all subscription write operations: validates input, deduplicates against a private Gist, appends to the subscriber list, updates the public stats Gist, and invites GitHub handles as repo collaborators.

## Problem
The frontend is a static site with no backend. Subscription write operations (Gist PATCH, GitHub collaborator invite) require server-side credentials that must not be in the browser bundle. A Cloudflare Worker on the free tier (100k req/day) provides this thin proxy layer.

## Scope
- New `workers/subscribe.ts`:
  - `POST /subscribe` endpoint
  - Input validation (OWASP A03):
    - `type`: must be `"email"` or `"gh"`
    - `email`: basic RFC 5322 regex
    - `gh`: `/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/` (max 39 chars)
  - Read private subscriber Gist via `GET /gists/{SUBSCRIBER_GIST_ID}`
  - Deduplicate on `value` field
  - Append `{type, value, joined: ISO-timestamp}` to private Gist via `PATCH`
  - Increment `email_count` or `gh_count` in public stats Gist via `PATCH`
  - If `type === "gh"`: generate GitHub App installation JWT → exchange for installation token → `PUT /repos/ajeetchouksey/ajch_platform/collaborators/{handle}` with `permission: "read"`
  - Return `201` (new) or `200` (duplicate)
  - CORS: `Access-Control-Allow-Origin: https://ajeetchouksey.github.io`
  - Error responses: generic `{"error":"internal"}` — never leak internal details
- New `wrangler.toml`:
  ```toml
  name = "aarya-subscribe"
  main = "workers/subscribe.ts"
  compatibility_date = "2026-06-05"
  ```

## Worker secrets (set via `wrangler secret put`)
| Secret | Description |
|---|---|
| `GIST_TOKEN` | Fine-grained PAT, `gist` scope only |
| `SUBSCRIBER_GIST_ID` | Private subscriber Gist ID |
| `PUBLIC_STATS_GIST_ID` | Public stats Gist ID |
| `GH_APP_ID` | GitHub App numeric ID |
| `GH_APP_PRIVATE_KEY` | GitHub App private key (PEM) |
| `GH_APP_INSTALLATION_ID` | Installation ID for ajch_platform |

## Acceptance Criteria
- [ ] `wrangler dev` starts without errors
- [ ] `POST /subscribe {type:"email", value:"test@example.com"}` → private Gist updated, `email_count` incremented
- [ ] `POST /subscribe {type:"gh", value:"somehandle"}` → private Gist updated, `gh_count` incremented, collaborator invited
- [ ] Duplicate submission returns `200`, Gists unchanged
- [ ] Invalid type returns `400`
- [ ] Invalid email format returns `400`
- [ ] Invalid GH handle (too long, special chars) returns `400`
- [ ] CORS rejects requests not from `https://ajeetchouksey.github.io`
- [ ] `wrangler deploy` succeeds

## Dependencies
- Depends on #5 (GitHub App) for the collaborator invite path
- Gists must be created manually before running
'@

$num4 = New-Issue `
    -Title "feat(worker): Cloudflare Worker subscribe endpoint (validate + Gist write + GH invite)" `
    -Body  $body4 `
    -Labels @('enhancement', 'infrastructure')

# ── Child Issue 5 — Phase 4: GitHub App setup ────────────────────────────────
$body5 = @'
## Summary
Create and configure the `aarya-platform-bot` GitHub App. This App serves two purposes: (1) bypassing the branch ruleset to push `stats.json` from `analytics-sync.yml`, and (2) generating installation tokens for the Cloudflare Worker to invite GitHub handle subscribers as repo collaborators.

## Problem
`analytics-sync.yml` currently uses `STATS_PAT` (a personal access token with `repo` scope) to push to main. This is blocked by the branch ruleset unless the PAT belongs to a "Repository admin" bypass actor. A GitHub App can be added as an explicit bypass actor and is the correct pattern for this automation.

## This is a manual setup issue — no code changes.

## Setup Steps
- [ ] Go to https://github.com/settings/apps/new
- [ ] Name: `aarya-platform-bot`
- [ ] Homepage URL: `https://ajeetchouksey.github.io/ajch_platform`
- [ ] Uncheck "Webhook active" (not needed)
- [ ] Set permissions:
  - Repository → Contents: **Read and write**
  - Repository → Administration: **Read-only** (for bypass list check)
  - Repository → Members: **Read-only** (check collaborator status)
- [ ] Click "Create GitHub App" → note the **App ID**
- [ ] Generate a private key → download `.pem` file (keep secure, never commit)
- [ ] Install the App on `ajeetchouksey/ajch_platform` → note the **Installation ID** (from the URL: `.../installations/{id}`)
- [ ] Add the App as a bypass actor in the branch ruleset at https://github.com/ajeetchouksey/ajch_platform/settings/rules/17214708 → "Add bypass" → select `aarya-platform-bot`
- [ ] Add to GitHub repo secrets:
  - `GH_APP_ID` = the App ID number
  - `GH_APP_PRIVATE_KEY` = full content of the `.pem` file

## Acceptance Criteria
- [ ] App exists at https://github.com/settings/apps
- [ ] App installed on `ajch_platform` repo
- [ ] App appears as bypass actor in ruleset settings
- [ ] `GH_APP_ID` secret added to repo
- [ ] `GH_APP_PRIVATE_KEY` secret added to repo
- [ ] `.pem` file NOT committed to the repo
'@

$num5 = New-Issue `
    -Title "chore(infra): create and configure GitHub App aarya-platform-bot" `
    -Body  $body5 `
    -Labels @('chore', 'infrastructure')

# ── Child Issue 6 — Phase 4: analytics-sync workflow ────────────────────────
$body6 = @'
## Summary
Replace `STATS_PAT` with a GitHub App installation token in `analytics-sync.yml`, and remove all Kit/ConvertKit code from `fetch-ga4.py`.

## Problem
- `analytics-sync.yml` uses `STATS_PAT` (personal token) for the push step. After the GitHub App is set up (#5), this should be replaced with `actions/create-github-app-token@v1`.
- `fetch-ga4.py` still contains the `_fetch_kit_subscribers()` function and `KIT_API_SECRET` env var. These are dead code after Kit removal (#3).
- `audience.subscribers` is still written to `stats.json` by the script. This key is removed from the schema in #3.

## Scope
- `.github/workflows/analytics-sync.yml`:
  - Add step before `actions/checkout@v4`:
    ```yaml
    - name: Generate GitHub App token
      id: app-token
      uses: actions/create-github-app-token@v1
      with:
        app-id: ${{ secrets.GH_APP_ID }}
        private-key: ${{ secrets.GH_APP_PRIVATE_KEY }}
    ```
  - Pass token to checkout: `token: ${{ steps.app-token.outputs.token }}`
  - Push step becomes: `git push origin HEAD:main` (App token handles auth)
  - Remove `STATS_PAT` from push command
  - Remove `KIT_API_SECRET` from `env` block
  - Update top comment (remove mentions of `KIT_API_SECRET`, `STATS_PAT`)
- `.github/scripts/fetch-ga4.py`:
  - Remove `_fetch_kit_subscribers()` function
  - Remove `kit_secret = os.environ.get("KIT_API_SECRET", "")` line
  - Remove Kit conditional block in `main()`
  - Remove `"subscribers": subscribers` from `stats["audience"]` write

## Acceptance Criteria
- [ ] Workflow runs successfully with App token (trigger via `workflow_dispatch`)
- [ ] `stats.json` pushed to `main` without ruleset rejection
- [ ] No `STATS_PAT` reference remains in the workflow
- [ ] No `KIT_API_SECRET` reference remains in the workflow or script
- [ ] `fetch-ga4.py` has no Kit-related code
- [ ] `stats["audience"]` write does not include `subscribers` key
- [ ] `pnpm build` passes

## Dependencies
- Depends on #5 (GitHub App must be created and `GH_APP_ID`/`GH_APP_PRIVATE_KEY` added to secrets)
- Depends on #3 (Kit removal from stats.json schema)
'@

$num6 = New-Issue `
    -Title "fix(ci): analytics-sync.yml — replace STATS_PAT with GitHub App token" `
    -Body  $body6 `
    -Labels @('chore', 'infrastructure')

# ── Child Issue 7 — Docs ─────────────────────────────────────────────────────
$body7 = @'
## Summary
Create `public/content/platform-docs/subscription-architecture.md` and register it in `platform-docs/index.json`. This document is the canonical reference for the dual-channel subscription system and serves as the template for future feature architecture docs.

## Problem
The platform has an existing platform-docs section at `/docs`. Major architectural decisions should be documented there so any agent or contributor can understand the system without reverse-engineering the code.

## Scope
- New file: `public/content/platform-docs/subscription-architecture.md`
  - Design principles
  - Two subscribe channels table
  - Infrastructure components (GitHub App, Gist PAT, Gists, Cloudflare Worker)
  - Data flow diagram (Mermaid)
  - Frontend integration section
  - analytics-sync workflow changes
  - Secrets inventory (repo secrets, Worker secrets, VITE_ vars)
  - Implementation phases summary
  - One-time setup checklist
- `public/content/platform-docs/index.json` — add entry:
  ```json
  {
    "id": "subscription-architecture",
    "title": "Subscription Architecture",
    "description": "Dual-channel subscriber system — GitHub App, Gist, and Cloudflare Worker",
    "file": "content/platform-docs/subscription-architecture.md",
    "icon": "Users",
    "category": "infrastructure"
  }
  ```

## Acceptance Criteria
- [ ] Doc appears on `/docs` page under infrastructure category
- [ ] All Mermaid diagrams render without errors
- [ ] Secrets inventory is complete and accurate
- [ ] Setup checklist has all manual steps
- [ ] `pnpm build` passes
'@

$num7 = New-Issue `
    -Title "docs: add subscription-architecture.md to platform-docs" `
    -Body  $body7 `
    -Labels @('documentation')

# ── Parent Epic issue ────────────────────────────────────────────────────────
Write-Host "`nCreating parent epic..."
$epicBody = @"
## Overview

Implement a fully self-hosted dual-channel subscription system using only GitHub and Cloudflare infrastructure — no third-party email tools (no Kit, no Mailchimp).

### Two subscribe channels

| Channel | Input | What happens |
|---|---|---|
| Email | ``user@example.com`` | Stored in private GitHub Gist (owner-only) |
| GitHub handle | ``@username`` | Stored in Gist + invited as repo ``read`` collaborator |

Subscriber count is displayed live on the landing page from a **public GitHub Gist** — no cron needed for the count itself.

## Architecture

```
SubscribeForm (frontend)
  POST {type: "email"|"gh", value}
        ↓
  Cloudflare Worker
    ├─ GIST_TOKEN (gist-scope PAT) → Private Gist (subscriber list)
    │                              → Public Gist (counts only)
    └─ GH App install token       → GitHub collaborator invite (gh path only)

analytics-sync.yml (cron 2h)
  └─ GitHub App token (bypasses ruleset) → push stats.json to main

Frontend reads:
  ├─ stats.json → page views
  ├─ Public Gist raw URL → subscriber count (live)
  └─ GitHub API → stars + watchers (live)
```

## Key architectural constraint

GitHub Apps **cannot** write to Gists (Gists are user-level resources). Gist writes use a separate fine-grained PAT with **``gist`` scope only**.

## Reference

See `public/content/platform-docs/subscription-architecture.md` (Issue #$num7) for the full canonical design document including secrets inventory and setup checklist.

## Child Issues (implementation order)

- [ ] #$num7 docs: add subscription-architecture.md to platform-docs
- [ ] #$num1 feat(home): add GitHub stars + watchers to HomeV2 activity strip
- [ ] #$num2 feat(subscribe): refactor SubscribeForm to dual-channel (email + GitHub handle)
- [ ] #$num3 chore: remove ConvertKit/Kit integration from codebase
- [ ] #$num5 chore(infra): create and configure GitHub App aarya-platform-bot *(manual)*
- [ ] #$num4 feat(worker): Cloudflare Worker subscribe endpoint
- [ ] #$num6 fix(ci): analytics-sync.yml — replace STATS_PAT with GitHub App token

## One-time manual setup required

Before #$num4 and #$num6 can be completed:
1. Create two GitHub Gists (private subscriber list + public stats)
2. Create fine-grained PAT with ``gist`` scope only
3. Complete #$num5 (GitHub App creation)
4. Create Cloudflare account + configure Worker secrets

See subscription-architecture.md for the full setup checklist.
"@

$epicUrl = gh issue create --repo $repo `
    --title "feat: dual-channel subscription system (GitHub App + Gist + Cloudflare Worker)" `
    --body $epicBody `
    --label "epic" `
    --label "enhancement" `
    --label "infrastructure" 2>&1

$epicNum = ($epicUrl | Select-String -Pattern '/issues/(\d+)').Matches[0].Groups[1].Value
Write-Host "  #$epicNum  [EPIC] dual-channel subscription system"
Write-Host "         $epicUrl"

# ── Save result ──────────────────────────────────────────────────────────────
$results = @(
    @{ issue = [int]$num1;    title = "feat(home): add GitHub stars + watchers to HomeV2 activity strip" }
    @{ issue = [int]$num2;    title = "feat(subscribe): refactor SubscribeForm to dual-channel" }
    @{ issue = [int]$num3;    title = "chore: remove ConvertKit/Kit integration" }
    @{ issue = [int]$num4;    title = "feat(worker): Cloudflare Worker subscribe endpoint" }
    @{ issue = [int]$num5;    title = "chore(infra): create GitHub App aarya-platform-bot" }
    @{ issue = [int]$num6;    title = "fix(ci): analytics-sync use GitHub App token" }
    @{ issue = [int]$num7;    title = "docs: add subscription-architecture.md" }
    @{ issue = [int]$epicNum; title = "[EPIC] dual-channel subscription system"; epic = $true }
)

$json = $results | ConvertTo-Json -Compress
Write-Host "`nAll issues created:"
$results | ForEach-Object { Write-Host "  #$($_.issue)  $($_.title)" }
Write-Host "`nJSON OUTPUT:"
Write-Host $json
$json | Out-File (Join-Path $PSScriptRoot '..' 'subscription-issues-result.json') -Encoding UTF8
Write-Host "`nSaved to subscription-issues-result.json"
Write-Host "`nFirst branch to create: feat/$num1-subscription-activity-strip"
