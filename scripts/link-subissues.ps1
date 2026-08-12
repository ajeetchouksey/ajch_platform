$issues = 353..373
foreach ($n in $issues) {
  $id = (gh api "repos/ajeetchouksey/ajch_platform/issues/$n" --jq '.id').Trim()
  $linked = (gh api --method POST "repos/ajeetchouksey/ajch_platform/issues/339/sub_issues" --field "sub_issue_id=$id" --jq '.number' 2>&1)
  Write-Host "Linked #$n (db_id=$id) -> $linked"
  Start-Sleep -Milliseconds 500
}
Write-Host "All done."
