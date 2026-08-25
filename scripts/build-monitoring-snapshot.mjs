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
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

async function main() {
  const today = new Date();
  const until = new Date(today.getTime() - 24 * 60 * 60 * 1000); // yesterday — today's GA4 row is always partial
  const since28 = new Date(until.getTime() - 27 * 24 * 60 * 60 * 1000);
  const since7 = new Date(until.getTime() - 6 * 24 * 60 * 60 * 1000);

  const untilStr = toDateStr(until);
  const since28Str = toDateStr(since28);
  const since7Str = toDateStr(since7);

  const [history, cfOverview28d, cfOverview7d] = await Promise.all([
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
    schema: '1.0',
    generatedAt: new Date().toISOString(),
    since: since28Str,
    until: untilStr,
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
  console.log(`Wrote ${SNAPSHOT_PATH} — ${alerts.length} alert(s), ${cloudflareWorkers.length} worker(s), ${d1Usage.length} D1 database(s).`);
}

main().catch(err => {
  console.error('[build-monitoring-snapshot]', err.message);
  process.exit(1);
});
