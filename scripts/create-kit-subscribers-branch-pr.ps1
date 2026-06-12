#!/usr/bin/env pwsh
# create-kit-subscribers-branch-pr.ps1
# Creates GitHub issue, feature branch, commits changes, pushes and opens PR
Set-Location $PSScriptRoot/..

Write-Host "=== Creating GitHub issue ===" -ForegroundColor Cyan
$issueUrl = gh issue create `
  --repo ajeetchouksey/ajch_platform `
  --title "feat: show newsletter subscriber count from Kit API on landing page" `
  --label "enhancement" `
  --body @"
## Summary
Extend analytics-sync cron to also call Kit v3 API to fetch subscriber count. Store in stats.json under audience.subscribers. Display on HomeV2 alongside the page views strip. Requires KIT_API_SECRET GitHub secret.

## Acceptance Criteria
- [ ] fetch-ga4.py calls Kit v3 API using KIT_API_SECRET env var
- [ ] stats.json audience.subscribers field added (integer or null)
- [ ] PlatformStats type updated with subscribers field
- [ ] HomeV2 shows subscriber badge next to page views (hidden when null)
- [ ] KIT_API_SECRET never logged (AppSec: CWE-598 guard)
- [ ] Non-fatal when KIT_API_SECRET is absent

## Files Changed
- .github/scripts/fetch-ga4.py
- public/content/stats.json
- src/lib/content-loader.ts
- src/features/home/pages/HomeV2.tsx
"@

Write-Host "Issue URL: $issueUrl" -ForegroundColor Green
$issueNum = ($issueUrl -split '/')[-1].Trim()
$branch = "feat/$issueNum-kit-subscribers"
Write-Host "=== Issue #$issueNum -> branch $branch ===" -ForegroundColor Cyan

# Switch to main, pull, create branch
git checkout main
git pull origin main
git checkout -b $branch
if ($LASTEXITCODE -ne 0) {
    git checkout $branch
}

# Stage changed files
git add `
  .github/scripts/fetch-ga4.py `
  public/content/stats.json `
  src/lib/content-loader.ts `
  "src/features/home/pages/HomeV2.tsx"

git commit -m "feat: show Kit subscriber count from API on landing page (closes #$issueNum)"
git push -u origin $branch

$prUrl = gh pr create `
  --base main `
  --head $branch `
  --title "feat: show newsletter subscriber count on landing page (closes #$issueNum)" `
  --body @"
## Summary
Adds subscriber count from Kit (ConvertKit) v3 API to the landing page activity strip, displayed next to the existing page views count.

## Changes
- **.github/scripts/fetch-ga4.py**: new `_fetch_kit_subscribers(api_secret)` function calls Kit v3 API. KIT_API_SECRET env var — never logged (AppSec CWE-598 guard). Non-fatal when absent.
- **public/content/stats.json**: audience.subscribers field added (null by default)
- **src/lib/content-loader.ts**: PlatformStats.audience.subscribers?: number | null
- **src/features/home/pages/HomeV2.tsx**: subscriber badge shows alongside page views, hidden when null

## Required Setup
Add `KIT_API_SECRET` to GitHub repo secrets (Settings → Secrets → Actions) before the cron will populate the count.
The analytics-sync.yml will need KIT_API_SECRET added to the fetch step env — route to SRE.

Closes #$issueNum
"@

Write-Host "=== PR: $prUrl ===" -ForegroundColor Green
Write-Host "=== DONE ===" -ForegroundColor Green
