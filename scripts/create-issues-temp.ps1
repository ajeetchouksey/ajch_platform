$ErrorActionPreference = 'Stop'

$tokenLine = (Get-Content "$PSScriptRoot\..\gh_po_token.env") | Where-Object { $_ -match '^GH_PO_TOKEN=' }
$token     = $tokenLine -replace '^GH_PO_TOKEN=', ''

$headers = @{
    'Authorization'        = "Bearer $token"
    'Accept'               = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}
$issuesUrl = 'https://api.github.com/repos/ajeetchouksey/ajch_platform/issues'

# ── ISSUE 1 ──────────────────────────────────────────────────────────────────
$body1 = @'
### Summary
GitHub OAuth login infrastructure is already built (`auth.tsx`, `GithubLogin.tsx`, `gist-sync.ts`, `useProgressSync.ts`) but the sync hook is never called, the Gist description is misbranded, and `VITE_GH_CLIENT_ID` may be missing from the production build. This issue covers making login actually work end-to-end.

> **Constraint**: Site remains publicly accessible. Login is opt-in only.

---

### Phase 0 — Critical Fixes (already coded, just broken)
- [ ] **Wire `useProgressSync()`** in `src/features/profile/pages/Profile.tsx` — the hook exists but no component calls it. Gist sync never runs today even after login.
- [ ] **Fix Gist description branding** in `src/lib/gist-sync.ts` — change `'CCA-F Study App Progress'` → `'Aarya — AI Learning Hub Progress'`
- [ ] **Verify `VITE_GH_CLIENT_ID` in GitHub Pages build** — if missing, OAuth silently degrades to hostile PAT input.

### Phase 1 — User-Facing Features
- [ ] **Sync status indicator** on Profile page — "Last synced: 2 min ago" + spinner. Exposes `syncToGist()` already written in `useProgressSync`.
- [ ] **Post-quiz "Sign in to save" nudge** for anonymous users — inline prompt after Quiz results: *"Nice score! Sign in to save it across devices."*

### Acceptance Criteria
- [ ] User logs in via GitHub OAuth on the live site
- [ ] After login, quiz progress syncs to a private Gist named "Aarya — AI Learning Hub Progress"
- [ ] Logging in on a second device loads synced progress from Gist
- [ ] Profile page shows "Last synced" timestamp
- [ ] Anonymous user sees the save nudge after completing a quiz
- [ ] `VITE_GH_CLIENT_ID` confirmed present in GitHub Pages environment

### Files to Change
- `src/features/profile/pages/Profile.tsx` — wire `useProgressSync()`
- `src/lib/gist-sync.ts` — rebrand Gist description
- `src/features/exams/pages/Quiz.tsx` — add post-quiz anonymous nudge
- `.env.example` — document `VITE_GH_CLIENT_ID` requirement
'@

$payload1 = @{
    title  = 'feat: wire GitHub login + Gist progress sync (Phase 0 & Phase 1)'
    body   = $body1
    labels = @('enhancement')
} | ConvertTo-Json -Depth 5

$issue1 = Invoke-RestMethod -Uri $issuesUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $payload1
Write-Host "ISSUE1: #$($issue1.number) $($issue1.html_url)"

# ── ISSUE 2 ──────────────────────────────────────────────────────────────────
$body2 = @'
### Summary
Add Google Analytics 4 in **cookieless mode** to capture behavioral analytics — page views, quiz completions, login events — without a cookie consent banner. GoatCounter (already wired) is retained for privacy-first page counts. GA4 adds funnel analysis, event breakdown, and retention data.

> **No new infrastructure required.** GA4 collects client-side via `gtag.js`; data flows directly to Google servers. No cookies → no consent banner needed.

> **Depends on**: #feat-login (Issue 1) — `login` and `progress_synced` events require login to be wired first.

---

### One-time Manual Setup
- [ ] Create GA4 property at analytics.google.com → get `G-XXXXXXXXXX` measurement ID
- [ ] Add `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` to `.env` and GitHub Pages environment secrets

### Implementation Tasks
- [ ] **`index.html`** — add GA4 `gtag.js` script tag with env var substitution
- [ ] **`src/lib/analytics.ts`** — add `trackEvent(name, params)` and `trackPageView(path)` wrappers in cookieless mode:
  ```ts
  gtag('config', measurementId, { storage: 'none', anonymize_ip: true })
  ```
- [ ] **`src/app/router.tsx`** — wire `trackPageView` on every route change
- [ ] **`src/features/exams/pages/Quiz.tsx`** — fire `quiz_completed` event: `{ exam_id, domain, score, questions_total }`
- [ ] **`src/lib/auth.tsx`** — fire `login` event on OAuth success: `{ method: 'GitHub' }`
- [ ] **`src/lib/useProgressSync.ts`** — fire `progress_synced` event after Gist write: `{ direction: 'upload' }`
- [ ] **`src/features/exams/pages/Quiz.tsx`** — fire `save_nudge_shown` + `save_nudge_clicked` from anonymous nudge

### Event Schema
| Event | When | Key Params |
|---|---|---|
| `page_view` | Route change | `page_path`, `page_title` |
| `quiz_completed` | Quiz session ends | `exam_id`, `domain`, `score`, `questions_total` |
| `login` | GitHub OAuth success | `method: 'GitHub'` |
| `progress_synced` | Gist write succeeds | `direction: 'upload'` |
| `save_nudge_shown` | Nudge shown to anon user | `exam_id`, `score` |
| `save_nudge_clicked` | Anon user clicks CTA | — |

### Acceptance Criteria
- [ ] GA4 property exists; `VITE_GA_MEASUREMENT_ID` set in build env
- [ ] Page views appear in GA4 Realtime dashboard within 60s of navigation
- [ ] `quiz_completed` event visible in GA4 Events report
- [ ] `login` event fires on GitHub OAuth success
- [ ] No `_ga` cookie set (`document.cookie` clean after page load)
- [ ] No consent banner required
- [ ] GoatCounter continues working alongside GA4

### Files to Change
- `index.html`
- `src/lib/analytics.ts`
- `src/app/router.tsx`
- `src/features/exams/pages/Quiz.tsx`
- `src/lib/auth.tsx`
- `src/lib/useProgressSync.ts`
- `.env.example`
'@

$payload2 = @{
    title  = 'feat: add GA4 cookieless analytics with quiz + login events'
    body   = $body2
    labels = @('enhancement')
} | ConvertTo-Json -Depth 5

$issue2 = Invoke-RestMethod -Uri $issuesUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $payload2
Write-Host "ISSUE2: #$($issue2.number) $($issue2.html_url)"
