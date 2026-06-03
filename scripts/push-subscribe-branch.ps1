#!/usr/bin/env pwsh
# One-shot: create feat/subscribe branch, commit the subscribe files, and push
Set-Location 'c:\Users\ajeet.k.chouksey\Documents\Code\ajch_platform'

# Save current branch
$current = git branch --show-current
Write-Host "Current branch: $current"

# Stash any uncommitted changes to keep them safe
git stash --include-untracked --quiet 2>$null

# Ensure we're on latest main
git checkout main
git pull origin main

# Check if branch already exists locally
$localBranch = git branch --list feat/subscribe
if ($localBranch) {
    Write-Host "Branch feat/subscribe exists locally, deleting and recreating..."
    git branch -D feat/subscribe
}

# Create new branch from main
git checkout -b feat/subscribe

# The files already exist on disk (created by the agent)
# Stage them
git add src/components/SubscribeForm.tsx
git add src/pages/Subscribe.tsx
git add src/app/router.tsx
git add src/components/Layout.tsx
git add .vscode/tasks.json

# Check what's staged
Write-Host "`nStaged files:"
git diff --cached --name-only

# Commit
git commit -m "feat: newsletter subscribe form + /subscribe page (closes #69)"

# Push
git push -u origin feat/subscribe

Write-Host "`nDone. Branch feat/subscribe pushed."
git --no-pager log --oneline -3
