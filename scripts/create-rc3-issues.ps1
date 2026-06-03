<#
.SYNOPSIS
  Creates RC-3 milestone and 6 homepage redesign issues on ajeetchouksey/ajch_platform.
.NOTES
  Requires GH_PO_TOKEN in gh_po_token.env (workspace root) with 'repo' scope.
  Run from the workspace root:  .\scripts\create-rc3-issues.ps1
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

# ─── Ensure a label exists (create if missing, skip 422/already-exists) ───────
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
            throw
        }
    }
}

Write-Host "Ensuring labels exist..."
Ensure-Label -Name 'type:ux'         -Color 'f59e0b' -Desc 'UI/UX improvements'
Ensure-Label -Name 'P1-high'         -Color 'ea580c' -Desc 'Next sprint inclusion expected'
Ensure-Label -Name 'domain:platform' -Color '7c3aed' -Desc 'Core platform / UX'
Ensure-Label -Name 'homepage'        -Color '7c3aed' -Desc 'Homepage / landing page work'

# ─── Create RC-3 milestone ────────────────────────────────────────────────────
Write-Host "`nCreating milestone RC-3..."
$msPayload = @{
    title       = 'RC-3: Homepage — Platform Entry Point'
    description = 'Homepage redesign — transformation messaging, reduced cognitive load, user-relatable build proof'
    due_on      = '2026-06-30T00:00:00Z'
    state       = 'open'
} | ConvertTo-Json

$milestone = Invoke-RestMethod -Uri "$baseUrl/milestones" -Method Post `
                               -Headers $headers -Body $msPayload -ContentType 'application/json'
$msNum = $milestone.number
Write-Host "Milestone #$msNum (RC-3) => $($milestone.html_url)"

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

Write-Host "`nCreating 6 issues under RC-3 (#$msNum)..."

# ── Issue 1 ───────────────────────────────────────────────────────────────────
$b1 = @'
## Summary
The homepage hero section lacks orientation for first-time visitors. They arrive with no
signal about where they are on the AI learning spectrum or which path is right for them.
Adding a platform identity line and an intent fork block gives the visitor immediate
self-identification and routing.

## User Story
As a first-time visitor, I want to quickly understand who this platform is for and which
path matches where I am today, so that I can take the right first step without reading
the entire page.

## Context
RC-2 shipped the builder-first hero headline. RC-3 adds the two missing orientation layers:
1. A single-line progression statement above the headline to anchor the platform's scope.
2. A 3-path fork block below the hero CTAs so visitors self-select their journey.

## Acceptance Criteria
- [ ] Identity line above hero headline: "From AI curious → AI engineer → AI systems builder"
- [ ] Fork block visible in hero viewport (below primary/secondary CTAs)
- [ ] Fork block has exactly 3 paths: [New to AI], [Already building], [Want to contribute]
- [ ] Each fork button routes to the correct destination (TBD per routing design, e.g. /learn, /exams, /community)
- [ ] Fork block is keyboard-navigable and accessible (role="group", aria-label)
- [ ] Identity line is styled distinctly from the headline (smaller, muted, monospace or sans)

## Out of Scope
- Personalised routing based on login state (future sprint)
- A/B testing of fork copy variants

## RICE Score
Reach: 10 | Impact: 3 | Confidence: 80% | Effort: S(0.3) | RICE: 80

## Technical Notes
- File: `src/features/home/pages/HomeV2.tsx` (hero section)
- Fork block: 3 ghost/outline buttons, horizontally spaced, below CTA row
- Identity line: single `<p>` or `<span>` above the `<h1>`, uses `→` separator

## Dependencies
- Follows RC-2 hero rewrite (issues #27–#35, now closed)
'@
New-Issue -Title 'RC-3: Add platform identity line + intent fork block to hero' `
          -Body $b1 -Labels @('type:ux','P1-high','domain:platform','homepage') -Milestone $msNum

# ── Issue 2 ───────────────────────────────────────────────────────────────────
$b2 = @'
## Summary
The hero terminal currently displays an internal CI/agent pipeline trace — an internal
engineering artifact that means nothing to a first-time visitor. Replace it with a
RAG pipeline output that mirrors what the visitor would actually build after completing
the platform.

## User Story
As a prospective learner, I want the visual proof in the hero to show me output I
could produce, not internal platform scaffolding I don't recognise, so that I can
immediately see the value of learning here.

## Context
The terminal is the homepage's most prominent "build proof" element. RC-2 introduced it
as atmosphere; RC-3 makes it functionally demonstrative. The new content should show a
3-step RAG pipeline: document ingestion → vector retrieval → grounded answer generation.

## Acceptance Criteria
- [ ] Terminal content replaced with a RAG pipeline output trace
- [ ] Trace shows 3 visible steps: document ingestion, retrieval (with similarity scores), answer generation
- [ ] Output is plausibly realistic (filenames, chunk counts, scores look like real tool output)
- [ ] No internal CI/agent pipeline references remain in the terminal copy
- [ ] Terminal animation (if any) still works correctly after content swap
- [ ] Copy fits the terminal viewport without horizontal scroll on 1280px+

## Out of Scope
- Live/functional RAG execution in the browser
- Multiple selectable pipeline examples (future "interactive demo" story)

## RICE Score
Reach: 10 | Impact: 2 | Confidence: 90% | Effort: XS(0.1) | RICE: 180

## Technical Notes
- File: `src/features/home/pages/HomeV2.tsx` (hero terminal component / inline content)
- Terminal content is likely a static string array — locate and replace
- Suggested trace lines:
  ```
  $ rag-pipeline run --source ./docs/handbook.pdf
  [1/3] ingesting  handbook.pdf ... 142 chunks indexed
  [2/3] retrieving top-3 for "What is the approval workflow?"
        chunk_047  score=0.91  "Section 4.2 — Approval Workflow..."
        chunk_051  score=0.87  "Section 4.3 — Escalation Paths..."
        chunk_019  score=0.84  "Section 2.1 — Submission Process..."
  [3/3] generating answer ... done (1.4s)
  Answer: "Approvals follow a 3-step process: submit → review → sign-off.
           Escalate to manager if review exceeds 48h (Section 4.3)."
  ```

## Dependencies
- Blocked by nothing — purely a content swap
'@
New-Issue -Title 'RC-3: Replace hero terminal with user-relatable RAG pipeline output' `
          -Body $b2 -Labels @('type:ux','P1-high','domain:platform','homepage') -Milestone $msNum

# ── Issue 3 ───────────────────────────────────────────────────────────────────
$b3 = @'
## Summary
The homepage currently has 11 visible sections, creating cognitive overload that
causes visitors to scroll past content without engaging. Restructure to a 6-section
flow that guides the visitor from orientation to commitment in a logical narrative arc.

## User Story
As a visitor, I want the homepage to tell a coherent story in a scannable flow, so
that I understand the platform value without scrolling through 11 separate sections.

## Context
Current section count and order (approximate RC-2 state):
1. Hero  2. Proof Bar  3. Quick Proof  4. Problem  5. Features  6. What-You-Build
7. Architecture Topics  8. Learning Journey  9. Testimonial/Quote  10. Community  11. CTA

Target 6-section structure:
1. Hero + Fork  2. Platform Pillars (merged: Features + What-You-Build + Quick Proof)
3. Journey Map (Learning Path 101→310)  4. Build Proof (1 concrete project output)
5. Community  6. Final CTA

## Acceptance Criteria
- [ ] Page has ≤ 6 visible, distinct sections (counted by section/landmark elements)
- [ ] Sections removed or merged: Quick Proof, Problem, Architecture Topics dissolved into Pillars
- [ ] "Features" grid and "What You'll Build" list merged into a single "Platform Pillars" section
- [ ] Section order matches: Hero+Fork → Pillars → Journey → Build Proof → Community → CTA
- [ ] No content duplication between sections
- [ ] Page scroll depth to CTA reduced vs RC-2 baseline

## Out of Scope
- Redesigning individual section internals beyond what's needed to merge/remove
- Updating section content copy (covered by other RC-3 issues)

## RICE Score
Reach: 10 | Impact: 3 | Confidence: 80% | Effort: M(1) | RICE: 24

## Technical Notes
- File: `src/features/home/pages/HomeV2.tsx`
- Identify JSX section boundaries (likely `<section>` or named `<div>` blocks)
- Remove Problem section entirely (RC-2 T3 copy)
- Remove Architecture Topics section (RC-2 T7/standalone section)
- Merge Quick Proof cards + Features grid + What-You-Build list into Pillars

## Dependencies
- Should be sequenced after Issue 1 (identity line / fork) and before Issues 4–6
  so the restructured shell exists for content-level changes
'@
New-Issue -Title 'RC-3: Reduce homepage from 11 sections to 6 — restructure flow' `
          -Body $b3 -Labels @('type:ux','P1-high','domain:platform','homepage') -Milestone $msNum

# ── Issue 4 ───────────────────────────────────────────────────────────────────
$b4 = @'
## Summary
The current hero headline defines the platform by what it is NOT ("Not Just Learn
Concepts"). RC-3 replaces it with a transformation-first headline that tells the
visitor what they BECOME, and updates the primary CTA to set a concrete, low-friction
first step expectation.

## User Story
As a prospective learner, I want the headline to describe who I'll become after using
this platform, not what the platform avoids, so that I feel pulled forward rather than
pushed away from something.

## Context
RC-2 headline: "Build Real-World AI Systems. Not Just Learn Concepts."
Problem: "Not Just Learn Concepts" still centres the headline on a negative comparison.
It defines the platform against a foil instead of for a future.

New direction — headline must answer: "What does the user become?"
Example targets (pick the strongest in implementation):
- "Become the AI engineer who ships, not just learns."
- "Go from AI curious to AI systems builder — in public."
- "Build AI systems. Ship them. Own the process."

Primary CTA change:
- Current: "Start Building AI Projects" (vague commitment)
- New: "Start with AI 101 — free, 10 min" → routes to /learn
  (sets expectation: first step is small, free, and fast)

## Acceptance Criteria
- [ ] Hero headline is transformation-first — describes who the user becomes, not what platform avoids
- [ ] Headline contains no negations ("not", "no", "without" framing)
- [ ] Primary CTA reads: "Start with AI 101 — free, 10 min"
- [ ] Primary CTA routes to `/learn`
- [ ] Secondary CTA unchanged or updated to "Explore the path" → journey section anchor
- [ ] Trust line updated to reinforce transformation (not "No fluff" defensive framing)

## Out of Scope
- A/B testing headline variants (requires analytics instrumentation beyond this sprint)
- Personalised headlines by visitor type (covered by fork block Issue 1)

## RICE Score
Reach: 10 | Impact: 3 | Confidence: 80% | Effort: XS(0.1) | RICE: 240

## Technical Notes
- File: `src/features/home/pages/HomeV2.tsx` (hero `<h1>` and CTA `<a>`/`<button>` elements)
- Change is pure copy + one route update — no structural JSX change needed

## Dependencies
- Pair with Issue 1 (identity line above headline ties into transformation framing)
'@
New-Issue -Title 'RC-3: Rewrite hero CTA and value proposition — transformation not inspiration' `
          -Body $b4 -Labels @('type:ux','P1-high','domain:platform','homepage') -Milestone $msNum

# ── Issue 5 ───────────────────────────────────────────────────────────────────
$b5 = @'
## Summary
The features grid "Certification Prep" card title is passive — it tells users what the
section is, not what they will do. Additionally, all 4 feature cards lack a "What
you'll do" activation line, leaving visitors to infer the concrete activity. Both gaps
reduce click-through and self-identification.

## User Story
As a visitor scanning the features grid, I want each card to tell me what I will
actively do — not just what the section contains — so that I can immediately see myself
doing it.

## Context
Current card titles (approximate):
1. "Certification Prep"  2. "AI Tools"  3. "Study Notes"  4. "Community"

Problems:
- "Certification Prep" is category language, not action language
- No card has a 1-line "What you'll do:" activation micro-copy
- Visitors skip cards that feel like navigation menus

Changes:
- Rename card #1: "Certification Prep" → "Practice Real Scenarios"
- Add activation line to each card (1 sentence, action verb, concrete outcome)

## Acceptance Criteria
- [ ] Card #1 title changed from "Certification Prep" to "Practice Real Scenarios"
- [ ] All 4 cards have a "What you'll do" activation line (1 sentence, starts with action verb)
- [ ] Activation lines are visually distinct from the card description (smaller, muted, or prefixed)
- [ ] No card title uses category/noun-phrase language without an action verb
- [ ] Changes are consistent in visual weight and spacing across all 4 cards

## Suggested Activation Lines (adjust in implementation)
1. Practice Real Scenarios — "Answer scenario-based exam questions mapped to real job tasks."
2. AI Tools — "Use interactive tools to visualise, test, and debug your AI systems."
3. Study Notes — "Read structured notes that connect concepts to production patterns."
4. Community — "See how others are building and share what you ship."

## Out of Scope
- Redesigning card layout or adding new cards
- Changing card destination routes

## RICE Score
Reach: 10 | Impact: 2 | Confidence: 90% | Effort: XS(0.1) | RICE: 180

## Technical Notes
- File: `src/features/home/pages/HomeV2.tsx` (features grid section)
- Locate the 4-card grid — likely a `features` or `pillars` array/JSX block
- Add an `activationLine` or `whatYoullDo` field to each card definition

## Dependencies
- Should be applied to whichever section structure results from Issue 3 (restructure)
'@
New-Issue -Title 'RC-3: Feature card #1 rename + add activation micro-copy to features' `
          -Body $b5 -Labels @('type:ux','P1-high','domain:platform','homepage') -Milestone $msNum

# ── Issue 6 ───────────────────────────────────────────────────────────────────
$b6 = @'
## Summary
The current creator quote is biographical/reflective — it tells a story about the
creator rather than modelling the mindset a visitor should aspire to. Replace it
with a quote that demonstrates the builder mindset in action and connects directly
to what the platform teaches.

## User Story
As a prospective learner reading the creator quote, I want the quote to show me the
standard of thinking I will develop here, so that I feel inspired to adopt that
mindset rather than hearing a founder's story.

## Context
Current quote direction (paraphrase): reflective, biographical — "I built this
because I wanted to learn in a different way."

Problem: biographical quotes build credibility for the speaker, not aspiration for
the reader. The visitor needs to see themselves in the quote — to think "that is how
I want to think about building."

Required new quote (exact):
"I ship this platform the same way I'd ship a production system — agents, CI/CD,
in public. That's the standard I'm teaching."

This quote:
- Models the builder mindset directly
- Connects the creator's practice to the platform's pedagogy
- Is specific and falsifiable (agents, CI/CD, in public) — not generic inspiration

## Acceptance Criteria
- [ ] Quote text updated to: "I ship this platform the same way I'd ship a production system — agents, CI/CD, in public. That's the standard I'm teaching."
- [ ] Attribution remains correct (creator name/handle)
- [ ] Quote section has no biographical context copy that redirects focus to the creator's history
- [ ] Visual treatment (blockquote, quotation marks, layout) is unchanged or improved

## Out of Scope
- Adding multiple quotes or rotating testimonials
- Changing the quote section's visual position on the page

## RICE Score
Reach: 10 | Impact: 2 | Confidence: 95% | Effort: XS(0.1) | RICE: 190

## Technical Notes
- File: `src/features/home/pages/HomeV2.tsx` (testimonial / quote section)
- Locate the quote string — likely a `testimonials` array or inline JSX
- Replace quote body only; keep surrounding component structure

## Dependencies
- None — fully independent content swap
'@
New-Issue -Title 'RC-3: Rewrite creator quote — builder mindset, not biography' `
          -Body $b6 -Labels @('type:ux','P1-high','domain:platform','homepage') -Milestone $msNum

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host "`n=== RC-3 Issue Gate — Complete ==="
Write-Host "Milestone: RC-3: Homepage — Platform Entry Point  (#$msNum)"
Write-Host ""
$created | Format-Table -AutoSize
Write-Host "`nAll issues: https://github.com/$repo/issues?milestone=$msNum"
