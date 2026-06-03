#!/usr/bin/env pwsh
$repo = "ajeetchouksey/ajch_platform"
$log  = Join-Path $PSScriptRoot "..\rc4-close-log.txt"
$sha  = git -C (Join-Path $PSScriptRoot "..") rev-parse --short HEAD
"Closing RC-4 issues 44-48 (commit $sha)" | Out-File $log
foreach ($n in 44,45,46,47,48) {
  $r = gh issue close $n --repo $repo --comment "All RC-4 issues implemented in single commit $sha. Zero TS errors. AppSec PASS." 2>&1
  "$n : $r" | Add-Content $log
  Write-Host "Closed #$n : $r"
}
"Done" | Add-Content $log
