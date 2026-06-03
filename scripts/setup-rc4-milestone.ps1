#!/usr/bin/env pwsh
# RC-4: SkillUp Restructure — create milestone + 6 issues
$repo  = "ajeetchouksey/ajch_platform"
$log   = "$PSScriptRoot/../rc4-setup-result.txt"
"=== RC-4 Setup $(Get-Date) ===" | Out-File $log

# ── Milestone ────────────────────────────────────────────────────────────────
$ms = gh api repos/ajeetchouksey/ajch_platform/milestones `
        --method POST `
        -f title="RC-4: SkillUp Restructure" `
        -f description="Migrate content from flat dirs to skillup/{cert}/ folder structure with contentLevel tagging, auto-discovery catalog, scoped session storage, and /skillup routing." `
        --jq '.number' 2>&1
"Milestone #$ms created" | Add-Content $log
Write-Host "Milestone: RC-4 is #$ms"

# ── Labels (ensure exist) ─────────────────────────────────────────────────────
foreach ($l in @("P1-high","domain:platform","domain:content","domain:tooling")) {
  gh label create $l --repo $repo --color "0075ca" --force 2>&1 | Out-Null
}

# ── Issues ───────────────────────────────────────────────────────────────────
$issues = @(
  @{
    title = "RC-4-A: SkillConfig schema — add contentLevel + skillId to types"
    labels = "P1-high,domain:platform"
    body = @"
## What
- Add `contentLevel: '101' | '201' | '301' | '401'` to `ExamConfig` in `src/types/content.ts`
- Add `schemaVersion?: string` to `ExamConfig`
- Add `skillId: string` to `QuizSession` so sessions are skill-scoped
- Add `SkillCatalog` type shape for `catalog.json`

## Why
Foundation for all other RC-4 issues. Every other change depends on these types being correct.

## Acceptance Criteria
- [ ] `ExamConfig.contentLevel` typed as enum, optional for backward compat
- [ ] `QuizSession.skillId` present
- [ ] No TypeScript errors
"@
  },
  @{
    title = "RC-4-B: Scope quiz session storage by skillId"
    labels = "P1-high,domain:platform"
    body = @"
## What
- Change `SESSIONS_KEY = 'cca_sessions'` → `'aarya_quiz_sessions'` in `src/lib/storage.ts`
- Add `skillId: examId` to `newSession` in `Quiz.tsx` when starting a quiz

## Why
`cca_sessions` is hardcoded to CCA. When ab100 or ghbp quizzes run, their sessions mix with ccaf sessions. `getScoreByDomain()` returns wrong totals.

## Acceptance Criteria
- [ ] Sessions key is `aarya_quiz_sessions`
- [ ] Each QuizSession stores which skill it belongs to
- [ ] No regression in Progress page
"@
  },
  @{
    title = "RC-4-C: Migrate content files to skillup/{cert}/ folder structure"
    labels = "P1-high,domain:content"
    body = @"
## What
Move content from flat dirs to per-skill folders:

```
public/content/skillup/
  ccaf/ notes/ questions/ scenarios/ index.json
  ghbp/ notes/ questions/ index.json
  ab100/ notes/ questions/ scenarios/ index.json
```

## Files moved
- `notes/d*.md` → `skillup/ccaf/notes/`
- `notes/ghbp-*.md` → `skillup/ghbp/notes/`
- `notes/ab100-*.md` → `skillup/ab100/notes/`
- `questions/domain*.json` → `skillup/ccaf/questions/`
- `questions/ghbp-*.json` → `skillup/ghbp/questions/`
- `questions/ab100-*.json` → `skillup/ab100/questions/`
- `scenarios/customer-*.json` etc → `skillup/ccaf/scenarios/`
- `scenarios/ab100-*.json` → `skillup/ab100/scenarios/`

## Acceptance Criteria
- [ ] All 3 skills have self-contained folders
- [ ] Per-skill `index.json` with `contentLevel` field
- [ ] Old flat dirs kept temporarily (not deleted this PR)
"@
  },
  @{
    title = "RC-4-D: Auto-discovery — sync-stats.py generates skillup/catalog.json"
    labels = "P1-high,domain:tooling"
    body = @"
## What
Update `scripts/sync-stats.py`:
- Add `generate_catalog()` that globs `public/content/skillup/*/index.json`, reads each, writes `public/content/skillup/catalog.json`
- Update `count_questions()`, `count_exams()`, `count_notes()`, `count_scenarios()` to read from `skillup/` paths
- `catalog.json` is committed by CI, never hand-edited

## Why
Contributors drop a folder in `skillup/` → CI auto-discovers it → catalog.json updates → platform shows new skill. No central file to edit, no merge conflicts.

## Acceptance Criteria
- [ ] `python3 scripts/sync-stats.py` writes `skillup/catalog.json`
- [ ] All 3 existing skills appear in catalog
- [ ] stats.json counts update correctly
"@
  },
  @{
    title = "RC-4-E: Update content-loader.ts to read skillup/catalog.json"
    labels = "P1-high,domain:platform"
    body = @"
## What
- `loadExamRegistry()` reads `content/skillup/catalog.json` instead of `content/exams/index.json`
- All path resolution in `loadQuestionsForExam`, `loadNoteForExam`, `loadScenariosForExam` stays the same (paths already in the per-skill index.json)

## Why
Single path change unlocks the new structure for the runtime app.

## Acceptance Criteria
- [ ] All 3 skills load correctly in dev
- [ ] Notes, quiz, scenarios all work
- [ ] No 404s in network tab
"@
  },
  @{
    title = "RC-4-F: Route /exams → /skillup + contentLevel badge on catalog"
    labels = "P1-high,domain:platform"
    body = @"
## What
- Add `/skillup` and `/skillup/:skillId` routes (and sub-routes) to `router.tsx`
- Redirect `/exams` → `/skillup` with `<Navigate replace>`
- Update nav link in `Layout.tsx` from `/exams` → `/skillup`
- Add `contentLevel` badge to `ExamCard` in `ExamCatalog.tsx`
- Update sidebar breadcrumb path matching for `/skillup`

## Why
URL says `/exams` but nav label says `Skill Up`. Fix the URL to match the brand.

## Acceptance Criteria
- [ ] `aaryaai.dev/skillup` works
- [ ] `aaryaai.dev/exams` redirects to `/skillup`
- [ ] Level badge (101/201/301/401) visible on each card
- [ ] Sidebar sub-nav works for skill detail pages
"@
  }
)

foreach ($issue in $issues) {
  $url = gh issue create --repo $repo `
           --title $issue.title `
           --milestone "RC-4: SkillUp Restructure" `
           --label $issue.labels `
           --body $issue.body 2>&1
  "$($issue.title): $url" | Add-Content $log
  Write-Host "Created: $url"
}

"=== Done $(Get-Date) ===" | Add-Content $log
Write-Host "RC-4 milestone + 6 issues created. See rc4-setup-result.txt"
