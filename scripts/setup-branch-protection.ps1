# setup-branch-protection.ps1
# Sets branch protection rules on main via the GitHub API.
# Run once: pwsh -File scripts/setup-branch-protection.ps1

$owner = "ajeetchouksey"
$repo  = "ajch_platform"
$branch = "main"

# Check auth status first
Write-Host "=== gh auth status ==="
gh auth status

Write-Host "`n=== Checking repo admin access ==="
gh api "repos/$owner/$repo" --jq '.permissions' 2>&1

Write-Host "`n=== Applying branch protection to $owner/$repo @ $branch ==="

# Use a raw JSON body written to a temp file
$jsonBody = '{
  "required_status_checks": {
    "strict": true,
    "contexts": ["TypeScript + Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}'

$tempFile = "$env:TEMP\bp-$repo.json"
$jsonBody | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline

Write-Host "Payload written to: $tempFile"
Get-Content $tempFile

$result = gh api "repos/$owner/$repo/branches/$branch/protection" `
  --method PUT `
  --input $tempFile `
  -H "Accept: application/vnd.github+json" 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✔ Branch protection applied."
  $result | ConvertFrom-Json | ConvertTo-Json -Depth 3
} else {
  Write-Host "`n✘ Error: $result"
}

Remove-Item $tempFile -ErrorAction SilentlyContinue
