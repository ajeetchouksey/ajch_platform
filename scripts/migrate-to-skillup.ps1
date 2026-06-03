#!/usr/bin/env pwsh
# Migrate content files to skillup/{cert}/ structure
# Copies files — does NOT delete originals (backward compat during transition)

$base = "$PSScriptRoot/../public/content"
$log  = "$PSScriptRoot/../skillup-migration-log.txt"
"=== SkillUp Migration $(Get-Date) ===" | Out-File $log

function MkDir($path) {
  New-Item -ItemType Directory -Force -Path $path | Out-Null
}

# ── Create directory structure ────────────────────────────────────────────────
foreach ($cert in @("ccaf","ghbp","ab100")) {
  MkDir "$base/skillup/$cert/notes"
  MkDir "$base/skillup/$cert/questions"
  MkDir "$base/skillup/$cert/scenarios"
}
"Directories created" | Add-Content $log

# ── CCAF notes (d1-d5, no prefix) ────────────────────────────────────────────
$ccafNotes = @("d1-agentic-architecture","d2-claude-code-config","d3-prompt-engineering","d4-tool-design-mcp","d5-context-management")
foreach ($f in $ccafNotes) {
  $src = "$base/notes/$f.md"
  $dst = "$base/skillup/ccaf/notes/$f.md"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ccaf note: $f" | Add-Content $log }
  else { "MISSING ccaf note: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

# ── CCAF questions ────────────────────────────────────────────────────────────
$ccafQ = @("domain1-agentic","domain2-claude-code","domain3-prompt-eng","domain4-tool-design","domain5-context-mgmt")
foreach ($f in $ccafQ) {
  $src = "$base/questions/$f.json"
  $dst = "$base/skillup/ccaf/questions/$f.json"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ccaf q: $f" | Add-Content $log }
  else { "MISSING ccaf q: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

# ── CCAF scenarios ────────────────────────────────────────────────────────────
$ccafS = @("customer-support-agent","code-gen-claude-code","multi-agent-research","developer-productivity","claude-code-cicd","structured-data-extraction")
foreach ($f in $ccafS) {
  $src = "$base/scenarios/$f.json"
  $dst = "$base/skillup/ccaf/scenarios/$f.json"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ccaf scenario: $f" | Add-Content $log }
  else { "MISSING ccaf scenario: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

# ── GHBP notes ────────────────────────────────────────────────────────────────
$ghbpNotes = @("ghbp-d1-branch-management","ghbp-d2-actions-cicd","ghbp-d3-repo-governance")
foreach ($f in $ghbpNotes) {
  $src = "$base/notes/$f.md"
  $dst = "$base/skillup/ghbp/notes/$f.md"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ghbp note: $f" | Add-Content $log }
  else { "MISSING ghbp note: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

# ── GHBP questions ────────────────────────────────────────────────────────────
$ghbpQ = @("ghbp-domain1-branch","ghbp-domain2-actions","ghbp-domain3-repo")
foreach ($f in $ghbpQ) {
  $src = "$base/questions/$f.json"
  $dst = "$base/skillup/ghbp/questions/$f.json"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ghbp q: $f" | Add-Content $log }
  else { "MISSING ghbp q: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

# ── AB-100 notes ──────────────────────────────────────────────────────────────
$ab100Notes = @("ab100-d1-plan-ai-solutions","ab100-d2-design-agentic","ab100-d3-monitor-test","ab100-d4-lifecycle-responsible")
foreach ($f in $ab100Notes) {
  $src = "$base/notes/$f.md"
  $dst = "$base/skillup/ab100/notes/$f.md"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ab100 note: $f" | Add-Content $log }
  else { "MISSING ab100 note: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

# ── AB-100 questions ──────────────────────────────────────────────────────────
$ab100Q = @("ab100-domain1","ab100-domain2","ab100-domain3","ab100-domain4")
foreach ($f in $ab100Q) {
  $src = "$base/questions/$f.json"
  $dst = "$base/skillup/ab100/questions/$f.json"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ab100 q: $f" | Add-Content $log }
  else { "MISSING ab100 q: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

# ── AB-100 scenarios ──────────────────────────────────────────────────────────
$ab100S = @("ab100-hr-onboarding-agent","ab100-invoice-processing","ab100-compliance-monitoring")
foreach ($f in $ab100S) {
  $src = "$base/scenarios/$f.json"
  $dst = "$base/skillup/ab100/scenarios/$f.json"
  if (Test-Path $src) { Copy-Item $src $dst; "Copied ab100 scenario: $f" | Add-Content $log }
  else { "MISSING ab100 scenario: $f" | Add-Content $log; Write-Warning "Missing: $src" }
}

"=== Migration complete $(Get-Date) ===" | Add-Content $log
Write-Host "Migration done — see skillup-migration-log.txt"
