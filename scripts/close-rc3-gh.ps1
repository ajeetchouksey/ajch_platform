#!/usr/bin/env pwsh
# Close RC-4 issues B-F (all implemented in single commit)
$log = "$PSScriptRoot/../rc4-close-log.txt"
"=== RC-4 Close $(Get-Date) ===" | Out-File $log
$repo = "ajeetchouksey/ajch_platform"
$commit = (git -C "$PSScriptRoot/.." rev-parse --short HEAD 2>&1)
"Commit: $commit" | Add-Content $log

foreach ($n in @(44, 45, 46, 47, 48)) {
  $result = gh issue close $n --repo $repo --comment "Implemented in commit $commit — RC-4 SkillUp Restructure. Zero TS errors. AppSec POST-BUILD PASS ✓." 2>&1
  "$n: $result" | Add-Content $log
}
"=== Done $(Get-Date) ===" | Add-Content $log
Write-Host "Closed RC-4 issues 44-48"

$repo = "ajeetchouksey/ajch_platform"
$shipped_commit = "ab86936"

"Skipping already-closed issues (36-41 confirmed closed)." | Add-Content $log
"Creating GA4 issue..." | Add-Content $log

$body = @"
## Summary
Live user count from GA4 Data API displayed in homepage proof bar.

## Shipped in commit 78ed83d
- `.github/workflows/analytics-sync.yml` — cron every 2h
- `.github/scripts/fetch-ga4.py` — GA4 Data API, service account auth
- `public/content/stats.json` — audience.users_today + users_28d fields
- `src/lib/content-loader.ts` — PlatformStats.audience? type
- `src/features/home/pages/HomeV2.tsx` — proof bar shows live count

## Status
- [x] Workflow + script committed
- [x] GitHub secrets GA4_PROPERTY_ID + GA4_SERVICE_ACCOUNT_KEY added
- [ ] Service account ga4-readonly-aarya@smartplanner-oauth.iam.gserviceaccount.com needs GA4 Viewer access
- [ ] Verify workflow returns real user counts (currently null due to 403)

## Fix (Cloud Shell)
```bash
TOKEN=$(gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/analytics.manage.users)
curl -X POST "https://analyticsadmin.googleapis.com/v1alpha/properties/495941725/accessBindings" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user":"ga4-readonly-aarya@smartplanner-oauth.iam.gserviceaccount.com","roles":["predefinedRoles/viewer"]}'
```
"@

$url = gh issue create --repo $repo `
    --title "RC-3: GA4 live analytics — users-today stat in proof bar" `
    --milestone "RC-3: Homepage — Platform Entry Point" `
    --body $body 2>&1

"Created: $url" | Add-Content $log
"=== Done $(Get-Date) ===" | Add-Content $log
Write-Host "Done — see rc3-close-log.txt"
