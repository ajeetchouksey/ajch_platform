#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Creates 5 Learner Experience issues (Epic 1 + Epic 2 + Epic 3) on ajeetchouksey/ajch_platform.
  Epic 1: Auth-Aware Learner Experience (Issues 1 + 2)
  Epic 2: AI Lesson Plans (Issues 3 + 4)
  Epic 3: Notes Page Enhancement (Issue 5)
.NOTES
  Uses gh CLI session auth (gh auth login) — no PAT file required for issue creation.
  Milestone "v2.1 — Platform Features" is created if it does not already exist.
  Run from workspace root:  .\scripts\create-learner-experience-issues.ps1
#>

$ErrorActionPreference = 'Stop'
$repo    = "ajeetchouksey/ajch_platform"
$results = @()

# ── Ensure required labels exist ────────────────────────────────────────────────
Write-Host "`nEnsuring labels exist..." -ForegroundColor Cyan

$labelsToCreate = @(
  @{ name = 'type:feat';      color = '7c3aed'; desc = 'New feature or capability' },
  @{ name = 'P1-high';        color = 'ea580c'; desc = 'Next sprint inclusion expected' },
  @{ name = 'P2-medium';      color = 'ca8a04'; desc = 'Scheduled in upcoming milestone' },
  @{ name = 'domain:platform';color = '7c3aed'; desc = 'Core platform / UX' },
  @{ name = 'domain:agent';   color = '9333ea'; desc = 'AI agent infrastructure' },
  @{ name = 'type:ux';        color = 'f59e0b'; desc = 'UI/UX improvements' },
  @{ name = 'enhancement';    color = 'a2eeef'; desc = 'Feature enhancement' },
  @{ name = 'auth';           color = '0075ca'; desc = 'GitHub auth, login, session management' },
  @{ name = 'ai';             color = '8b5cf6'; desc = 'AI-powered features and integrations' },
  @{ name = 'lesson-plans';   color = '10b981'; desc = 'Study plans, schedules, learning paths' },
  @{ name = 'notes';          color = '0ea5e9'; desc = 'Study notes page features' }
)

foreach ($l in $labelsToCreate) {
  gh label create $l.name --color $l.color --description $l.desc --repo $repo 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  Created label: $($l.name)" -ForegroundColor Green
  } else {
    Write-Host "  Label exists (ok): $($l.name)" -ForegroundColor DarkGray
  }
}

# ── Ensure milestone exists ──────────────────────────────────────────────────────
Write-Host "`nEnsuring milestone 'v2.1 — Platform Features' exists..." -ForegroundColor Cyan

$milestone = 'v2.1 — Platform Features'
$msNumber  = gh api "repos/$repo/milestones" --paginate `
               --jq '.[] | select(.title | test("v2.1")) | .number' 2>$null

if (-not $msNumber) {
  $msOut = gh api "repos/$repo/milestones" --method POST `
    -f title='v2.1 — Platform Features' `
    -f description='Auth-aware learner experience, AI lesson plans, notes page enhancements, and study progress tracking.' `
    -f state='open' `
    -f due_on='2026-09-30T00:00:00Z' 2>&1
  $msNumber = ($msOut | ConvertFrom-Json).number
  Write-Host "  Created milestone #${msNumber}: ${milestone}" -ForegroundColor Green
} else {
  Write-Host "  Found existing milestone #${msNumber}: ${milestone}" -ForegroundColor DarkGray
}

# ── Helper: create an issue and return its number ──────────────────────────────
function New-Issue {
  param(
    [string]$Title,
    [string]$Body,
    [string[]]$Labels
  )
  Write-Host "`n  Creating: $Title" -ForegroundColor Yellow
  $labelArgs = $Labels | ForEach-Object { "--label"; $_ }
  $url = gh issue create `
    --repo $repo `
    --title $Title `
    --body $Body `
    --milestone $milestone `
    @labelArgs 2>&1
  $num = ($url | Select-String -Pattern '/issues/(\d+)').Matches[0].Groups[1].Value
  Write-Host "  → #$num  $url" -ForegroundColor Green
  return [pscustomobject]@{ Number = [int]$num; Title = $Title; Url = $url }
}

# ════════════════════════════════════════════════════════════════════════════════
# EPIC 1 — AUTH-AWARE LEARNER EXPERIENCE
# ════════════════════════════════════════════════════════════════════════════════

Write-Host "`n═══ EPIC 1: Auth-Aware Learner Experience ═══" -ForegroundColor Magenta

# ── Issue 1 — P1: GitHub Login — Readiness Panel & Persistent Progress ──────────
$body1 = @'
## User Story
As a **learner preparing for a certification exam**, I want to see a personalised readiness panel on the exam home page showing my current score, progress by domain, and a recommended next step, so that I always know exactly where I stand and what to do next.

## Context
Auth infrastructure is already wired (`src/lib/auth.tsx` + `src/components/GithubLogin.tsx`). Quiz scores are saved to localStorage via `saveSession()` in `src/lib/storage.ts`. This issue builds the readiness UI layer on top of that existing foundation — no new auth changes are needed.

## Scope

### ExamHome — Readiness Panel (`isLoggedIn === true` gate)
- **Readiness Ring**: circular progress ring showing overall % score from quiz session history (compute from localStorage quiz scores for the exam)
- **Per-domain mini progress bars**: one bar per domain showing best quiz score (0–100%), labelled "D1: 78%", "D2: Not started", etc.
- Subtitle: "2 of 5 domains started" (count of domains with score > 0)
- **Domain tile grid**: each domain tile shows a status chip — `Strong` (score ≥ 70%), `In progress` (1–69%), `Not started` (no score)
- **Recommended next step banner**: auto-selects the first domain with 0% quiz score → "Start D3: Tool Use & Orchestration" → links to either Notes or Quiz for that domain
- **Estimated Study Time card**: hours of notes remaining + questions left + "at 1h/day → ready in ~X days" heuristic

### Notes Page — Reading Progress
- Reading progress bar per domain stored in localStorage key `notes_progress_{examId}_{domainId}` (0–100% based on scroll depth)
- "This Domain" sidebar mini-widget showing % read + estimated reading time remaining
- Progress updates on scroll (debounced, 500 ms)

### Logged-Out State
- ExamHome renders study tool cards + domain weight chart (existing behaviour) as normal
- Readiness panel area shows a blurred/locked teaser card with "Sign in with GitHub to track your progress →" CTA
- Notes page hides the progress widget for anonymous users (no placeholder shown)

### Guard Pattern
```tsx
// All readiness components wrapped with:
{isLoggedIn && <ReadinessPanel examId={examId} />}
{!isLoggedIn && <ReadinessTeaser />}
```

## RICE Score
| Factor | Value | Notes |
|--------|-------|-------|
| Reach | 9 | Every exam learner (all active users) |
| Impact | 3 | Direct exam readiness signal — core value prop |
| Confidence | 85% | LocalStorage data already exists; UI is well-defined |
| Effort | M (1) | ~1 sprint: 3–4 components, no new data infra |
| **RICE** | **22.95** | P1 — next sprint |

## Acceptance Criteria
- [ ] Logged-out user sees ExamHome with study tool cards + domain weight chart (existing) + blurred readiness panel with "Sign in with GitHub" CTA
- [ ] Logged-in user sees live readiness ring showing overall % score computed from localStorage quiz history for the current exam
- [ ] Per-domain progress bars and status chips (Strong / In progress / Not started) render correctly for each domain
- [ ] "Recommended next step" banner auto-populates from the first domain with 0% quiz score, linking to Notes or Quiz for that domain
- [ ] Notes page shows a reading progress bar (localStorage-backed, scroll-depth-based) for logged-in users only
- [ ] All readiness state (ring %, domain scores, notes progress) survives page refresh
- [ ] `pnpm build` passes with zero TypeScript errors

## Out of Scope
- Syncing progress to a remote Gist or backend (localStorage only for this issue)
- AI-generated recommendations (see Issue 3: Lesson Plan Generator)
- Progress across multiple devices (covered in a future issue)

## Technical Notes
- Quiz score source: `localStorage` key `quiz_sessions_{examId}` — read via existing `loadSessions()` in `src/lib/storage.ts`
- ExamHome page: `src/features/exams/pages/ExamHome.tsx`
- Notes page: `src/features/exams/pages/Notes.tsx`
- Auth hook: `useAuth()` from `src/lib/auth.tsx`
- New components suggested: `ReadinessPanel`, `ReadinessTeaser`, `DomainProgressBar`, `RecommendedNextStep`

## Dependencies
None — builds on existing auth + localStorage infrastructure.
'@

$i1 = New-Issue `
  -Title '[EPIC1-1][P1] Readiness panel + persistent progress on ExamHome (auth-gated)' `
  -Body $body1 `
  -Labels @('type:feat', 'P1-high', 'domain:platform', 'auth', 'enhancement')

$results += $i1

# ── Issue 2 — P2: Anonymous Progress & Soft-Gate Upgrade Prompt ──────────────────
$body2 = @'
## User Story
As an **anonymous visitor exploring the platform**, I want to take quizzes and read notes without signing in, with my progress saved locally, and see a gentle nudge to sign in to preserve my data across devices — so that I can experience value before committing to login.

## Context
Depends on Issue #1 (auth-aware readiness panel). This issue adds the anonymous-mode experience layer: localStorage progress for unauthenticated users, soft-gate prompts at high-intent moments, and score promotion on login.

## Scope

### Anonymous Quiz Flow
- Quiz scores continue to save to localStorage (existing behaviour via `saveSession()`) — no change needed
- After completing a quiz, show a one-time-per-session upgrade nudge toast/modal:
  > "Your score has been saved locally. Sign in with GitHub to keep it across devices →"
  - Dismiss button stores `nudge_dismissed_{examId}` in sessionStorage (shown once per session)
  - "Sign in" button triggers `GithubLogin` flow

### ExamHome — Guest Mode Banner
- One-time dismissible info banner at top of ExamHome when `!isLoggedIn`:
  > "You're in guest mode — your progress is saved locally only"
  - Dismiss stored in `localStorage` key `guest_banner_dismissed`
  - Only shown once (survives page refresh once dismissed)

### Domain Status Tiles (Anonymous)
- Domain tiles show "Sign in to track →" chip instead of Strong/In progress/Not started status chips (from Issue 1)

### Notes Reading Progress (Anonymous)
- Notes page reading progress bar still works for anonymous users (localStorage only)
- No sidebar mini-widget shown for anonymous users (keep the notes page clean)

### Login → Progress Merge
- On successful GitHub login, call a `mergeAnonymousProgress(userId)` helper that:
  - Reads all `quiz_sessions_*` keys from localStorage
  - Tags each session with the newly acquired `userId`
  - Writes them back — they're now "owned" sessions available to the readiness panel

## RICE Score
| Factor | Value | Notes |
|--------|-------|-------|
| Reach | 7 | Anonymous visitors (high proportion of new users) |
| Impact | 2 | Reduces bounce at high-intent moment; improves conversion |
| Confidence | 80% | Pattern proven by many SaaS tools |
| Effort | S (0.3) | ~1–2 days: banner + toast + merge helper |
| **RICE** | **37.3** | Deceptively high RICE due to low effort — queue after Issue 1 |

## Acceptance Criteria
- [ ] Anonymous quiz scores persist in localStorage and are displayed in the session (existing)
- [ ] Post-quiz upgrade nudge appears once per session after completing a quiz (dismissible)
- [ ] Guest mode banner appears on ExamHome for anonymous users (dismissible, stored in localStorage)
- [ ] Domain tiles show "Sign in to track →" chip for anonymous users instead of progress chips
- [ ] Reading progress bar on Notes page works without login (localStorage)
- [ ] On GitHub login, anonymous quiz sessions are promoted to authenticated state (tagged with userId)

## Out of Scope
- Full score sync to Gist / remote storage (future issue)
- Requiring login to access any feature (platform stays fully accessible anonymously)

## Technical Notes
- Post-quiz nudge: add to quiz completion screen in `src/features/exams/pages/Quiz.tsx`
- ExamHome banner: add to `src/features/exams/pages/ExamHome.tsx`
- Progress merge helper: new function `mergeAnonymousProgress()` in `src/lib/storage.ts`
- Auth state: `useAuth()` from `src/lib/auth.tsx`

## Dependencies
- Issue #1 (Readiness Panel) — anonymous domain tiles reference the same tile component
'@

$i2 = New-Issue `
  -Title '[EPIC1-2][P2] Anonymous progress + soft-gate upgrade prompt (guest mode)' `
  -Body $body2 `
  -Labels @('type:feat', 'P2-medium', 'domain:platform', 'type:ux', 'auth', 'enhancement')

$results += $i2

# ════════════════════════════════════════════════════════════════════════════════
# EPIC 2 — AI LESSON PLANS
# ════════════════════════════════════════════════════════════════════════════════

Write-Host "`n═══ EPIC 2: AI Lesson Plans ═══" -ForegroundColor Magenta

# ── Issue 3 — P1: Lesson Plan Generator — Agent-Driven Study Schedule ───────────
$body3 = @'
## User Story
As a **learner with an upcoming exam date**, I want the platform to generate a personalised day-by-day study plan based on my target date and domain quiz scores, so that I always have a structured, actionable schedule and know exactly what to do today.

## Context
The platform already has per-domain quiz scores in localStorage, exam domain configs in the registry, and domain weights defined in `ExamConfig`. This issue adds a plan generation layer that uses that existing data — no AI API call in P1 scope (smart defaults only). AI personalisation is Issue 4.

## Scope

### New Route: `/skillup/:examId/plan`
- New page: `src/features/exams/pages/StudyPlan.tsx`
- Register route in `src/app/router.tsx`

### Plan Generation Logic (P1 — static smart defaults, no AI API call)
```typescript
interface StudySession {
  day: number;
  domainId: string;       // e.g. "D1"
  domainTitle: string;
  activities: Activity[];
  completed: boolean;
  estimatedMinutes: number;
}

interface Activity {
  type: 'notes' | 'quiz' | 'review';
  label: string;
  link: string;
  estimatedMinutes: number;
  completed: boolean;
}

interface StudyPlan {
  examId: string;
  targetDate: string;     // ISO date
  generatedAt: string;
  sessions: StudySession[];
}
```

**Session allocation rules:**
- Domain score ≥ 70% → "Review Only" session: 15 min (Read Notes cheat sheet → Quick quiz 5 questions)
- Domain score 1–69% → "Reinforce" session: 30 min (Read Notes → Domain Quiz 15 questions → Review Traps)
- Domain score = 0 (not started) → "Full" session: 45–60 min (Read Notes → Domain Quiz → Scenarios → Review Traps)
- Domains sorted by exam weight descending (highest weight domain = Day 1)
- Sessions spread across days to target date; if target date < days needed → compress to 2 sessions/day (flag to user)

### Target Date Picker
- Date input at top of plan page
- Defaults to "4 weeks from today"
- On change, re-generates plan (recalculate session spread)

### Plan Card Rendering
Each session renders as an expandable card:
```
Day 3 — D3: Tool Use & Orchestration        [Not started]
  ⏱ 45 min
  ├─ 📖 Read Notes (25 min)                 [ ] → /skillup/ccaf/notes?d=3
  ├─ 🧠 Domain Quiz — 15 questions (15 min) [ ] → /skillup/ccaf/quiz?domain=3
  └─ 🔴 Review Exam Traps (5 min)           [ ] → /skillup/ccaf/notes?d=3#traps
```

### "Today's Task" Widget on ExamHome
- Add a `TodaysTask` component to `ExamHome.tsx` (rendered after study tool cards)
- Shows the next incomplete session from the active plan: domain name, activity count, time estimate
- "Continue plan →" link to `/skillup/:examId/plan`
- If no plan exists: "Create your study plan →" CTA

### Data Storage
```json
// localStorage key: study_plan_{examId}
{
  "examId": "ccaf",
  "targetDate": "2026-07-15",
  "generatedAt": "2026-06-10T08:00:00Z",
  "sessions": [
    {
      "day": 1, "domainId": "D1", "domainTitle": "Agentic Architecture",
      "estimatedMinutes": 45, "completed": false,
      "activities": [
        { "type": "notes",  "label": "Read D1 Notes", "link": "/skillup/ccaf/notes?d=1", "estimatedMinutes": 25, "completed": false },
        { "type": "quiz",   "label": "D1 Quiz (15 Qs)", "link": "/skillup/ccaf/quiz?domain=1", "estimatedMinutes": 15, "completed": false },
        { "type": "review", "label": "Review Exam Traps", "link": "/skillup/ccaf/notes?d=1#traps", "estimatedMinutes": 5, "completed": false }
      ]
    }
  ]
}
```

## RICE Score
| Factor | Value | Notes |
|--------|-------|-------|
| Reach | 8 | All active exam learners with a target date |
| Impact | 3 | Transforms passive browsing into structured prep — high perceived value |
| Confidence | 80% | Plan logic is well-defined; no external dependencies |
| Effort | M (1) | New page + plan engine + widget — ~1 sprint |
| **RICE** | **19.2** | P1 — next sprint |

## Acceptance Criteria
- [ ] User sets target exam date → plan auto-generates with sessions spread across days to the target date
- [ ] Each session shows: domain name, activity list (Read → Quiz → Review), time estimate per activity
- [ ] Completing an activity (checkbox) marks it done and persists in localStorage
- [ ] "Today's Task" widget on ExamHome shows the next incomplete session with a "Continue plan" link
- [ ] Plan recalculates when user changes the target date
- [ ] Domains with score ≥ 70% generate a shorter "Review Only" session (15 min vs 45 min)
- [ ] `pnpm build` passes with zero TypeScript errors

## Out of Scope
- AI API calls for plan generation (Issue 4)
- Calendar export (iCal/Google Cal) — future iteration
- Multi-exam plans

## Technical Notes
- Exam domain weights: `ExamConfig.domains[].weight` from exam registry
- Quiz score source: `loadSessions(examId)` from `src/lib/storage.ts`
- New page: `src/features/exams/pages/StudyPlan.tsx`
- New component: `src/components/TodaysTask.tsx`
- Plan generator util: `src/lib/plan-generator.ts` (pure function — easy to test)

## Dependencies
- Issue #1 (Readiness Panel) — quiz scores feed plan personalisation
'@

$i3 = New-Issue `
  -Title '[EPIC2-3][P1] Lesson plan generator — smart study schedule from quiz scores + target date' `
  -Body $body3 `
  -Labels @('type:feat', 'P1-high', 'domain:platform', 'ai', 'lesson-plans', 'enhancement')

$results += $i3

# ── Issue 4 — P2: AI-Enhanced Lesson Plan — Principal Mentor Agent Integration ──
$body4 = @'
## User Story
As a **learner who wants personalised guidance**, I want to ask an AI mentor to build me a study plan tailored to my weak areas and study style, and get inline explanations per domain — so that I feel like I have a coach, not just a schedule.

## Context
Extends Issue #3 (Lesson Plan Generator) with AI personalisation via the Principal Mentor agent. The static plan generator (Issue 3) provides the base plan; this issue adds an AI overlay that can rewrite, explain, and advise.

## Scope

### "Generate AI Plan" Button
- On `/skillup/:examId/plan` page, add a "Generate AI Plan" button (shown after base plan is rendered)
- On click: collect context payload and call Principal Mentor agent
- Context payload:
  ```json
  {
    "examId": "ccaf",
    "examTitle": "CCA-F: Claude AI Certification",
    "targetDate": "2026-07-15",
    "domainScores": { "D1": 45, "D2": 72, "D3": 0, "D4": 88, "D5": 30 },
    "domainWeights": { "D1": 25, "D2": 20, "D3": 20, "D4": 15, "D5": 20 },
    "request": "Build me a focused study plan highlighting my weak domains"
  }
  ```

### Agent Response → Plan Rendering
- Agent returns a structured markdown plan (daily sessions format)
- Plan parser converts markdown to `StudySession[]` (reuses Issue 3 types)
- AI-generated plan replaces the static plan in the page state (with "AI Plan" badge indicator)
- User can always "Reset to auto-generated plan" to go back to the static version

### Natural Language Request Input
- Text input on the plan page: "Tell the mentor what you need..." (placeholder)
- Suggested prompts shown as chips:
  - "Focus on my weakest domains"
  - "Give me a 5-day crash course"
  - "I learn best with short daily sessions"
- Input + selected prompt appended to context payload `request` field

### Inline "Ask Mentor" Per Session
- Each session card has an "Ask mentor →" collapsed panel
- Clicking expands a pre-seeded chat input:
  > "Why is D3: Tool Use important and what are the most likely exam questions?"
- Mentor response rendered as markdown below the session card
- State stored in `localStorage` per session (persists between page loads)

### UX Details
- Loading state while agent call in flight: skeleton placeholder with "Mentor is building your plan…"
- Error state: "Mentor unavailable — showing auto-generated plan" (graceful fallback)
- AI plan sections clearly badged to distinguish from auto-generated content

## RICE Score
| Factor | Value | Notes |
|--------|-------|-------|
| Reach | 6 | Learners who engage deeply with study tools (subset of total) |
| Impact | 3 | AI mentor is high perceived value — differentiates platform |
| Confidence | 70% | Agent API integration has unknowns; depends on Issue 3 being stable |
| Effort | L (3) | Agent integration, parser, inline chat — multi-sprint |
| **RICE** | **4.2** | P2 — schedule after Issue 3 is shipped and stable |

## Acceptance Criteria
- [ ] "Generate AI Plan" button on the plan page calls Principal Mentor agent with exam + score context
- [ ] Agent response is parsed into `StudySession[]` and rendered as interactive session cards
- [ ] User can provide a natural language request (free text or chip selection) before generating
- [ ] Inline "Ask Mentor" panel works per session — opens pre-seeded chat, renders response as markdown
- [ ] Graceful fallback to auto-generated plan if agent call fails
- [ ] AI-generated plan is clearly badged as "AI Plan" vs auto-generated

## Out of Scope
- Training or fine-tuning the agent (uses Principal Mentor agent as-is)
- Voice interface
- Multi-turn full chat (single request/response per session inline panel)

## Technical Notes
- Agent: Principal Mentor (existing agent infrastructure)
- Agent call pattern: follow existing agent integration if present in codebase; else implement as a POST to agent endpoint with context JSON
- Parser: extend `src/lib/plan-generator.ts` with `parseMentorResponse(markdown: string): StudySession[]`
- Inline chat state: `localStorage` key `mentor_chat_{examId}_{sessionDay}`

## Dependencies
- Issue #3 (Lesson Plan Generator) — must be shipped first; this issue extends it
- Principal Mentor agent must be deployed and accessible
'@

$i4 = New-Issue `
  -Title '[EPIC2-4][P2] AI-enhanced lesson plan — Principal Mentor agent personalisation + inline session chat' `
  -Body $body4 `
  -Labels @('type:feat', 'P2-medium', 'domain:platform', 'domain:agent', 'ai', 'lesson-plans', 'enhancement')

$results += $i4

# ════════════════════════════════════════════════════════════════════════════════
# EPIC 3 — NOTES PAGE ENHANCEMENT
# ════════════════════════════════════════════════════════════════════════════════

Write-Host "`n═══ EPIC 3: Notes Page Enhancement ═══" -ForegroundColor Magenta

# ── Issue 5 — P1: Study Notes Page — Quick Facts, Exam Traps, End-of-Domain CTAs ──
$body5 = @'
## User Story
As a **learner reading study notes**, I want to immediately see key facts about the domain I'm in, have exam traps visually highlighted, and have a clear call-to-action at the end of each domain — so that I can study more efficiently and never lose context or momentum.

## Context
The redesign mockup at `__preview__/redesign-mockup.html` already defines the visual design for this feature. The notes page is `src/features/exams/pages/Notes.tsx`. Markdown content uses `.note-trap` CSS class (already defined in `src/index.css`) and `**Exam Trap:**` inline patterns. The Notes page renders markdown via `ReactMarkdown` + `rehype-raw` so custom HTML classes in content already work.

## Scope

### Quick Facts Panel (above domain prose content)
A compact facts strip rendered above the markdown content for each domain, sourced from the exam registry:
- 📊 Domain weight %
- ❓ Question count (estimated from exam registry)
- 🚩 Exam trap count (scanned from markdown content — count occurrences of `**Exam Trap:**` or `> [!TRAP]` or `.note-trap`)
- ⏱ Read time (already computed by existing `readingTime()` util)

```tsx
<QuickFactsPanel
  domainWeight={domain.weight}
  questionCount={domain.questionCount}
  trapCount={trapCount}          // scanned from markdown
  readingMinutes={readingTime(content)}
/>
```

### Exam Trap Callout Rendering
Ensure all exam trap patterns in markdown render with red callout styling:
1. `.note-trap` div blocks (already styled in CSS — verify rendering works through `rehype-raw`)
2. `**Exam Trap:**` inline bold prefix → wrap in a `<span class="inline-trap">` styled with `color: #ef4444; font-weight: 700`
3. `> [!TRAP]` GitHub-flavoured alert syntax → custom `rehype` plugin or remark transformer → renders as `.note-trap` div

**Visual spec (from mockup):**
- Red left border: `border-left: 4px solid #ef4444`
- Dark red background: `background: rgba(239,68,68,0.08)`
- Red "⚠ EXAM TRAP" label in upper-left corner
- Body text in `#fca5a5`

### Blue Insight Callout
`> [!NOTE]` or `.note-insight` → blue panel:
- Blue left border: `border-left: 4px solid #3b82f6`
- Background: `rgba(59,130,246,0.08)`
- "💡 INSIGHT" label in upper-left

### Domain Header Enhancement
- D2 badge (domain number pill) with colour matching exam scheme
- Chips row below domain title: ⏱ read time · 📊 weight · N sections

### End-of-Domain CTAs
After the final section of content for each domain:
```tsx
<EndOfDomainActions
  examId={examId}
  domainId={domain}
  questionCount={domain.questionCount}
  nextDomain={nextDomain}   // null if last domain
/>
```
- Primary button: "Quiz this domain — N questions →" → links to `/skillup/:examId/quiz?domain=N`
- Secondary button: "Next domain → D{N+1}: {title}" (already exists as nav; style as CTA button)
- If last domain: "Quiz all domains — full exam →" primary + "Back to Exam Home →" secondary

### Right Panel — "Exam Traps on This Page" Widget
Add a sticky right-panel widget (desktop only, xl: breakpoint) listing all exam trap headings/labels on the current domain page:
- Scanned from the rendered markdown: collect all `.note-trap` elements
- Clickable — `scrollIntoView()` to the trap anchor
- Count badge: "3 traps on this page"

## RICE Score
| Factor | Value | Notes |
|--------|-------|-------|
| Reach | 10 | All notes readers — most-visited content pages |
| Impact | 2 | Improves scan efficiency; reduces "miss the trap" failure mode |
| Confidence | 90% | Mockup exists; CSS patterns already defined; clear implementation path |
| Effort | S (0.3) | ~2–3 days: components + markdown scanning + CSS |
| **RICE** | **60** | High-RICE quick win — schedule in next sprint |

## Acceptance Criteria
- [ ] Quick Facts panel renders above markdown prose for each domain, showing weight %, question count, trap count, and read time
- [ ] All `.note-trap` div blocks in markdown render with red left border + dark red background + "⚠ EXAM TRAP" label
- [ ] `**Exam Trap:**` inline bold prefix gets red styled `<span>` treatment
- [ ] `> [!NOTE]` blockquotes render as blue insight panels
- [ ] End-of-domain CTAs ("Quiz this domain" + "Next domain →") appear after the last section of content
- [ ] Right-panel "Exam Traps on this page" widget (desktop xl: only) lists traps and scrolls to them on click
- [ ] `pnpm build` passes with zero TypeScript errors

## Out of Scope
- Editing or adding trap annotations from the UI (content is markdown-source-of-truth)
- Reading progress bar (covered in Issue 1 — auth-gated)
- Mobile right panel (desktop-only widget)

## Technical Notes
- Notes page: `src/features/exams/pages/Notes.tsx`
- CSS: `src/index.css` (`.note-trap` already defined — verify completeness, add `.note-insight`)
- Trap count scanning util: pure function `countTraps(markdown: string): number` — check for `note-trap`, `**Exam Trap:**`, `> [!TRAP]`
- Right panel trap list: scan DOM after render with `document.querySelectorAll('.note-trap')` in a `useEffect`
- Mockup reference: `__preview__/redesign-mockup.html`
- New components: `QuickFactsPanel`, `EndOfDomainActions`, `ExamTrapsList`

## Dependencies
None — standalone enhancement to existing Notes page.
'@

$i5 = New-Issue `
  -Title '[EPIC3-5][P1] Notes page — Quick Facts panel, exam trap callouts, end-of-domain CTAs, trap list widget' `
  -Body $body5 `
  -Labels @('type:feat', 'P1-high', 'domain:platform', 'type:ux', 'notes', 'enhancement')

$results += $i5

# ── Summary ─────────────────────────────────────────────────────────────────────
Write-Host "`n`n═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LEARNER EXPERIENCE ISSUES — CREATED" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host ("  {0,-6} {1,-65} {2}" -f "Issue", "Title", "URL") -ForegroundColor White
Write-Host ("  {0,-6} {1,-65} {2}" -f "─────", "─────────────────────────────────────────────────────────────────", "───────────────────────────────────────────────")
foreach ($r in $results) {
  Write-Host ("  #{0,-5} {1,-65} {2}" -f $r.Number, ($r.Title.Substring(0, [Math]::Min(65, $r.Title.Length))), $r.Url) -ForegroundColor Green
}

Write-Host ""
Write-Host "  Milestone: v2.1 — Platform Features  (#$msNumber)" -ForegroundColor DarkGray
Write-Host "  All issues: https://github.com/$repo/issues?milestone=$msNumber" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  EPIC 1 — Auth-Aware Learner Experience" -ForegroundColor Magenta
Write-Host "    Issue #$($results[0].Number): [P1] Readiness panel + persistent progress" -ForegroundColor White
Write-Host "    Issue #$($results[1].Number): [P2] Anonymous progress + soft-gate upgrade prompt" -ForegroundColor White
Write-Host "  EPIC 2 — AI Lesson Plans" -ForegroundColor Magenta
Write-Host "    Issue #$($results[2].Number): [P1] Lesson plan generator" -ForegroundColor White
Write-Host "    Issue #$($results[3].Number): [P2] AI-enhanced lesson plan + mentor agent" -ForegroundColor White
Write-Host "  EPIC 3 — Notes Page Enhancement" -ForegroundColor Magenta
Write-Host "    Issue #$($results[4].Number): [P1] Quick Facts + exam trap callouts + CTAs" -ForegroundColor White
Write-Host ""

# Save results to file for reference
$outFile = Join-Path $PSScriptRoot ".." "learner-experience-issues-result.json"
$results | ConvertTo-Json | Out-File $outFile
Write-Host "  Results saved to: learner-experience-issues-result.json" -ForegroundColor DarkGray
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
