#!/usr/bin/env pwsh
# Creates 3 content-growth issues: SEO per-route, post-quiz share card, related content links
# Uses gh CLI (gh auth login session — no PAT required)
$repo = "ajeetchouksey/ajch_platform"
$results = @()

# ── ISSUE A: per-route SEO meta system ───────────────────────────────────────
$bodyA = @'
## Summary
Add dynamic per-route meta tags so each page, blog post, and SkillUp track has unique title, meta description, and Open Graph tags.

## Problem
Every page currently shares the same generic title and description. This blocks organic search traffic and makes social shares look broken (no card preview).

## Scope
- React-based per-route meta injection (react-helmet-async or Vite SSG meta approach)
- Dynamic tags for: Home, Blog list, BlogPost (per slug), SkillUp catalog, per-exam page, Notes page
- Open Graph: og:title, og:description, og:url, og:image (static share card)
- Twitter Card meta tags

## Acceptance Criteria
- [ ] Each page has a unique browser tab title
- [ ] Each blog post has its own description (from blog index excerpt field)
- [ ] Each SkillUp exam page has its own title/description (from catalog)
- [ ] Sharing any URL on LinkedIn/Twitter shows a proper card preview
- [ ] No regression on existing routing
'@

$urlA = gh issue create --repo $repo `
  --title "feat: per-route SEO meta system (title, description, Open Graph)" `
  --label "enhancement" `
  --body $bodyA 2>&1

$numA = $urlA -replace '.*issues/(\d+).*','$1'
Write-Host "Issue A created: #$numA -> $urlA"
$results += [pscustomobject]@{ issue = [int]$numA; title = "feat: per-route SEO meta system (title, description, Open Graph)" }

# ── ISSUE B: post-quiz score share card with email subscribe CTA ─────────────
$bodyB = @'
## Summary
After completing a quiz, show a score share card with social sharing buttons, an email subscribe CTA, and cross-track discovery nudge.

## Problem
Quiz completion is a high-intent moment with zero conversion path. Users finish and bounce. No subscriber capture, no social proof loop.

## Scope
- Score summary card shown after final question answered
- Share buttons: LinkedIn (pre-filled post), Twitter/X (thread format)
- Email subscribe input: name + email -> POST to ConvertKit/Beehiiv API
- Cross-track nudge: 'You completed CCA-F Domain 1 - try AB-100 Domain 1 next'
- Mobile responsive

## Acceptance Criteria
- [ ] Share card appears after quiz completion with score, domain name, percentage
- [ ] LinkedIn share opens pre-populated post with score
- [ ] Email input captures name + email, shows success toast
- [ ] Cross-track suggestions show 1-2 relevant other tracks
- [ ] Works on mobile
'@

$urlB = gh issue create --repo $repo `
  --title "feat: post-quiz score share card with email subscribe CTA" `
  --label "enhancement" `
  --body $bodyB 2>&1

$numB = $urlB -replace '.*issues/(\d+).*','$1'
Write-Host "Issue B created: #$numB -> $urlB"
$results += [pscustomobject]@{ issue = [int]$numB; title = "feat: post-quiz score share card with email subscribe CTA" }

# ── ISSUE C: related content cross-links ────────────────────────────────────
$bodyC = @'
## Summary
Surface related SkillUp tracks on blog posts, and related blog posts on SkillUp exam pages, to increase pages-per-session and content discovery.

## Problem
Blog and SkillUp are two separate silos. A reader of the GitHub Governance blog post has no signal that GH-BP skill track exists. A CCA-F learner has no path to the 'Agents Aren't a Feature' blog post.

## Scope
- Blog posts: show 'Related Skills' sidebar/footer section linking to relevant SkillUp tracks (tag-based matching)
- SkillUp exam pages: show 'Related Reading' section linking to relevant blog posts
- Matching logic: tag overlap between blog post tags and SkillUp domain keywords
- Max 2-3 suggestions per page

## Acceptance Criteria
- [ ] GitHub Governance blog post shows GH-BP skill track as related
- [ ] CCA-F exam page shows AI-related blog posts as related reading
- [ ] No network calls - matching done at render time from loaded index
- [ ] Mobile responsive
'@

$urlC = gh issue create --repo $repo `
  --title "feat: related content cross-links between blog posts and SkillUp tracks" `
  --label "enhancement" `
  --body $bodyC 2>&1

$numC = $urlC -replace '.*issues/(\d+).*','$1'
Write-Host "Issue C created: #$numC -> $urlC"
$results += [pscustomobject]@{ issue = [int]$numC; title = "feat: related content cross-links between blog posts and SkillUp tracks" }

# ── Output JSON ──────────────────────────────────────────────────────────────
$json = $results | ConvertTo-Json -Compress
Write-Host "`nJSON OUTPUT:"
Write-Host $json
$json | Out-File "$PSScriptRoot\..\content-growth-issues-result.json"
Write-Host "`nResult saved to content-growth-issues-result.json"
