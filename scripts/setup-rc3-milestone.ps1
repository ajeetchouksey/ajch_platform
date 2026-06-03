#!/usr/bin/env pwsh
# Creates RC-3 milestone + 6 issues + RC-3 tracking issue (closed) + GA4 live users issue
# Uses gh CLI (must be authenticated via gh auth login)
[CmdletBinding()] param()
$ErrorActionPreference = 'Stop'
$repo = 'ajeetchouksey/ajch_platform'
$log  = Join-Path $PSScriptRoot '..' 'rc3-setup-result.txt'
"Starting RC-3 milestone setup at $(Get-Date)" | Set-Content $log

# ── Ensure labels ──────────────────────────────────────────────────────────────
Write-Host "Ensuring labels..."
$labels = @(
  @{ name='type:ux';         color='f59e0b'; desc='UI/UX improvements' },
  @{ name='P1-high';         color='ea580c'; desc='Next sprint inclusion expected' },
  @{ name='domain:platform'; color='7c3aed'; desc='Core platform / UX' },
  @{ name='homepage';        color='7c3aed'; desc='Homepage / landing page work' },
  @{ name='type:feat';       color='22c55e'; desc='New feature' },
  @{ name='P2-medium';       color='f97316'; desc='Planned sprint' }
)
foreach ($l in $labels) {
  gh label create $l.name --color $l.color --description $l.desc --repo $repo 2>$null || true
}

# ── Create RC-3 milestone ──────────────────────────────────────────────────────
Write-Host "Creating RC-3 milestone..."
$msOut = gh api "repos/$repo/milestones" -X POST `
  -f title='RC-3: Homepage — Platform Entry Point' `
  -f description='Homepage redesign — transformation messaging, intent fork block, RAG terminal, reduced cognitive load' `
  -f state='open' `
  -f due_on='2026-06-30T00:00:00Z' 2>&1

if ($LASTEXITCODE -ne 0) {
  # May already exist — find it
  Write-Host "Milestone may already exist, finding..."
  $msNum = gh api "repos/$repo/milestones" --paginate --jq '.[] | select(.title | test("RC-3")) | .number' 2>$null
} else {
  $ms = $msOut | ConvertFrom-Json
  $msNum = $ms.number
}
Write-Host "RC-3 milestone #$msNum"
"RC-3 milestone #$msNum" | Add-Content $log

# ── Create 6 RC-3 sub-issues ───────────────────────────────────────────────────
$issues = @(
  @{
    title = 'RC-3: Add platform identity line + intent fork block to hero'
    body  = "## Summary`nAdd a single-line progression statement above the hero headline and a 3-path intent fork block below the CTAs so visitors self-select their journey.`n`n## Acceptance Criteria`n- [x] Identity line: 'Structured paths from AI-curious → AI-engineer → systems that actually ship'`n- [x] Fork block: AI Curious / Already an Engineer / Open Source Builder`n- [x] Each fork button routes to correct destination`n- [x] Keyboard-navigable and accessible`n`n## Status`nImplemented in commit ab86936 (RC-3)"
  },
  @{
    title = 'RC-3: Replace CI terminal with RAG pipeline demo'
    body  = "## Summary`nReplace the CI/agent pipeline terminal with a 7-step RAG pipeline that shows what learners will actually build.`n`n## Acceptance Criteria`n- [x] 7-step RAG pipeline: chunk → embed → index → query → search → construct prompt → LLM call`n- [x] Realistic detail strings (chunk counts, similarity scores, token counts)`n- [x] No internal CI/agent references remain`n`n## Status`nImplemented in commit ab86936 (RC-3)"
  },
  @{
    title = 'RC-3: Remove CREATOR section from homepage'
    body  = "## Summary`nRemove the 'From the creator' section (bio, blockquote, credential chips, links) to reduce cognitive load and focus visitors on the platform value.`n`n## Acceptance Criteria`n- [x] CREATOR section removed from homepage JSX`n- [x] Related consts (creds), unused imports (Avatar, Badge) cleaned up`n`n## Status`nImplemented in commit ab86936 (RC-3)"
  },
  @{
    title = 'RC-3: Remove LIVE ACTIVITY section (GitHub stats bar)'
    body  = "## Summary`nRemove the live GitHub stats bar (stars, forks, followers, repos) to simplify the page and remove the external API dependency.`n`n## Acceptance Criteria`n- [x] LiveBar component removed`n- [x] useCountUp, LiveStatPill helpers removed`n- [x] github-stats import removed`n`n## Status`nImplemented in commit ab86936 (RC-3)"
  },
  @{
    title = 'RC-3: Update community section headline to builder-focused copy'
    body  = "## Summary`nUpdate the community section headline and subhead to focus on reputation-building and production contributions.`n`n## Acceptance Criteria`n- [x] Headline: 'Ship Real Work. Build Real Reputation.'`n- [x] Subhead updated to production/portfolio language`n`n## Status`nImplemented in commit ab86936 (RC-3)"
  },
  @{
    title = 'RC-3: Update bottom CTA to transformation-led copy'
    body  = "## Summary`nReplace the bottom CTA section with transformation-led copy that emphasises the structured path from curious to production-ready.`n`n## Acceptance Criteria`n- [x] Headline: 'Be the Engineer Who Ships AI.'`n- [x] Support text: 'The gap between AI-curious and production-ready is a structured path.'`n`n## Status`nImplemented in commit ab86936 (RC-3)"
  }
)

$created = @()
foreach ($issue in $issues) {
  Write-Host "  Creating: $($issue.title)"
  $url = gh issue create --repo $repo `
    --title $issue.title `
    --body $issue.body `
    --label 'type:ux' --label 'P1-high' --label 'domain:platform' --label 'homepage' `
    --milestone 'RC-3: Homepage — Platform Entry Point'
  $num = $url -replace '.*issues/(\d+)$','$1'
  Write-Host "    → #$num"
  $created += $num
  # Close immediately — all done in ab86936
  gh issue close $num --repo $repo --comment "Implemented and shipped in commit ab86936 (RC-3 homepage redesign)." | Out-Null
  Write-Host "    → closed"
}

# ── Create GA4 live users feature issue (open) ─────────────────────────────────
Write-Host "Creating GA4 live users issue..."
$gaUrl = gh issue create --repo $repo `
  --title 'feat: GA4 active users (30d) on homepage proof bar via GitHub Actions + stats.json' `
  --body "## User Story
As a platform visitor, I want to see how many people are actively learning on Aarya, so that I have social proof this is a live community.

## Approach
Extend the existing \`scripts/sync-stats.py\` + GitHub Actions pipeline to call GA4 Data API daily and include the result in \`public/content/stats.json\`. No new infrastructure — credentials stay in GitHub Secrets, result is a plain integer in the already-public stats file.

## Acceptance Criteria
- [ ] \`sync-stats.py\` calls GA4 Data API if \`GA4_PROPERTY_ID\` and \`GA4_SERVICE_ACCOUNT_JSON\` env vars are set; silently skips if not set
- [ ] GA4_PROPERTY_ID validated as 9–12 digit numeric string before URL interpolation
- [ ] Service account JSON read from env var (GitHub Secret), never from source file
- [ ] Result added as \`ga_active_users_30d: int\` to stats.json
- [ ] CI adds a dedicated pre-build step scoped to only that step: \`GA4_PROPERTY_ID\` + \`GA4_SERVICE_ACCOUNT_JSON\` — NOT injected into the Vite build step
- [ ] \`src/types/content.ts\` PlatformStats type updated with optional \`ga_active_users_30d?: number\`
- [ ] \`HomeV2.tsx\` proof bar shows 'Learners (30d)' stat tile if value present; hidden if null
- [ ] Python response validated: must be a finite integer before write

## Technical Notes
- GA4 Data API: \`POST https://analyticsdata.googleapis.com/v1beta/properties/{id}:runReport\`
  - Metric: \`activeUsers\` · Date range: \`30daysAgo\` → \`today\`
- Python deps (CI only): \`google-auth\`, \`requests\`
- files: \`scripts/sync-stats.py\`, \`.github/workflows/deploy.yml\`, \`src/types/content.ts\`, \`src/features/home/pages/HomeV2.tsx\`

## AppSec Pre-Build: PASS ✓ (with the dedicated step pattern above)
See AppSec pre-build findings: credential must be scoped to a dedicated CI step only, not the Vite build step." `
  --label 'type:feat' --label 'P2-medium' --label 'domain:platform'

$gaNum = $gaUrl -replace '.*issues/(\d+)$','$1'
Write-Host "GA4 issue created: #$gaNum → $gaUrl"

Write-Host "`n=== DONE ==="
Write-Host "RC-3 milestone #$msNum created"
Write-Host "6 RC-3 sub-issues created and closed: $($created -join ', ')"
Write-Host "GA4 live users issue: #$gaNum (open)"
"`n=== DONE ===" | Add-Content $log
"RC-3 milestone: #$msNum" | Add-Content $log
"RC-3 sub-issues: $($created -join ', ')" | Add-Content $log
"GA4 issue: #$gaNum" | Add-Content $log
