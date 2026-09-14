#!/usr/bin/env node
/**
 * build-monitoring-snapshot.mjs
 * Pulls a rollup of GA4 traffic + Cloudflare Worker/D1 health from the
 * already-deployed aarya-ga4-proxy / aarya-cf-monitor Workers, compares
 * traffic against the active quarter's targets in mvp-progress.json, and
 * writes public/content/monitoring-snapshot.json.
 *
 * This is the only place an agent (mvp-strategist) needs to look to get
 * monitoring data — agents can't hold the dashboard's GitHub-OAuth owner
 * auth, so this script authenticates instead with X-Sync-Key, a shared
 * secret the two Workers also accept (see workers/ga4-proxy.ts,
 * workers/cloudflare-proxy.ts).
 *
 * Run by .github/workflows/monitoring-snapshot-sync.yml (weekly), or
 * manually: GA4_PROXY_URL=... CF_MONITOR_URL=... MONITORING_SYNC_KEY=...
 * node scripts/build-monitoring-snapshot.mjs
 *
 * Alert thresholds intentionally mirror values already live in the
 * dashboard UI rather than inventing new ones — see Monitoring.tsx's
 * `errorRate > 0.01` red-row cutoff. D1 usage is reported with no
 * threshold: no verified real quota number exists for this account yet.
 *
 * Worker error-rate alerting uses a 7-day window, not 28d, deliberately —
 * a 28d trailing average keeps a resolved incident tripping "critical" for
 * weeks after it's actually fixed (found by running this against real data:
 * the aarya-ga4-proxy scriptThrewException spike fixed in PR #450 alone
 * would have kept alerting into late September on a 28d window). Both
 * windows are still reported in the snapshot for context.
 *
 * GA4 credential health check (added after a real incident): /api/ga/history
 * reads from D1, not a live GA4 call — it's populated by a daily Cron Trigger
 * inside the Worker itself, which fails silently (console.error only, no
 * alerting) if the GA4 credential breaks. That means this script can run
 * successfully every week, "sync" fresh-looking data, and still just be
 * re-committing the same stale D1 rows from before the credential broke,
 * indistinguishable from genuinely flat traffic — exactly what happened for
 * roughly three weeks before a human noticed stale numbers on the homepage.
 * Calling /api/ga/health first (a real, uncached credential check — see
 * workers/ga4-proxy.ts) turns that into an explicit, visible alert instead.
 *
 * Pipeline-health alerting (added after the same incident): a broken
 * credential-rotation workflow (sync-ga4-proxy-secrets.yml) sat failing for
 * three weeks with nothing surfacing it. Checking recent runs of the
 * critical scheduled workflows via `gh run list` and alerting on repeated
 * failures or a stuck promotion PR closes that same "nobody was watching"
 * gap for CI, not just for GA4 itself.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MVP_PROGRESS_PATH = join(ROOT, 'public', 'content', 'mvp-progress.json');
const SNAPSHOT_PATH = join(ROOT, 'public', 'content', 'monitoring-snapshot.json');

const GA4_PROXY_URL = process.env.GA4_PROXY_URL;
const CF_MONITOR_URL = process.env.CF_MONITOR_URL;
const SYNC_KEY = process.env.MONITORING_SYNC_KEY;

if (!GA4_PROXY_URL || !CF_MONITOR_URL || !SYNC_KEY) {
  console.error('Missing required env: GA4_PROXY_URL, CF_MONITOR_URL, MONITORING_SYNC_KEY');
  process.exit(1);
}

const WORKER_ERROR_RATE_WARNING = 0.01; // same cutoff Monitoring.tsx uses to turn a worker row red
const WORKER_ERROR_RATE_CRITICAL = 0.05;
const TRAFFIC_PACE_WARNING = 0.9; // actual daily avg / baseline daily avg
const TRAFFIC_PACE_CRITICAL = 0.7;

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchJson(url, label) {
  const res = await fetch(url, { headers: { 'X-Sync-Key': SYNC_KEY } });
  if (!res.ok) {
    throw new Error(`${label} request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function sum(rows, key) {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function findActiveQuarter(mvpProgress) {
  return (mvpProgress.quarters ?? []).find(q => q.status === 'active') ?? null;
}

// ── GA4 credential health ────────────────────────────────────────────────────

async function fetchGa4Health(proxyUrl) {
  try {
    const res = await fetch(`${proxyUrl}/api/ga/health`, { headers: { 'X-Sync-Key': SYNC_KEY } });
    if (!res.ok) return { ok: false, reason: `health endpoint returned HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// ── Pipeline (CI) health — closes the "nobody was watching" gap ─────────────
// Scheduled workflows that fail silently (no PR, no push, nothing user-facing
// to notice) can go unnoticed for weeks — sync-ga4-proxy-secrets.yml did,
// for three. Checking recent run history surfaces that the same way traffic
// pacing already surfaces a slow quarter.

const CRITICAL_WORKFLOWS = [
  'analytics-sync.yml',
  'monitoring-snapshot-sync.yml',
  'promote-content.yml',
  'content-intelligence-sync.yml',
  'sync-ga4-proxy-secrets.yml',
];

// sync-ga4-proxy-secrets.yml is workflow_dispatch-only (manual, on-demand) —
// a lack of recent runs there is normal, not a failure signal. The rest are
// schedule-driven, so silence would itself be suspicious, but this check
// only looks at runs that did happen; a truly hung scheduler is a GitHub
// platform issue outside this script's reach.
const MANUAL_ONLY_WORKFLOWS = new Set(['sync-ga4-proxy-secrets.yml']);

function checkWorkflowHealth(repoSlug) {
  const alerts = [];
  for (const wf of CRITICAL_WORKFLOWS) {
    try {
      const raw = execFileSync('gh', [
        'run', 'list',
        '--repo', repoSlug,
        '--workflow', wf,
        '--limit', '2',
        '--json', 'conclusion,createdAt,url',
      ], { encoding: 'utf8' });
      const runs = JSON.parse(raw);
      if (runs.length === 0) {
        if (!MANUAL_ONLY_WORKFLOWS.has(wf)) {
          alerts.push({ severity: 'warning', area: 'ci', message: `${wf} has no recorded runs at all — confirm it's actually scheduled/enabled.` });
        }
        continue;
      }
      const allFailed = runs.every(r => r.conclusion === 'failure');
      if (allFailed) {
        alerts.push({
          severity: MANUAL_ONLY_WORKFLOWS.has(wf) ? 'warning' : 'critical',
          area: 'ci',
          message: `${wf} has failed its last ${runs.length} run(s) — ${runs[0].url}`,
        });
      }
    } catch (err) {
      alerts.push({ severity: 'warning', area: 'ci', message: `Could not check ${wf}'s run health: ${err.message}` });
    }
  }
  return alerts;
}

// A PR opened by one of these automated jobs that's been sitting BLOCKED for
// hours means the "open PR, poll checks, admin-merge" pattern hit something
// it doesn't handle (e.g. the code-owner-review requirement discovered on
// #622) — the job itself may report "success" up to the point it gives up,
// so this catches the PR getting stranded even when the workflow run isn't
// technically a failure.
const AUTOMATED_PR_BRANCH_PREFIXES = ['chore/promote-', 'chore/monitoring-snapshot-', 'chore/content-intelligence-sync-'];
const STUCK_PR_THRESHOLD_HOURS = 3;

function checkStuckAutomatedPRs(repoSlug) {
  const alerts = [];
  try {
    const raw = execFileSync('gh', [
      'pr', 'list',
      '--repo', repoSlug,
      '--state', 'open',
      '--json', 'title,url,createdAt,mergeStateStatus,headRefName',
    ], { encoding: 'utf8' });
    const prs = JSON.parse(raw);
    const now = Date.now();
    for (const pr of prs) {
      if (!AUTOMATED_PR_BRANCH_PREFIXES.some(p => pr.headRefName.startsWith(p))) continue;
      const ageHours = (now - new Date(pr.createdAt).getTime()) / 3_600_000;
      if (pr.mergeStateStatus === 'BLOCKED' && ageHours > STUCK_PR_THRESHOLD_HOURS) {
        alerts.push({
          severity: 'critical',
          area: 'ci',
          message: `Automated PR "${pr.title}" has been stuck BLOCKED for ${Math.round(ageHours)}h — ${pr.url}`,
        });
      }
    }
  } catch (err) {
    alerts.push({ severity: 'warning', area: 'ci', message: `Could not check for stuck automated PRs: ${err.message}` });
  }
  return alerts;
}

async function main() {
  const today = new Date();
  const until = new Date(today.getTime() - 24 * 60 * 60 * 1000); // yesterday — today's GA4 row is always partial
  const since28 = new Date(until.getTime() - 27 * 24 * 60 * 60 * 1000);
  const since7 = new Date(until.getTime() - 6 * 24 * 60 * 60 * 1000);

  const untilStr = toDateStr(until);
  const since28Str = toDateStr(since28);
  const since7Str = toDateStr(since7);

  const [ga4Health, history, cfOverview28d, cfOverview7d] = await Promise.all([
    fetchGa4Health(GA4_PROXY_URL),
    fetchJson(`${GA4_PROXY_URL}/api/ga/history?start=${since28Str}&end=${untilStr}`, 'GA4 history'),
    fetchJson(`${CF_MONITOR_URL}/api/cf/overview?range=28d`, 'Cloudflare overview (28d)'),
    fetchJson(`${CF_MONITOR_URL}/api/cf/overview?range=7d`, 'Cloudflare overview (7d)'),
  ]);

  const rows = history.rows ?? [];
  const rows7d = rows.filter(r => r.date >= since7Str);
  const daysIn28 = rows.length || 1;
  const daysIn7 = rows7d.length || 1;

  const last7d = {
    sessions: sum(rows7d, 'sessions'),
    pageviews: sum(rows7d, 'pageviews'),
    users: sum(rows7d, 'users'),
  };
  const dailyAvg28d = {
    sessions: round1(sum(rows, 'sessions') / daysIn28),
    pageviews: round1(sum(rows, 'pageviews') / daysIn28),
    users: round1(sum(rows, 'users') / daysIn28),
  };

  const mvpProgress = JSON.parse(readFileSync(MVP_PROGRESS_PATH, 'utf8'));
  const activeQuarter = findActiveQuarter(mvpProgress);
  const baseline = activeQuarter?.trafficBaseline?.baselineDailyAvg ?? null;

  const alerts = [];

  if (!ga4Health.ok) {
    alerts.push({
      severity: 'critical',
      area: 'ga4',
      message: `GA4 credential check failed: ${ga4Health.reason ?? 'unknown reason'} — the traffic figures below may be stale (the Worker's daily D1 snapshot cron likely stopped updating silently rather than the report genuinely being empty).`,
    });
  }

  const repoSlug = process.env.GITHUB_REPOSITORY ?? 'ajeetchouksey/ajch_platform';
  alerts.push(...checkWorkflowHealth(repoSlug));
  alerts.push(...checkStuckAutomatedPRs(repoSlug));

  let vsQuarterTarget = null;
  if (baseline) {
    const paceRatio = {
      sessions: baseline.sessions > 0 ? round1(dailyAvg28d.sessions / baseline.sessions * 100) / 100 : null,
      pageviews: baseline.pageviews > 0 ? round1(dailyAvg28d.pageviews / baseline.pageviews * 100) / 100 : null,
      users: baseline.users > 0 ? round1(dailyAvg28d.users / baseline.users * 100) / 100 : null,
    };
    vsQuarterTarget = { quarterId: activeQuarter.id, paceRatio };

    for (const [metric, ratio] of Object.entries(paceRatio)) {
      if (ratio === null) continue;
      if (ratio < TRAFFIC_PACE_CRITICAL) {
        alerts.push({
          severity: 'critical',
          area: 'traffic',
          message: `${metric} pacing at ${Math.round(ratio * 100)}% of ${activeQuarter.id} baseline daily average — well off the pace needed to hit the quarter's traffic target.`,
        });
      } else if (ratio < TRAFFIC_PACE_WARNING) {
        alerts.push({
          severity: 'warning',
          area: 'traffic',
          message: `${metric} pacing at ${Math.round(ratio * 100)}% of ${activeQuarter.id} baseline daily average — behind pace for the quarter's traffic target.`,
        });
      }
    }
  }

  // Error-rate alerting uses the 7-day window, not 28d: a 28d average keeps a
  // resolved incident (e.g. the scriptThrewException spike fixed in PR #450)
  // tripping "critical" for weeks after it's actually fixed, since one or two
  // bad days dominate a trailing month-long average long after the fact.
  // Both windows are still reported for context.
  const errorRate7dByScript = new Map((cfOverview7d.workers ?? []).map(w => [w.scriptName, w.errorRate]));

  const cloudflareWorkers = (cfOverview28d.workers ?? []).map(w => ({
    scriptName: w.scriptName,
    requests: w.requests,
    errorRate28d: w.errorRate,
    errorRate7d: errorRate7dByScript.get(w.scriptName) ?? null,
    cpuTimeP99Ms: w.cpuTimeP99Ms,
  }));

  for (const w of cloudflareWorkers) {
    const alertRate = w.errorRate7d;
    if (alertRate === null) continue; // no 7d data — don't alert on an unknown rate
    if (alertRate > WORKER_ERROR_RATE_CRITICAL) {
      alerts.push({
        severity: 'critical',
        area: 'infra',
        message: `${w.scriptName} error rate is ${(alertRate * 100).toFixed(1)}% over the last 7 days — investigate before it affects the dashboard or subscribe flow.`,
      });
    } else if (alertRate > WORKER_ERROR_RATE_WARNING) {
      alerts.push({
        severity: 'warning',
        area: 'infra',
        message: `${w.scriptName} error rate is ${(alertRate * 100).toFixed(1)}% over the last 7 days — above the normal baseline.`,
      });
    }
  }

  const d1Usage = (cfOverview28d.d1Usage ?? []).map(d => ({
    database: d.name,
    rowsRead: d.rowsRead,
    rowsWritten: d.rowsWritten,
  }));

  const snapshot = {
    schema: '1.1',
    generatedAt: new Date().toISOString(),
    since: since28Str,
    until: untilStr,
    ga4Health,
    traffic: {
      last7d,
      dailyAvg28d,
      vsQuarterTarget,
    },
    cloudflareWorkers,
    d1Usage,
    alerts,
  };

  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Wrote ${SNAPSHOT_PATH} — ${alerts.length} alert(s), ${cloudflareWorkers.length} worker(s), ${d1Usage.length} D1 database(s), GA4 health: ${ga4Health.ok ? 'ok' : `BROKEN (${ga4Health.reason})`}.`);
}

main().catch(err => {
  console.error('[build-monitoring-snapshot]', err.message);
  process.exit(1);
});
