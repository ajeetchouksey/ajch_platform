#!/usr/bin/env pwsh
# update-pr79-workflow.ps1
# Updates PR #79 branch: replace branch+auto-merge commit step with STATS_PAT direct push
Set-Location $PSScriptRoot/..

git stash
git checkout fix/analytics-sync-kit-secret-and-push
git pull origin fix/analytics-sync-kit-secret-and-push

$content = @'
name: Sync Analytics Stats
# Fetches GA4 user metrics every 2 hours and commits updated stats.json.
# Requires GitHub secrets: GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_KEY, KIT_API_SECRET, STATS_PAT.
# Uses STATS_PAT (admin PAT) to bypass branch protection on direct push.

on:
  schedule:
    - cron: '0 */2 * * *'   # every 2 hours
  workflow_dispatch:         # manual trigger for testing

permissions:
  contents: write            # needed to commit stats.json

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v6
        with:
          python-version: '3.12'

      - name: Install GA4 client deps
        run: pip install --quiet google-auth google-auth-httplib2 requests

      - name: Fetch GA4 metrics
        env:
          GA4_PROPERTY_ID:         ${{ secrets.GA4_PROPERTY_ID }}
          GA4_SERVICE_ACCOUNT_KEY: ${{ secrets.GA4_SERVICE_ACCOUNT_KEY }}
          KIT_API_SECRET:          ${{ secrets.KIT_API_SECRET }}
        run: python3 .github/scripts/fetch-ga4.py

      - name: Commit updated stats.json
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/content/stats.json
          if ! git diff --cached --quiet; then
            git commit -m "chore: sync analytics stats [skip ci]"
            git push https://x-access-token:${{ secrets.STATS_PAT }}@github.com/ajeetchouksey/ajch_platform.git HEAD:main
          else
            echo "No changes to commit."
          fi
'@

$content | Set-Content .github/workflows/analytics-sync.yml -Encoding utf8

Write-Host "=== Updated analytics-sync.yml ===" -ForegroundColor Cyan
git add .github/workflows/analytics-sync.yml
git commit -m "fix: use STATS_PAT for direct push + KIT_API_SECRET env (branch protection bypass)"
git push origin fix/analytics-sync-kit-secret-and-push

Write-Host "=== Back to main ===" -ForegroundColor Cyan
git checkout main
git stash pop 2>$null
Write-Host "=== DONE ===" -ForegroundColor Green
