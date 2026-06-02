$ErrorActionPreference = 'Stop'

$tokenLine = (Get-Content "$PSScriptRoot\..\gh_po_token.env") | Where-Object { $_ -match '^GH_PO_TOKEN=' }
$token     = $tokenLine -replace '^GH_PO_TOKEN=', ''

$headers = @{
    'Authorization'        = "Bearer $token"
    'Accept'               = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}
$labelsUrl = 'https://api.github.com/repos/ajeetchouksey/ajch_platform/labels'
$issuesUrl = 'https://api.github.com/repos/ajeetchouksey/ajch_platform/issues'

# ── Ensure sprint-2 label exists ──────────────────────────────────────────────
try {
    $sprintLabel = @{
        name        = 'sprint-2'
        color       = '0075ca'
        description = 'Sprint 2 scope'
    } | ConvertTo-Json
    Invoke-RestMethod -Uri $labelsUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $sprintLabel | Out-Null
    Write-Host "Label 'sprint-2' created."
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 422) {
        Write-Host "Label 'sprint-2' already exists — skipping."
    } else {
        throw
    }
}

# ── ISSUE 1 — GAP-2: Extended Progress Schema ─────────────────────────────────
$body1 = @'
## User Story

As a platform user, I want my quiz progress to be stored with full session history, streaks, bookmarks, and per-question timestamps so that the dashboard, scheduler, and bookmark features can surface meaningful learning insights.

## Context

The current Gist-stored schema is minimal: `{ answered: number[], correct: number[] }`. Three upcoming features (GAP-3 Dashboard, GAP-4 Scheduler, GAP-7 Bookmarks) all depend on a richer schema to function. This is the critical-path foundation story for Sprint 2.

**Owner**: Platform Dev Expert MODULE-2
**File**: `src/lib/progress-schema.ts` (new file)

## Schema — v2 Target Shape

```ts
interface Session {
  id: string;            // UUID
  examId: string;
  domainId: number;
  startedAt: ISO8601;
  finishedAt: ISO8601;
  score: number;
  total: number;
  answers: { questionId: string; correct: boolean; timeTakenMs: number }[];
}

interface StreakRecord {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: ISO8601;
}

interface ProgressDataV2 {
  schemaVersion: 2;
  sessions: Session[];
  streaks: StreakRecord;
  bookmarks: string[];                        // question IDs
  lastSeen: Record<string, ISO8601>;          // questionId → ISO timestamp
}
```

## Acceptance Criteria

- [ ] `src/lib/progress-schema.ts` exports `ProgressDataV2`, `Session`, `StreakRecord` types
- [ ] `migrateProgressData(raw: unknown): ProgressDataV2` migrates v1 (`{ answered, correct }`) and empty/null data to v2 shape without data loss
- [ ] `createEmptyProgress(): ProgressDataV2` returns a valid v2 skeleton with `schemaVersion: 2`
- [ ] Migration is idempotent — calling it twice on a v2 object returns the same object
- [ ] All types exported from the single file; no runtime dependencies on React or DOM
- [ ] TypeScript compiles cleanly with `noImplicitAny` and `strict: true`

## Out of Scope

- Updating `gist-sync.ts` to use the new schema (that is GAP-5 Sync Upgrade)
- UI components or hooks

## RICE Score

Reach: 8 | Impact: 3 | Confidence: 90% | Effort: S(0.3) | **RICE: 72**

## Technical Notes

- Migration function must handle: `null`, `undefined`, plain `{}`, v1 shape, and v2 shape
- `answered`/`correct` arrays from v1 cannot be mapped to full `Session[]` (no timestamps); create one synthetic session for the historical totals

## Dependencies

- **Blocks**: GAP-3 (Dashboard), GAP-4 (Scheduler), GAP-7 (Bookmarks) — do not start those until this is merged
'@

$payload1 = @{
    title     = '[S] feat(platform): GAP-2 — Extended Progress Schema v2 with migration function'
    body      = $body1
    labels    = @('type:feat', 'P1-high', 'domain:platform', 'enhancement', 'sprint-2')
    milestone = 2
} | ConvertTo-Json -Depth 5

$issue1 = Invoke-RestMethod -Uri $issuesUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $payload1
Write-Host "ISSUE1 (GAP-2): #$($issue1.number) $($issue1.html_url)"

# ── ISSUE 2 — GAP-7: Bookmark Layer ──────────────────────────────────────────
$gap2Number = $issue1.number
$body2 = @"
## User Story

As a learner, I want to bookmark individual questions during a quiz session so that I can review flagged questions later and build a personal revision list.

## Context

Bookmarks are stored as an array of question IDs inside ``ProgressDataV2.bookmarks`` (GAP-2). This module provides pure, side-effect-free functions for reading and writing that array — no UI, no hooks, just the data layer. The Quiz and Review pages will call these functions directly.

**Owner**: Platform Dev Expert MODULE-3
**File**: ``src/lib/bookmarks.ts`` (new file)
**Depends on**: #${gap2Number} GAP-2 (must be merged first)

## API Surface

```ts
// All functions operate against ProgressDataV2 passed by reference (no Gist I/O here)
function addBookmark(progress: ProgressDataV2, questionId: string): ProgressDataV2
function removeBookmark(progress: ProgressDataV2, questionId: string): ProgressDataV2
function getBookmarks(progress: ProgressDataV2): string[]
function isBookmarked(progress: ProgressDataV2, questionId: string): boolean
```

## Acceptance Criteria

- [ ] ``src/lib/bookmarks.ts`` exports the four functions above
- [ ] ``addBookmark`` is idempotent — adding a duplicate ID does not produce duplicates
- [ ] ``removeBookmark`` is safe — calling it with a non-existent ID does not throw
- [ ] All functions return new objects (immutable — no mutation of the input)
- [ ] ``getBookmarks`` returns a stable sorted array (alphabetical by questionId) for predictable diffing
- [ ] TypeScript compiles cleanly with ``strict: true``; no ``any`` types
- [ ] Unit-testable with zero DOM/React dependencies

## Out of Scope

- Persisting bookmarks to Gist (handled by GAP-5 Sync Upgrade)
- Bookmark UI (Quiz flag button, Bookmarks review page — separate stories)

## RICE Score

Reach: 7 | Impact: 2 | Confidence: 80% | Effort: XS(0.1) | **RICE: 112**

## Technical Notes

- Pure functions only — no ``useState``, no ``useEffect``, no ``localStorage`` calls in this file
- Consumers load/save ``ProgressDataV2`` via ``gist-sync.ts`` or ``localStorage``; bookmarks.ts only transforms it

## Dependencies

- **Blocked by**: #${gap2Number} GAP-2 (Extended Progress Schema) — import ``ProgressDataV2`` from progress-schema.ts
- **Blocks**: GAP-8 (Bookmarks review page UI)
"@

$payload2 = @{
    title     = '[XS] feat(platform): GAP-7 — Bookmark Layer (addBookmark / removeBookmark / getBookmarks)'
    body      = $body2
    labels    = @('type:feat', 'P1-high', 'domain:platform', 'enhancement', 'sprint-2')
    milestone = 2
} | ConvertTo-Json -Depth 5

$issue2 = Invoke-RestMethod -Uri $issuesUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $payload2
Write-Host "ISSUE2 (GAP-7): #$($issue2.number) $($issue2.html_url)"

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================"
Write-Host "ISSUE GATE RESULT"
Write-Host "============================================"
Write-Host "GAP-2 => Issue #$($issue1.number): $($issue1.title)"
Write-Host "  URL: $($issue1.html_url)"
Write-Host ""
Write-Host "GAP-7 => Issue #$($issue2.number): $($issue2.title)"
Write-Host "  URL: $($issue2.html_url)"
Write-Host "============================================"
