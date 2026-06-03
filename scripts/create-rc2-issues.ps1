<#
.SYNOPSIS
  Creates RC-2 milestone and 9 homepage issues on ajeetchouksey/ajch_platform.
.NOTES
  Requires GH_PO_TOKEN in gh_po_token.env (workspace root) with 'repo' scope.
  Run from the workspace root:  .\scripts\create-rc2-issues.ps1
#>
#Requires -Version 5.1
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ─── Load token ───────────────────────────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot '..' 'gh_po_token.env'
$line    = Get-Content $envFile | Where-Object { $_ -match '^GH_PO_TOKEN=' }
if (-not $line) { throw "GH_PO_TOKEN not found in $envFile" }
$token   = ($line -replace '^GH_PO_TOKEN=', '').Trim()

$headers = @{
    Authorization          = "Bearer $token"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}
$repo    = 'ajeetchouksey/ajch_platform'
$baseUrl = "https://api.github.com/repos/$repo"

# ─── Ensure a label exists (create if missing, skip if 422/already-exists) ────
function Ensure-Label {
    param([string]$Name, [string]$Color, [string]$Desc = '')
    try {
        $null = Invoke-RestMethod -Uri "$baseUrl/labels/$([Uri]::EscapeDataString($Name))" `
                                  -Method Get -Headers $headers
        Write-Host "  label '$Name' — already exists"
    } catch {
        $sc = [int]$_.Exception.Response.StatusCode
        if ($sc -eq 404) {
            $b = @{ name = $Name; color = $Color; description = $Desc } | ConvertTo-Json
            $null = Invoke-RestMethod -Uri "$baseUrl/labels" -Method Post `
                                      -Headers $headers -Body $b -ContentType 'application/json'
            Write-Host "  label '$Name' — created"
        } elseif ($sc -ne 422) {
            throw  # unexpected error
        }
        # 422 = conflict / already exists silently
    }
}

Write-Host "Ensuring labels exist..."
Ensure-Label -Name 'enhancement' -Color '84b6eb' -Desc 'New feature or request'
Ensure-Label -Name 'homepage'    -Color '7c3aed' -Desc 'Homepage / landing page work'
Ensure-Label -Name 'chore'       -Color '94a3b8' -Desc 'Maintenance, cleanup, removal'

# ─── Create RC-2 milestone ────────────────────────────────────────────────────
Write-Host "`nCreating milestone RC-2..."
$msPayload = @{
    title       = 'RC-2'
    description = 'Homepage v2 — builder-first positioning + conversion optimization'
    due_on      = '2026-06-16T00:00:00Z'
    state       = 'open'
} | ConvertTo-Json

$milestone = Invoke-RestMethod -Uri "$baseUrl/milestones" -Method Post `
                               -Headers $headers -Body $msPayload -ContentType 'application/json'
$msNum = $milestone.number
Write-Host "Milestone #$msNum (RC-2) => $($milestone.html_url)"

# ─── Helper: create one issue ─────────────────────────────────────────────────
$created = [System.Collections.Generic.List[pscustomobject]]::new()

function New-Issue {
    param([string]$Title, [string]$Body, [string[]]$Labels, [int]$Milestone)
    $payload = @{
        title     = $Title
        body      = $Body
        labels    = $Labels
        milestone = $Milestone
    } | ConvertTo-Json -Depth 5
    $issue = Invoke-RestMethod -Uri "$baseUrl/issues" -Method Post `
                               -Headers $headers -Body $payload -ContentType 'application/json'
    $created.Add([pscustomobject]@{ Number = $issue.number; Title = $issue.title; Url = $issue.html_url })
    Write-Host "  #$($issue.number) $($issue.title)"
}

Write-Host "`nCreating 9 issues under RC-2 (#$msNum)..."

# ── T1 ────────────────────────────────────────────────────────────────────────
$b1 = @'
## Summary
Rewrite the hero section in `src/features/home/pages/HomeV2.tsx` to align with the builder-first positioning from the AaryaAI homepage blueprint.

## Acceptance Criteria
- [ ] Headline changed to: "Build Real-World AI Systems — Not Just Learn Concepts"
- [ ] Subheadline: "Go from AI basics to production-grade systems (101 → 310) through hands-on projects, structured learning, and real engineering workflows."
- [ ] Primary CTA: "Start Building AI Projects" → `/learn`
- [ ] Secondary CTA: "View Learning Path" → scrolls/links to journey section
- [ ] Trust line: "No fluff. No theory dumps. Build → Deploy → Learn."
- [ ] Remove/avoid words: course, tutorial, basic learning
- [ ] Use words: platform, systems, production-ready

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T1 — Hero section headline + CTA rewrite (RC-2)' `
          -Body $b1 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T2 ────────────────────────────────────────────────────────────────────────
$b2 = @'
## Summary
Add a new "Build AI Like This" section after the proof bar in `HomeV2.tsx`. Shows 3 concrete project types users will build — visual/mock output style cards.

## Acceptance Criteria
- [ ] Section heading: "Build AI Like This"
- [ ] 3 cards: Document AI Pipeline, Retrieval QA System, Autonomous Agent Workflow
- [ ] Each card: title + short description (<10 words) + ASCII/mock output visual
- [ ] Positioned after PROOF BAR, before PROBLEM section
- [ ] Consistent with dark design system (rgba cards, colored borders)

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T2 — Add Quick Proof section with 3 project preview cards (RC-2)' `
          -Body $b2 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T3 ────────────────────────────────────────────────────────────────────────
$b3 = @'
## Summary
Add a new narrow text section "AI Learning Today Is Broken" after Quick Proof. Validates user pain before presenting the solution.

## Acceptance Criteria
- [ ] Section heading: "AI Learning Today Is Broken"
- [ ] 3 pain points: Too much theory / Tutorials don't translate / No clear path beginner→engineer
- [ ] Narrow layout (max-width ~800px, centered)
- [ ] Tone: empathetic, direct — not negative

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T3 — Add Problem section to homepage (RC-2)' `
          -Body $b3 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T4 ────────────────────────────────────────────────────────────────────────
$b4 = @'
## Summary
Update the existing 4-pillar features grid heading and copy to align with the "A Better Way to Learn AI" solution frame from the blueprint.

## Acceptance Criteria
- [ ] Section heading changed to: "A Better Way to Learn AI"
- [ ] 4 grid items: "Learn by building, not watching" / "Structured path (101→310)" / "Production-focused projects" / "Community-driven learning"
- [ ] CTAs on cards updated to use action+outcome language
- [ ] Words avoided: course, tutorial

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T4 — Reframe features grid to builder-first solution messaging (RC-2)' `
          -Body $b4 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T5 ────────────────────────────────────────────────────────────────────────
$b5 = @'
## Summary
Replace the Architecture Topics section with a new "What You Will Actually Build" section showing 5 concrete project outcomes with visual treatment.

## Acceptance Criteria
- [ ] Section heading: "What You Will Actually Build"
- [ ] 5 project items: AI document processing system / Retrieval-based knowledge assistant / Multi-step AI pipelines / Autonomous agents and workflows / Production-ready AI services
- [ ] Each item has icon, title, 1-line description
- [ ] Replace existing Architecture Topics section entirely
- [ ] Visuals or diagrams where possible (use code-output style blocks)

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T5 — Add "What You Will Actually Build" section (RC-2)' `
          -Body $b5 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T6 ────────────────────────────────────────────────────────────────────────
$b6 = @'
## Summary
Update the existing Learning Journey section to add a 1-line example output per level, making it clear what users will produce at each stage.

## Acceptance Criteria
- [ ] 101: example output = "Prompt a document AI pipeline"
- [ ] 201: example output = "Build a retrieval QA chatbot"
- [ ] 301: example output = "Design a multi-step agent workflow"
- [ ] 310: example output = "Architect a production AI platform"
- [ ] Displayed as a small badge/tag under each level title

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T6 — Add example outputs to Learning Path (101→310) (RC-2)' `
          -Body $b6 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T7 ────────────────────────────────────────────────────────────────────────
$b7 = @'
## Summary
Update the existing Community/open-source section with new heading and copy that reinforces "builder" identity and community contribution angle.

## Acceptance Criteria
- [ ] Heading: "Built With Builders, Not Alone"
- [ ] 3 points: Contribute real AI projects / Learn from real implementations / Collaborate with other builders
- [ ] Optional: contributor count indicator (e.g., "builders joining")
- [ ] GitHub link retained

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T7 — Rewrite Community section to builder-first messaging (RC-2)' `
          -Body $b7 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T8 ────────────────────────────────────────────────────────────────────────
$b8 = @'
## Summary
Update the bottom CTA section to use "Join Early Access" framing that signals early-stage launch momentum.

## Acceptance Criteria
- [ ] Heading: "Start Your AI Building Journey Today"
- [ ] CTA button: "Join Early Access" → `/learn`
- [ ] Support text: "Be part of the first wave of AI builders."
- [ ] Max 3 CTAs total on the page (hero primary, hero secondary, final)

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'feat: T8 — Rewrite Final CTA to "Join Early Access" (RC-2)' `
          -Body $b8 -Labels @('enhancement','homepage') -Milestone $msNum

# ── T9 ────────────────────────────────────────────────────────────────────────
$b9 = @'
## Summary
Remove 3 sections that are no longer aligned with the blueprint section order and reduce cognitive load.

## Acceptance Criteria
- [ ] WHY section (3 why-cards) removed from HomeV2.tsx
- [ ] HOW IT WORKS section (4-step lifecycle) removed from HomeV2.tsx
- [ ] FEATURED POSTS section removed from HomeV2.tsx
- [ ] BlogMeta interface + fetch logic removed (no longer needed)
- [ ] No broken imports or dead code left

## Files
- `src/features/home/pages/HomeV2.tsx`
'@
New-Issue -Title 'chore: T9 — Remove WHY, HOW IT WORKS, FEATURED POSTS sections from homepage (RC-2)' `
          -Body $b9 -Labels @('chore','homepage') -Milestone $msNum

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host "`n════════════════════════════════════════════════════════════"
Write-Host "RC-2 Milestone : #$msNum"
Write-Host "Milestone URL  : $($milestone.html_url)"
Write-Host "Issues created : $($created.Count)"
Write-Host ""
$i = 1
foreach ($r in $created) {
    Write-Host "  T$i  #$($r.Number)  $($r.Title)"
    Write-Host "        $($r.Url)"
    $i++
}
Write-Host "════════════════════════════════════════════════════════════"
