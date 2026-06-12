#!/usr/bin/env pwsh
# create-kit-subscriber-issue.ps1 — Issue Gate: create Kit subscriber count issue
# Run once, then delete this file.

$envFile = Join-Path $PSScriptRoot '..\gh_po_token.env'
if (-not (Test-Path $envFile)) { Write-Error "gh_po_token.env not found"; exit 1 }
$token = (Get-Content $envFile | Where-Object { $_ -match '^GH_PO_TOKEN=' }) -replace '^GH_PO_TOKEN=',''
if (-not $token) { Write-Error "GH_PO_TOKEN not found in env file"; exit 1 }

$headers = @{
  Authorization = "Bearer $token"
  Accept        = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
}

$body = @"
## Summary
Extend the `analytics-sync` cron workflow to also call the Kit (ConvertKit) v3 API and fetch the current subscriber count. Store it in `stats.json` under `audience.subscribers` and display it alongside the page views strip on HomeV2.

## Acceptance Criteria
- [ ] `.github/scripts/fetch-ga4.py` extended to call `GET https://api.kit.com/v3/subscribers?api_secret=\$KIT_API_SECRET` and write the total count
- [ ] `public/content/stats.json` includes `audience.subscribers: number | null` field
- [ ] `src/lib/content-loader.ts` — `PlatformStats.audience` type updated with optional `subscribers?: number | null`
- [ ] `src/features/home/pages/HomeV2.tsx` shows subscriber badge inline with page views strip (hidden if null)
- [ ] `.github/workflows/analytics-sync.yml` passes `KIT_API_SECRET` env var to the fetch step only (not the Vite build step)
- [ ] `KIT_API_SECRET` added as a GitHub repository secret (manual step, documented in PR)

## Context
The platform already has a `SubscribeForm` wired to Kit (formerly ConvertKit) for email capture. Surfacing the live subscriber count on the landing page adds social proof alongside the existing page views badge. The analytics-sync cron runs every 2h — this change piggybacks on that workflow, requiring only one new GitHub secret (`KIT_API_SECRET`).

## Technical Notes
- Kit v3 API: `GET https://api.kit.com/v3/subscribers?api_secret={secret}` → `{ total_subscribers: N }`
- Secret scope: injected only into the `Fetch GA4 metrics` step (or a new parallel step); must NOT be available during the Vite build step (AppSec rule, same pattern as GA4)
- Python dep: `requests` (already installed in the cron job)
- `audience.subscribers` should be written as `null` on API error (graceful degradation)

## Files to Change
- `.github/scripts/fetch-ga4.py`
- `public/content/stats.json`
- `src/lib/content-loader.ts`
- `src/features/home/pages/HomeV2.tsx`
- `.github/workflows/analytics-sync.yml`

## Out of Scope
- Historical subscriber growth charts
- Per-form breakdown
- Subscriber list access (read-only count only)

## RICE Score
Reach: 5 | Impact: 2 | Confidence: 90% | Effort: S(0.3) | RICE: 30
"@

$payload = @{
  title  = 'feat: show newsletter subscriber count from Kit API on landing page'
  body   = $body
  labels = @('enhancement')
} | ConvertTo-Json -Depth 5

$result = Invoke-RestMethod `
  -Uri 'https://api.github.com/repos/ajeetchouksey/ajch_platform/issues' `
  -Method Post `
  -Headers $headers `
  -ContentType 'application/json' `
  -Body $payload

Write-Host ""
Write-Host "============================================"
Write-Host "ISSUE GATE RESULT"
Write-Host "============================================"
Write-Host "Issue #: $($result.number)"
Write-Host "Title:   $($result.title)"
Write-Host "URL:     $($result.html_url)"
Write-Host "Status:  created"
