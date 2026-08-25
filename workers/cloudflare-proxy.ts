/**
 * aarya-cf-monitor — Cloudflare Worker
 * GET /api/cf/status    — whether CF_API_TOKEN/CF_ACCOUNT_ID/CF_ZONE_ID are configured
 * GET /api/cf/overview  — zone traffic (requests, bandwidth, cache hit ratio, threats)
 *                         + per-Worker invocations/errors/CPU time, via Cloudflare's
 *                         GraphQL Analytics API (5-min KV cache)
 *
 * Auth: every request must carry Authorization: Bearer <github_token> — same
 * hash-and-verify-owner pattern as workers/ga4-proxy.ts (kept independent rather
 * than shared, since these are separately deployed Workers with separate KV).
 *
 * Secrets (set via `wrangler secret put <NAME> --config wrangler.cf-monitor.toml`):
 *   CF_API_TOKEN   Cloudflare API token, Account Analytics:Read + Zone Analytics:Read scopes
 *   CF_ACCOUNT_ID  Cloudflare account ID (not secret, but kept here for one-config-does-it-all)
 *   CF_ZONE_ID     Zone ID for aaryaai.dev (needed for zone-level HTTP analytics)
 *
 * KV binding:
 *   CF_MONITOR_CACHE   namespace for auth + response caching
 */

const ALLOWED_ORIGINS = new Set([
  'https://aaryaai.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
]);
const OWNER_LOGIN = 'ajeetchouksey';
const GH_API = 'https://api.github.com';
const CF_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';

// Worker scripts to report on — override via CF_WORKER_SCRIPT_NAMES (comma-separated)
// if more Workers are deployed later. Includes aarya-cf-monitor itself --
// the monitor didn't monitor itself before, and the exception-hardening
// investigation on aarya-ga4-proxy found a real worker throwing at
// production volume, so self-monitoring coverage matters here.
const DEFAULT_WORKER_SCRIPTS = ['aarya-subscribe', 'aarya-ga4-proxy', 'aarya-og', 'aarya-cf-monitor'];

export interface Env {
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  CF_ZONE_ID?: string;
  CF_WORKER_SCRIPT_NAMES?: string;
  CF_MONITOR_CACHE: KVNamespace;
}

// ── CORS helpers ──────────────────────────────────────────────────────────────

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://aaryaai.dev';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── Token hash helper (OWASP A02 — no raw token in KV keys) ──────────────────

async function tokenHash(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// ── GitHub auth check ─────────────────────────────────────────────────────────

async function verifyOwner(token: string, kv: KVNamespace): Promise<boolean> {
  const hash = await tokenHash(token);
  const cacheKey = `auth:${hash}`;

  const cached = await kv.get(cacheKey);
  if (cached === OWNER_LOGIN) return true;
  if (cached !== null) return false; // cached non-owner

  const res = await fetch(`${GH_API}/user`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'aarya-cf-monitor/1.0' },
  });
  if (!res.ok) return false;

  const { login } = await res.json<{ login: string }>();
  await kv.put(cacheKey, login === OWNER_LOGIN ? OWNER_LOGIN : '', { expirationTtl: 600 });
  return login === OWNER_LOGIN;
}

// ── Date-range helper ─────────────────────────────────────────────────────────

function rangeToDates(range: string): { since: string; until: string } {
  const days = range === '90d' ? 90 : range === '7d' ? 7 : 28;
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return { since: since.toISOString().slice(0, 10), until: until.toISOString().slice(0, 10) };
}

// ── Cloudflare GraphQL Analytics API ──────────────────────────────────────────

interface ZoneRequestsGroup {
  sum: { requests: number; bytes: number; cachedRequests: number; cachedBytes: number; threats: number };
}

interface WorkerInvocationsGroup {
  dimensions: { scriptName: string };
  sum: { requests: number; errors: number; subrequests: number };
  quantiles: { cpuTimeP50: number; cpuTimeP99: number };
}

async function runGraphQL<T>(env: Env, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(CF_GRAPHQL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Cloudflare GraphQL error ${res.status}: ${await res.text()}`);
  const body = await res.json<{ data?: T; errors?: { message: string }[] }>();
  if (body.errors?.length) throw new Error(`Cloudflare GraphQL error: ${body.errors.map(e => e.message).join('; ')}`);
  return body.data as T;
}

async function fetchZoneTraffic(env: Env, since: string, until: string) {
  const query = `
    query ZoneTraffic($zoneTag: string!, $since: Date!, $until: Date!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(limit: 90, filter: { date_geq: $since, date_leq: $until }) {
            sum { requests bytes cachedRequests cachedBytes threats }
          }
        }
      }
    }`;
  type Result = { viewer: { zones: { httpRequests1dGroups: ZoneRequestsGroup[] }[] } };
  const data = await runGraphQL<Result>(env, query, { zoneTag: env.CF_ZONE_ID, since, until });
  const groups = data.viewer.zones[0]?.httpRequests1dGroups ?? [];
  const totals = groups.reduce((acc, g) => ({
    requests: acc.requests + g.sum.requests,
    bytes: acc.bytes + g.sum.bytes,
    cachedRequests: acc.cachedRequests + g.sum.cachedRequests,
    cachedBytes: acc.cachedBytes + g.sum.cachedBytes,
    threats: acc.threats + g.sum.threats,
  }), { requests: 0, bytes: 0, cachedRequests: 0, cachedBytes: 0, threats: 0 });
  return {
    ...totals,
    cacheHitRatio: totals.requests ? totals.cachedRequests / totals.requests : 0,
  };
}

async function fetchWorkerStats(env: Env, since: string, until: string) {
  const query = `
    query WorkerStats($accountTag: string!, $since: Time!, $until: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(
            limit: 100
            filter: { datetime_geq: $since, datetime_leq: $until }
          ) {
            dimensions { scriptName }
            sum { requests errors subrequests }
            quantiles { cpuTimeP50 cpuTimeP99 }
          }
        }
      }
    }`;
  type Result = { viewer: { accounts: { workersInvocationsAdaptive: WorkerInvocationsGroup[] }[] } };
  const data = await runGraphQL<Result>(env, query, {
    accountTag: env.CF_ACCOUNT_ID,
    since: `${since}T00:00:00Z`,
    until: `${until}T23:59:59Z`,
  });
  const groups = data.viewer.accounts[0]?.workersInvocationsAdaptive ?? [];
  const wanted = new Set((env.CF_WORKER_SCRIPT_NAMES?.split(',').map(s => s.trim()) ?? DEFAULT_WORKER_SCRIPTS));
  return groups
    .filter(g => wanted.has(g.dimensions.scriptName))
    .map(g => ({
      scriptName: g.dimensions.scriptName,
      requests: g.sum.requests,
      errors: g.sum.errors,
      errorRate: g.sum.requests ? g.sum.errors / g.sum.requests : 0,
      cpuTimeP50Ms: g.quantiles.cpuTimeP50,
      cpuTimeP99Ms: g.quantiles.cpuTimeP99,
    }));
}

interface WorkerDailyGroup {
  dimensions: { scriptName: string; date: string };
  sum: { requests: number; errors: number };
}

// Per-day requests/errors per worker — same dataset as fetchWorkerStats, just
// grouped by date too (verified live: workersInvocationsAdaptive accepts
// `date` alongside `scriptName` in dimensions). Powers the trend chart; the
// aggregate totals in fetchWorkerStats stay a separate simpler query since
// most callers only need the current-window summary.
async function fetchWorkerDailyTrend(env: Env, since: string, until: string) {
  const query = `
    query WorkerDaily($accountTag: string!, $since: Time!, $until: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(
            limit: 1000
            filter: { datetime_geq: $since, datetime_leq: $until }
          ) {
            dimensions { scriptName date }
            sum { requests errors }
          }
        }
      }
    }`;
  type Result = { viewer: { accounts: { workersInvocationsAdaptive: WorkerDailyGroup[] }[] } };
  const data = await runGraphQL<Result>(env, query, {
    accountTag: env.CF_ACCOUNT_ID,
    since: `${since}T00:00:00Z`,
    until: `${until}T23:59:59Z`,
  });
  const groups = data.viewer.accounts[0]?.workersInvocationsAdaptive ?? [];
  const wanted = new Set((env.CF_WORKER_SCRIPT_NAMES?.split(',').map(s => s.trim()) ?? DEFAULT_WORKER_SCRIPTS));

  const byScript = new Map<string, { date: string; requests: number; errors: number }[]>();
  for (const g of groups) {
    if (!wanted.has(g.dimensions.scriptName)) continue;
    const series = byScript.get(g.dimensions.scriptName) ?? [];
    series.push({ date: g.dimensions.date, requests: g.sum.requests, errors: g.sum.errors });
    byScript.set(g.dimensions.scriptName, series);
  }
  return [...byScript.entries()].map(([scriptName, series]) => ({
    scriptName,
    series: series.sort((a, b) => a.date.localeCompare(b.date)),
  }));
}

interface D1UsageGroup {
  dimensions: { databaseId: string };
  sum: { readQueries: number; writeQueries: number; rowsRead: number; rowsWritten: number };
}

// One row per D1 database (rowsRead/rowsWritten/readQueries/writeQueries) --
// answers "are we anywhere near a quota" for the two databases this platform
// depends on (aarya-subscribers, aarya-analytics). databaseId is a raw UUID
// on the wire; DATABASE_NAMES below maps the ones we know about to a label.
const DATABASE_NAMES: Record<string, string> = {
  'd34f9b7a-374f-4e0c-89e7-a202b4966286': 'aarya-analytics',
  '2f397d9b-4d45-4c1d-aa1e-3c474f58dd32': 'aarya-subscribers',
};

async function fetchD1Usage(env: Env, since: string, until: string) {
  const query = `
    query D1Usage($accountTag: string!, $since: Time!, $until: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          d1AnalyticsAdaptiveGroups(
            limit: 20
            filter: { datetime_geq: $since, datetime_leq: $until }
          ) {
            dimensions { databaseId }
            sum { readQueries writeQueries rowsRead rowsWritten }
          }
        }
      }
    }`;
  type Result = { viewer: { accounts: { d1AnalyticsAdaptiveGroups: D1UsageGroup[] }[] } };
  const data = await runGraphQL<Result>(env, query, {
    accountTag: env.CF_ACCOUNT_ID,
    since: `${since}T00:00:00Z`,
    until: `${until}T23:59:59Z`,
  });
  const groups = data.viewer.accounts[0]?.d1AnalyticsAdaptiveGroups ?? [];
  return groups.map(g => ({
    databaseId: g.dimensions.databaseId,
    name: DATABASE_NAMES[g.dimensions.databaseId] ?? g.dimensions.databaseId,
    readQueries: g.sum.readQueries,
    writeQueries: g.sum.writeQueries,
    rowsRead: g.sum.rowsRead,
    rowsWritten: g.sum.rowsWritten,
  }));
}

async function fetchOverview(env: Env, range: string) {
  const cacheKey = `cf:overview:${range}`;
  const cached = await env.CF_MONITOR_CACHE.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { since, until } = rangeToDates(range);
  const [zone, workers, workerTrend, d1Usage] = await Promise.all([
    env.CF_ZONE_ID ? fetchZoneTraffic(env, since, until) : Promise.resolve(null),
    fetchWorkerStats(env, since, until),
    fetchWorkerDailyTrend(env, since, until).catch(() => []),
    fetchD1Usage(env, since, until).catch(() => []),
  ]);
  const result = { zone, workers, workerTrend, d1Usage, since, until };
  await env.CF_MONITOR_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
  return result;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const authHeader = request.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) return json({ error: 'Unauthorized' }, 401, origin);

    const isOwner = await verifyOwner(token, env.CF_MONITOR_CACHE);
    if (!isOwner) return json({ error: 'Forbidden' }, 403, origin);

    try {
      if (url.pathname === '/api/cf/status' && request.method === 'GET') {
        const connected = Boolean(env.CF_API_TOKEN && env.CF_ACCOUNT_ID);
        return json({ connected, zoneConfigured: Boolean(env.CF_ZONE_ID) }, 200, origin);
      }

      if (url.pathname === '/api/cf/overview' && request.method === 'GET') {
        if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) {
          return json({ error: 'cf_not_configured' }, 503, origin);
        }
        const range = url.searchParams.get('range') ?? '28d';
        const data = await fetchOverview(env, range);
        return json(data, 200, origin);
      }

      return json({ error: 'Not found' }, 404, origin);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Internal error';
      console.error('[cf-monitor]', msg);
      return json({ error: 'Cloudflare analytics request failed' }, 502, origin);
    }
  },
};
