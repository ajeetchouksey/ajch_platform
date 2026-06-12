#!/usr/bin/env pwsh
# create-ga4-pageviews-branch-pr.ps1
# Creates GitHub issue, feature branch, commits changes, pushes and opens PR
Set-Location $PSScriptRoot/..

Write-Host "=== Creating GitHub issue ===" -ForegroundColor Cyan
$issueUrl = gh issue create `
  --repo ajeetchouksey/ajch_platform `
  --title "feat: seed GA4 page views in stats.json + wire PageViewsBadge on content pages" `
  --label "enhancement" `
  --body @"
## Summary
Wire PageViewsBadge into blog, exam-home, and exam-catalog pages. Seed stats.json with real GA4 data (1,070 total views from May 1 2026). Badge is hidden when count is zero.

## Acceptance Criteria
- [ ] stats.json has pageViews.byPath with real GA4 data
- [ ] BlogPost.tsx shows badge in byline after reading time
- [ ] ExamHome.tsx shows badge below exam description
- [ ] ExamCatalog.tsx shows badge per exam card
- [ ] Badge returns null when count is 0
"@

Write-Host "Issue URL: $issueUrl" -ForegroundColor Green

# Extract issue number from URL
$issueNum = ($issueUrl -split '/')[-1].Trim()
$branch = "feat/$issueNum-ga4-pageviews-badge"
Write-Host "=== Issue #$issueNum -> branch $branch ===" -ForegroundColor Cyan

# Switch to main, pull, create branch
git checkout main
git pull origin main

# Pop any stash that may contain our changes
git stash pop 2>$null

# Create feature branch
git checkout -b $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Branch may already exist, trying checkout..." -ForegroundColor Yellow
    git checkout $branch
}

# Stage the four changed files
git add public/content/stats.json `
      src/features/blog/pages/BlogPost.tsx `
      src/features/exams/pages/ExamHome.tsx `
      src/features/exams/pages/ExamCatalog.tsx

# Commit
git commit -m "feat: seed GA4 page views + wire PageViewsBadge on blog/exam pages (closes #$issueNum)"

# Push
git push -u origin $branch

# Open PR
$prUrl = gh pr create `
  --base main `
  --head $branch `
  --title "feat: seed GA4 page views + wire PageViewsBadge (closes #$issueNum)" `
  --body "## Summary
Seeds stats.json with real GA4 data (1,070 page views from May 1 2026) and mounts PageViewsBadge on BlogPost, ExamHome, and ExamCatalog pages.

## Changes
- public/content/stats.json — pageViews block with total=1070, byPath with 10 routes
- src/features/blog/pages/BlogPost.tsx — badge in byline after reading time
- src/features/exams/pages/ExamHome.tsx — badge below exam description
- src/features/exams/pages/ExamCatalog.tsx — badge per exam card

Closes #$issueNum"

Write-Host "=== PR: $prUrl ===" -ForegroundColor Green
Write-Host "=== DONE ===" -ForegroundColor Green
