#!/usr/bin/env pwsh
# create-monitoring-issues.ps1
# Creates 1 epic + 14 individual issues for Platform Monitoring feature
# Run from repo root: pwsh ./create-monitoring-issues.ps1

$repo = "ajeetchouksey/ajch_platform"
$created = @()

Write-Host "`n=== Platform Monitoring — Creating GitHub Issues ===" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# EPIC
# ---------------------------------------------------------------------------
Write-Host "`n[EPIC] Creating tracking epic..." -ForegroundColor Yellow
$epicBody = @'
## Platform Monitoring — Epic

Private analytics dashboard for `@ajeetchouksey` only. Pulls data from Google Analytics 4 (real-time + historical).

### Sections
- [ ] Auth Gate (owner-only guard)
- [ ] Backend Proxy — Cloudflare Worker for GA4 API
- [ ] Real-Time Panel
- [ ] Traffic Overview (historical)
- [ ] Top Pages & Content
- [ ] Blog Post Performance
- [ ] Exam & Quiz Engagement
- [ ] Traffic Sources & Referrers
- [ ] Geographic Breakdown
- [ ] Device & Browser Breakdown
- [ ] New vs Returning Users
- [ ] Dashboard UX (tabs, date picker, skeletons)
- [ ] Event Instrumentation (quiz_complete, quiz_start, scroll_depth)

Route: `/monitoring`
Access: `user.login === 'ajeetchouksey'` only
Stack: React 19 + TypeScript + Vite + Cloudflare Worker proxy
'@

$epicUrl = gh issue create `
  --repo $repo `
  --title "feat: Platform Monitoring page — GA4 real-time + historical dashboard (owner-only)" `
  --body $epicBody `
  --label "enhancement,analytics"

$created += [PSCustomObject]@{ N = 0; Title = "EPIC"; URL = $epicUrl }
Write-Host "  Created: $epicUrl" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 1 — Auth Gate
# ---------------------------------------------------------------------------
Write-Host "`n[1/14] Auth gate..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): auth gate — owner-only guard for /monitoring route" `
  --body "Block render if ``user.login !== 'ajeetchouksey'``. Reuse ADMIN_USERS pattern from Analytics.tsx. Add ``/monitoring`` to sidebar with ``sidebarOnly: true``. Show lock icon + GitHub login prompt for unauthenticated users." `
  --label "enhancement,analytics,P0"

$created += [PSCustomObject]@{ N = 1; Title = "Auth gate"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 2 — Worker: GA4 Data API proxy
# ---------------------------------------------------------------------------
Write-Host "`n[2/14] Cloudflare Worker — GA4 Data API proxy..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): Cloudflare Worker proxy for GA4 Data API" `
  --body "Create ``/api/ga/report`` Worker that accepts ``{dateRange, dimensions, metrics}``, signs request with service-account JWT, proxies to ``POST /v1beta/properties/{ID}:runReport``. Store GA4 service account JSON and property ID as Worker secrets. Validate GitHub session token before calling GA4." `
  --label "enhancement,analytics,P0,backend"

$created += [PSCustomObject]@{ N = 2; Title = "Worker: GA4 Data API"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 3 — Worker: GA4 Realtime API proxy
# ---------------------------------------------------------------------------
Write-Host "`n[3/14] Cloudflare Worker — GA4 Realtime API proxy..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): Cloudflare Worker proxy for GA4 Realtime API" `
  --body "Create ``/api/ga/realtime`` Worker calling ``runRealtimeReport``. No date params. Same auth validation pattern as ``/api/ga/report``. Cache in Cloudflare KV for 30s." `
  --label "enhancement,analytics,P0,backend"

$created += [PSCustomObject]@{ N = 3; Title = "Worker: GA4 Realtime API"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 4 — Real-Time Panel
# ---------------------------------------------------------------------------
Write-Host "`n[4/14] Real-time panel..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): real-time panel — active users + live page breakdown" `
  --body "Active users KPI card (refreshes every 30s), top 5 active pages, auto-refresh toggle with last-refreshed timestamp. GA4 Realtime API via ``/api/ga/realtime`` Worker." `
  --label "enhancement,analytics,P0"

$created += [PSCustomObject]@{ N = 4; Title = "Real-time panel"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 5 — Traffic Overview
# ---------------------------------------------------------------------------
Write-Host "`n[5/14] Traffic overview..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): traffic overview — KPI row + sessions/pageviews chart" `
  --body "Global date range picker (7d/28d/90d/custom). KPI cards: Total Users, Sessions, Pageviews, Avg Session Duration. Daily sessions + pageviews line/bar chart. Period-over-period % delta vs previous equal period." `
  --label "enhancement,analytics,P0"

$created += [PSCustomObject]@{ N = 5; Title = "Traffic overview"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 6 — Top Pages
# ---------------------------------------------------------------------------
Write-Host "`n[6/14] Top pages table..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): top pages table with prefix filter" `
  --body "Ranked table of all pages by views, with avg time on page and bounce rate. Client-side prefix filter for ``/blog``, ``/skillup``, ``/tools``. Entry page analysis (landing pages). GA4 ``pagePath`` + ``pageTitle`` dimensions." `
  --label "enhancement,analytics,P0"

$created += [PSCustomObject]@{ N = 6; Title = "Top pages table"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 7 — Blog Post Performance
# ---------------------------------------------------------------------------
Write-Host "`n[7/14] Blog post performance..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): blog post performance table" `
  --body "All ``/blog/*`` paths ranked by views + avg read time. Resolve post titles from ``public/content/blog/index.json``. Top blog referrers per post. Client-side join between GA4 data and blog index." `
  --label "enhancement,analytics,P1"

$created += [PSCustomObject]@{ N = 7; Title = "Blog post performance"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 8 — Exam & Quiz Engagement
# ---------------------------------------------------------------------------
Write-Host "`n[8/14] Exam & quiz engagement..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): exam & quiz engagement metrics" `
  --body "Exam page views by exam (``/skillup/*``), quiz start rate, notes views by exam, tool usage per tool page. Depends on quiz_complete and quiz_start event instrumentation (separate issue)." `
  --label "enhancement,analytics,P1"

$created += [PSCustomObject]@{ N = 8; Title = "Exam & quiz engagement"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 9 — Traffic Sources
# ---------------------------------------------------------------------------
Write-Host "`n[9/14] Traffic sources..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): traffic sources — channel donut + referrers table" `
  --body "Channel breakdown donut (Organic/Direct/Referral/Social/Email). Top referrers table. Social referrers breakdown (LinkedIn, Twitter/X, GitHub, HN). GA4 ``sessionDefaultChannelGroup`` + ``sessionSource``." `
  --label "enhancement,analytics,P1"

$created += [PSCustomObject]@{ N = 9; Title = "Traffic sources"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 10 — Geographic Breakdown
# ---------------------------------------------------------------------------
Write-Host "`n[10/14] Geographic breakdown..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): geographic breakdown — country table + bar chart" `
  --body "Top 15 countries by users and sessions. Horizontal bar chart. Language preference distribution. GA4 ``country`` + ``language`` dimensions." `
  --label "enhancement,analytics,P1"

$created += [PSCustomObject]@{ N = 10; Title = "Geographic breakdown"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 11 — Device & Browser Breakdown
# ---------------------------------------------------------------------------
Write-Host "`n[11/14] Device & browser breakdown..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): device & browser breakdown" `
  --body "Device category donut (Desktop/Mobile/Tablet). Browser table (Chrome/Safari/Firefox/Edge). OS breakdown. GA4 ``deviceCategory``, ``browser``, ``operatingSystem`` dimensions." `
  --label "enhancement,analytics,P1"

$created += [PSCustomObject]@{ N = 11; Title = "Device & browser breakdown"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 12 — New vs Returning Users
# ---------------------------------------------------------------------------
Write-Host "`n[12/14] New vs returning users..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): new vs returning users panel" `
  --body "New/returning donut for selected date range. Week-over-week returning user trend (platform health signal). GA4 ``newVsReturning`` dimension." `
  --label "enhancement,analytics,P1"

$created += [PSCustomObject]@{ N = 12; Title = "New vs returning users"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 13 — Dashboard UX
# ---------------------------------------------------------------------------
Write-Host "`n[13/14] Dashboard UX..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): dashboard UX — tabs, skeletons, error states, responsive grid" `
  --body "Tab navigation (Overview · Content · Exams · Sources · Audience). Global date range selector as shared React context. Loading skeleton cards per widget. Per-widget error state with retry. Refresh button + data-as-of timestamp. Responsive grid: 1-col mobile → 2-col tablet → 3-col desktop." `
  --label "enhancement,analytics,P0"

$created += [PSCustomObject]@{ N = 13; Title = "Dashboard UX"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Issue 14 — Event Instrumentation
# ---------------------------------------------------------------------------
Write-Host "`n[14/14] Event instrumentation..." -ForegroundColor Yellow
$url = gh issue create `
  --repo $repo `
  --title "feat(monitoring): event instrumentation — quiz_complete, quiz_start, scroll_depth" `
  --body "Add ``trackEvent()`` calls: ``quiz_complete`` with ``{exam_id, score, total_q, pct}`` and ``quiz_start`` with ``{exam_id}`` in ``Quiz.tsx``. ``scroll_depth`` with ``{post_slug, pct: 25|50|75|90}`` in blog post renderer. Prerequisite for exam engagement metrics and blog scroll depth." `
  --label "enhancement,analytics,P1"

$created += [PSCustomObject]@{ N = 14; Title = "Event instrumentation"; URL = $url }
Write-Host "  Created: $url" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host "`n=== CREATED ISSUES SUMMARY ===" -ForegroundColor Cyan
Write-Host ("{0,-6} {1,-35} {2}" -f "Num", "Title", "URL") -ForegroundColor White
Write-Host ("-" * 100) -ForegroundColor DarkGray
foreach ($item in $created) {
  $label = if ($item.N -eq 0) { "EPIC" } else { $item.N }
  Write-Host ("{0,-6} {1,-35} {2}" -f $label, $item.Title, $item.URL)
}
Write-Host "`nTotal issues created: $($created.Count)" -ForegroundColor Green
