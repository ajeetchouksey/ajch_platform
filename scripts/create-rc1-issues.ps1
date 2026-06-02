#!/usr/bin/env pwsh
# Creates labels feedback-1 + rc-1, then opens all 12 RC-1 issues
# Run from repo root: pwsh scripts/create-rc1-issues.ps1

Set-Location $PSScriptRoot\..

Write-Host "Creating labels..." -ForegroundColor Cyan
gh label create "feedback-1" --color "7057ff" --description "Sourced from user feedback round 1" 2>$null
gh label create "rc-1"       --color "0e8a16" --description "Release Candidate 1 — homepage & SEO sprint" 2>$null

# ── HELPER ────────────────────────────────────────────────────────────────────
function New-Issue($title, $body) {
  Write-Host "  Creating: $title" -ForegroundColor Yellow
  gh issue create --title $title --body $body --label "feedback-1" --label "rc-1"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P0
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

New-Issue "[T1][P0] Add SEO meta description + OG/Twitter tags to index.html" @"
## Context
\`index.html\` has only a \`<title>\` tag. No \`<meta name="description">\`, no Open Graph, no Twitter cards.
Every Google result shows blank. Every shared link on LinkedIn/Slack/Twitter shows no preview.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 8 + Fix 9 (P0 — Day 1).

## Why It Matters
- Zero-risk, 10-minute change with permanent compounding SEO value
- Google cannot correctly classify the platform without a description
- Every social share amplifies the wrong (blank) first impression
- Core objective: make the platform discoverable as an AI learning ecosystem

## Acceptance Criteria
- [ ] \`<meta name="description">\` — *"Master AI from fundamentals to enterprise architecture. Practitioner-built certification prep, technical blog, and developer tools. Free forever."*
- [ ] \`og:title\` = "Aarya — Learn, Build, and Scale with AI"
- [ ] \`og:description\` = ecosystem framing (not feature-specific)
- [ ] \`og:image\` = \`https://aaryaai.dev/og-preview.png\` (placeholder until OG image created)
- [ ] \`og:url\` = \`https://aaryaai.dev/\`  |  \`og:type\` = \`website\`
- [ ] \`twitter:card\` = \`summary_large_image\` + title + description + image
- [ ] \`<link rel="canonical" href="https://aaryaai.dev/" />\` added
- [ ] Validated with: https://developers.facebook.com/tools/debug/ + Twitter card validator

## File
\`index.html\`
"@

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P1
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

New-Issue "[T2][P1] Add AI Learning Journey section (101→310) to homepage" @"
## Context
The platform has structured learning content in \`/exams\` and \`/notes\` but the homepage gives no indication of a learning progression.
Visitors have no reason to return after their first visit — there is no visible journey.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 4; AaryaAI_Final_Strategic_Feedback.md — AI Learning Journey.

## Why It Matters
- Biggest retention signal on the homepage
- Surfaces content that already exists — no new content needed
- Differentiates from "random AI tool" — signals structured platform
- Core objective: visitors see a reason to come back and progress

## Acceptance Criteria
- [ ] New section added to \`HomeV2.tsx\` below the feature cards
- [ ] Section heading: "Your AI Learning Journey"
- [ ] 4-step horizontal stepper on desktop, vertical on mobile:
  - AI 101 — Fundamentals (prompting, GenAI basics, responsible AI) → links to \`/notes\`
  - AI 201 — Workflows (agents, automation, copilots) → links to \`/exams\`
  - AI 301 — Architecture (RAG, MCP, orchestration) → links to \`/blog?tag=architecture\`
  - AI 310 — Enterprise (governance, security, scaling) → links to \`/docs\`
- [ ] Each step shows: level badge + title + 2-line description + CTA link
- [ ] "Start Your AI Journey" CTA at bottom → \`/exams\`
- [ ] Fully responsive (mobile: vertical stack)
- [ ] Matches existing dark design system

## File
\`src/features/home/pages/HomeV2.tsx\`
"@

New-Issue "[T3][P1] Add 4th platform pillar card — Architecture & Notes" @"
## Context
The homepage currently shows 3 feature cards: Certification Prep, Technical Blog, Developer Tools.
Architecture notes (\`/docs\`, \`/notes\`) are completely invisible from the homepage.
A visitor who wants to learn AI architecture has no obvious entry point.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 3 (4 pillar cards); AaryaAI_Final_Strategic_Feedback.md — Ecosystem Positioning.

## Why It Matters
- 4 pillars = Learn, Build, Read, Architect — breaks "3-tool" perception
- Notes/Docs section already has significant content that gets zero homepage exposure
- Technical users (architects, senior engineers) need a visible signal within 5 seconds

## Acceptance Criteria
- [ ] 4th card added to \`features[]\` array in \`HomeV2.tsx\`
  - icon: \`BookMarked\` or \`Layers\`
  - color: \`#f59e0b\` (amber)
  - badge: "NEW"
  - title: "Architecture Notes"
  - subtitle: "RAG · MCP · Agentic Systems · Enterprise AI"
  - desc: "Deep-dive study notes on production AI architecture patterns — from agentic design to enterprise governance."
  - bullets: ["12+ architecture guides", "RAG, MCP, Agentic patterns", "Exam-aligned domain notes"]
  - cta: "Explore Notes"  →  \`/docs\`
- [ ] Feature grid changed from \`md:grid-cols-3\` to \`sm:grid-cols-2 lg:grid-cols-4\`
- [ ] Visual consistency with existing 3 cards (same height, same padding pattern)
- [ ] Mobile: 2-column or 1-column stacked as appropriate

## File
\`src/features/home/pages/HomeV2.tsx\`
"@

New-Issue "[T4][P1] Add Architecture topics showcase section to homepage" @"
## Context
The platform has deep content on RAG, MCP, Agentic AI, Prompt Engineering, AI Governance, and AI Observability — scattered across blog posts and notes.
Technical users (architects, senior engineers) visiting the homepage see none of this and leave within 10 seconds.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 7; AaryaAI_Homepage_Honest_Feedback.md Concern 2 (Technical Users Will Bounce).

## Why It Matters
- Technical users are force multipliers: they contribute content, build integrations, evangelize
- Architecture depth is the #1 signal that separates "serious platform" from "AI toy"
- Content already exists — this is purely a surfacing problem

## Acceptance Criteria
- [ ] New "Architecture & Labs" section added to \`HomeV2.tsx\` after learning journey
- [ ] Section heading: "Enterprise-Grade AI Architecture"
- [ ] 6-card grid (2×3 desktop, 1 column mobile):
  | Topic | Link target |
  |-------|------------|
  | Agentic AI | \`/blog?tag=agentic\` |
  | RAG Patterns | \`/blog?tag=rag\` |
  | MCP Architecture | \`/docs\` |
  | Prompt Engineering | \`/blog?tag=prompt-engineering\` |
  | AI Governance | \`/blog?tag=ai-governance\` |
  | AI Observability | \`/blog?tag=azure\` |
- [ ] Each card: icon + title + 1-line description + "Explore →" link
- [ ] "Explore Architecture Labs" CTA → \`/docs\`
- [ ] Hover effect consistent with existing card pattern

## File
\`src/features/home/pages/HomeV2.tsx\`
"@

New-Issue "[T5][P1] Strengthen community / open-source section on homepage" @"
## Context
The current homepage has only a small \`<StarRepo>\` button for GitHub. There is no visible "built in public" narrative, no contributor CTA, no community signal beyond a star count.
The platform is MIT licensed and open source — but you would never know from visiting the homepage.
Sourced from: AaryaAI_Final_Strategic_Feedback.md — Community Infrastructure; AaryaAI_Homepage_Fix_Blueprint.md Fix 6.

## Why It Matters
- Community signals create belonging and trust
- Open-source visibility attracts contributor ecosystem (blogs, tools, questions)
- GitHub stats are already fetched via \`fetchGitHubRepo()\` — just need to be displayed better
- Core objective: platform must feel alive, not static

## Acceptance Criteria
- [ ] Existing \`<LiveBar>\` GitHub stats promoted to a visible section (not just a row of numbers)
- [ ] Section heading: "Built in the Open"
- [ ] Visible stats: Stars, Forks, Followers, Repos (already fetched — just style uplift)
- [ ] "Contribute on GitHub" CTA button linking to \`https://github.com/ajeetchouksey/ajch_platform\`
- [ ] "Fork & Build" secondary link
- [ ] 1-line copy: "MIT licensed. Fork it, star it, contribute. Built in public because the best platforms grow with their community."
- [ ] Section placed after Architecture showcase, before footer

## File
\`src/features/home/pages/HomeV2.tsx\`
"@

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P2
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

New-Issue "[T6][P2] Add featured blog posts strip to homepage" @"
## Context
The homepage does not surface any blog content. The blog has 60+ articles but the homepage gives no indication of recent activity.
Visitors have no "fresh content here" signal — no reason to suspect there is something new to read.
Sourced from: AaryaAI_Homepage_Honest_Feedback.md Concern 4 (No Visible Depth) — "if users cannot see them, they do not exist".

## Why It Matters
- "Fresh content" signal is a primary return-visit driver
- Creates a homepage → blog → homepage engagement loop
- Blog is the platform's strongest SEO asset — homepage should amplify it
- 3 latest posts is enough; no new content needed

## Acceptance Criteria
- [ ] New section added to \`HomeV2.tsx\` after Architecture showcase
- [ ] Section heading: "Latest from Field Notes"
- [ ] Loads 3 most recent posts from blog manifest via \`loadBlogManifest()\`
- [ ] Each post card shows: title + date + primary tag badge + "Read →" link
- [ ] Horizontal row on desktop (3 equal cards), vertical stack on mobile
- [ ] "All Articles →" link at section bottom → \`/blog\`
- [ ] Loading skeleton shown while manifest fetches
- [ ] No layout shift when posts load

## Files
\`src/features/home/pages/HomeV2.tsx\`, \`src/lib/content-loader.ts\` (read-only reference)
"@

New-Issue "[T7][P2] Create /learn landing page with AI 101→310 journey map" @"
## Context
The primary CTA "Start Learning Free" links to \`/exams\` — but \`/exams\` drops the user directly into the CCA-F exam catalog.
A learner who arrives at the homepage and clicks "Start Learning Free" needs a proper entry point that shows the full journey: what to learn, in what order, why.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 4 + Week 1 Checklist (\`/learn\` page); AaryaAI_Final_Strategic_Feedback.md — AI Learning Journey table.

## Why It Matters
- The "Start Learning Free" CTA is the #1 conversion action — its destination must deliver on the promise
- A structured /learn page creates the "Structured, hands-on, community-driven" perception
- Connects all existing content (notes, exams, blog) into a coherent curriculum

## Acceptance Criteria
- [ ] New page created: \`src/features/learn/pages/Learn.tsx\`
- [ ] Route added in \`src/app/router.tsx\`: \`/learn\` → \`<Learn>\`
- [ ] Navigation entry added (sidebar or header): "Learn" → \`/learn\`
- [ ] Page sections:
  1. Hero: "Your AI Learning Path" + tagline
  2. Journey stepper: AI 101 → 201 → 301 → 310 (expanded version of T2 component)
  3. Level detail cards: each level shows topics list + link to relevant notes/exams/blog
  4. "Start with AI 101" primary CTA → \`/notes\` or \`/exams\`
- [ ] Mobile responsive
- [ ] Uses existing design tokens (no new raw Tailwind patterns)

## Files
\`src/features/learn/pages/Learn.tsx\` (new), \`src/app/router.tsx\`, \`src/components/Layout.tsx\`
"@

New-Issue "[T8][P2] Add JSON-LD structured data to index.html" @"
## Context
Google uses structured data (JSON-LD) to correctly classify websites in search results and enable rich snippets.
Without it, Google guesses the site category — and currently has enough signals to classify this as a general tool, not an educational platform.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 8 — SEO, Structured Data section.

## Why It Matters
- Enables Google rich results (sitelinks, search box, organization card)
- Correctly signals "EducationalOrganization" entity type
- Compounds over time — SEO authority builds faster with correct structured data

## Acceptance Criteria
- [ ] \`<script type="application/ld+json">\` block added to \`index.html\`
- [ ] \`@type: WebSite\` with name, url, description, \`potentialAction: SearchAction\`
- [ ] \`@type: Organization\` with name, url, logo, sameAs (GitHub URL)
- [ ] \`@type: EducationalOrganization\` declared in the same or linked block
- [ ] Valid JSON — no syntax errors
- [ ] Validated with: https://validator.schema.org/

## File
\`index.html\`
"@

New-Issue "[T9][P2] Create public/sitemap.xml" @"
## Context
There is no sitemap.xml. Google's crawler relies on link discovery, which means pages with fewer inbound links (notes, docs, individual blog posts) may not be indexed or may be crawled infrequently.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 8 — Sitemap section; Week 1 Checklist.

## Why It Matters
- Sitemap tells Google exactly what pages exist and their priority
- Notes and docs pages are content-rich but currently undiscoverable via SEO
- 30-minute task with long-term compounding value

## Acceptance Criteria
- [ ] \`public/sitemap.xml\` created with standard XML sitemap format
- [ ] Includes all static routes with correct priorities:
  | URL | Priority | Changefreq |
  |-----|----------|------------|
  | / | 1.0 | weekly |
  | /blog | 0.9 | daily |
  | /exams | 0.9 | weekly |
  | /learn | 0.9 | weekly |
  | /tools | 0.8 | weekly |
  | /docs | 0.8 | weekly |
  | /notes | 0.8 | weekly |
  | /team | 0.5 | monthly |
- [ ] \`<lastmod>\` set to 2026-06-02 (update on each release)
- [ ] Sitemap URL added to \`index.html\` or robots.txt
- [ ] After merge: manually submit to Google Search Console

## File
\`public/sitemap.xml\` (new), optionally \`public/robots.txt\`
"@

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P3
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

New-Issue "[T10][P3] Add 'How Aarya Works' platform lifecycle section to homepage" @"
## Context
The homepage currently has an agent pipeline terminal (cool for insiders; opaque for new visitors).
A new visitor arriving from search or social share has no "how does this work for me?" explainer.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 5 — "How AaryaAI Works" Platform View.

## Why It Matters
- Casual and intermediate users need a simple "what do I do here?" flow
- "Upload → Generate → Share" framing (old product) must never reappear; this replaces it
- 4-block lifecycle communicates continuous growth, not one-time usage

## Acceptance Criteria
- [ ] New section added to \`HomeV2.tsx\`
- [ ] Section heading: "How Aarya Works"
- [ ] 4 visual blocks (horizontal on desktop, vertical on mobile):
  1. **Learn** — Structured AI learning from fundamentals to enterprise → \`/learn\`
  2. **Build** — Hands-on labs, real tools, AI workflows → \`/tools\`
  3. **Contribute** — Share knowledge, fork the repo, grow the community → GitHub
  4. **Scale** — Architecture patterns, governance, production AI → \`/docs\`
- [ ] Each block: icon + title + 1-line description + subtle connecting arrow
- [ ] Subtle sequential fade-in on scroll-into-view
- [ ] Tagline below: "Learn AI. Build with AI. Contribute to AI. Scale with AI."

## File
\`src/features/home/pages/HomeV2.tsx\`
"@

New-Issue "[T11][P3] Add progress teaser / return nudge to homepage" @"
## Context
The platform has a full progress tracking system (\`/profile\`, localStorage, sync via GitHub Gist) but the homepage gives no hint it exists.
A learner who completes their first exam session has no visible prompt to track their progress or create an account.
Sourced from: AaryaAI_Final_Strategic_Feedback.md — Community Readiness; implicit from the learning journey framing.

## Why It Matters
- Progress tracking is the #1 retention mechanism for learning platforms
- Without awareness of it, users don't use it; without using it, they don't return
- No new backend needed — the system already exists

## Acceptance Criteria
- [ ] Small banner/card added to \`HomeV2.tsx\` (after proof bar or below hero)
- [ ] If user has no saved progress: show "Track your learning journey — free, no account needed" → \`/profile\`
- [ ] If user has saved progress (check \`localStorage\`): show "Continue where you left off — [X questions answered]" → \`/exams\`
- [ ] Non-intrusive: max 1 line of text + icon + link (not a modal, not a banner that blocks content)
- [ ] Dismissible (store dismiss state in localStorage)

## File
\`src/features/home/pages/HomeV2.tsx\`, \`src/lib/storage.ts\` (read-only reference for localStorage keys)
"@

New-Issue "[T12][P3] Add footer vision statement to Layout.tsx" @"
## Context
The footer bar was recently removed (commit 2bb411b) and nothing replaced it.
The page currently ends abruptly. There is no last impression, no vision statement, no navigation depth signal.
Sourced from: AaryaAI_Homepage_Fix_Blueprint.md Fix 10 — Footer Vision Statement.

## Why It Matters
- The footer is the last thing a visitor reads — it should reinforce platform identity
- A vision statement creates a lasting impression: "this platform has a purpose"
- Key nav links in footer signal platform depth without cluttering the header

## Acceptance Criteria
- [ ] Slim footer bar re-added to \`src/components/Layout.tsx\` (replace the one removed in 2bb411b)
- [ ] Vision statement: *"Aarya exists to make AI accessible, practical, and community-driven — for everyone from first-time learners to enterprise architects."*
- [ ] 4 key nav links: Learn · Blog · Tools · Docs
- [ ] GitHub link (external, \`_blank\`, \`noopener\`)
- [ ] Copyright line: "© 2026 Ajeet Chouksey · MIT License"
- [ ] Visual weight: lighter than the header — \`text-xs\`, muted tones
- [ ] No re-introduction of the verbose v2.4.0 badge + full nav removed in the previous fix

## File
\`src/components/Layout.tsx\`
"@

Write-Host ""
Write-Host "✅ All 12 RC-1 issues created." -ForegroundColor Green
Write-Host "View at: https://github.com/ajeetchouksey/ajch_platform/issues?q=label%3Arc-1" -ForegroundColor Cyan
