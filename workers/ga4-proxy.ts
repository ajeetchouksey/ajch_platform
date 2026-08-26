/**
 * aarya-ga4-proxy — Cloudflare Worker
 * GET  /api/ga/realtime  — active users, top pages, top countries (60 s KV cache)
 * POST /api/ga/report    — GA4 Data API report {dateRange, dimensions, metrics}
 *
 * Auth: every request must carry either Authorization: Bearer <github_token>
 *   1. SHA-256 hash token → 16-char key
 *   2. Check KV auth:<hash> (10-min TTL) for cached login
 *   3. On miss → call GitHub /user, verify login === 'ajeetchouksey'
 *   4. Cache verified login in KV
 *  ...or X-Sync-Key: <MONITORING_SYNC_KEY>, used by the weekly
 *  monitoring-snapshot-sync GitHub Actions workflow, which has no GitHub
 *  session to verify.
 *
 * GA4 service-account JWT is signed here; access token cached in KV (55 min TTL).
 *
 * Secrets (set via `wrangler secret put <NAME> --config wrangler.ga4.toml`):
 *   GA4_SERVICE_ACCOUNT_B64   base64-encoded service-account JSON
 *   GA4_PROPERTY_ID           GA4 numeric property ID (e.g. "123456789")
 *   MONITORING_SYNC_KEY       shared secret for monitoring-snapshot-sync.yml (same value on both Workers)
 *
 * KV binding:
 *   GA4_CACHE   namespace for auth + response caching
 */

const ALLOWED_ORIGINS = new Set([
  'https://aaryaai.dev',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
]);
const OWNER_LOGIN = 'ajeetchouksey';
const GA4_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const GA4_REALTIME_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const GH_API = 'https://api.github.com';
const TOKEN_SCOPES = 'https://www.googleapis.com/auth/analytics.readonly';

export interface Env {
  GA4_SERVICE_ACCOUNT_B64?: string; // optional when OAuth is used
  GA4_PROPERTY_ID: string;
  GA4_CACHE: KVNamespace;
  ANALYTICS_DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MONITORING_SYNC_KEY?: string; // shared secret for the weekly monitoring-snapshot-sync workflow
}

// ── CORS helpers ──────────────────────────────────────────────────────────────

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://aaryaai.dev';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// ── In-memory cache tier (per-isolate) ────────────────────────────────────────
// A warm Cloudflare Workers isolate serves many requests before being recycled.
// Nearly every route here does a KV read (auth check, access-token check,
// response cache check) on every single call — under realtime polling + multiple
// tabs, that burns through the free-tier KV quota (100k reads/day) fast. Checking
// an in-memory Map first, and only falling back to KV on a miss, avoids a KV read
// entirely for repeat requests within the same warm isolate. KV stays the source
// of truth (still written on every set, still read on a memory miss) — this is
// purely a read-reduction layer, not a correctness change.
const memCache = new Map<string, { value: string; expires: number }>();

function memGet(key: string): string | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { memCache.delete(key); return null; }
  return entry.value;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  memCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

async function cachedKvGet(kv: KVNamespace, key: string, ttlSeconds = 55): Promise<string | null> {
  const mem = memGet(key);
  if (mem !== null) return mem;
  const fromKv = await kv.get(key);
  if (fromKv !== null) memSet(key, fromKv, ttlSeconds);
  return fromKv;
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

  const cached = await cachedKvGet(kv, cacheKey, 600);
  if (cached === OWNER_LOGIN) return true;
  if (cached !== null) return false; // cached non-owner

  const res = await fetch(`${GH_API}/user`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'aarya-ga4-proxy/1.0' },
  });
  if (!res.ok) return false;

  const { login } = await res.json<{ login: string }>();
  const cacheValue = login === OWNER_LOGIN ? OWNER_LOGIN : '';
  // Cache result for 10 minutes regardless of pass/fail (empty string = not owner)
  memSet(cacheKey, cacheValue, 600);
  await kv.put(cacheKey, cacheValue, { expirationTtl: 600 });
  return login === OWNER_LOGIN;
}

// ── GA4 JWT + access token ────────────────────────────────────────────────────

interface ServiceAccount {
  client_email: string;
  private_key: string;
  private_key_id: string;
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// service-account JWT path (requires GA4_SERVICE_ACCOUNT_B64)
async function getAccessTokenSA(env: Env): Promise<string> {
  const saJson = atob(env.GA4_SERVICE_ACCOUNT_B64!);
  const sa: ServiceAccount = JSON.parse(saJson);

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: sa.private_key_id })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email,
    scope: TOKEN_SCOPES,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));

  const sigInput = `${header}.${payload}`;

  const pemBody = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(sigInput));

  const jwt = `${sigInput}.${b64url(sig)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) throw new Error(`GA4 SA token exchange failed: ${await tokenRes.text()}`);

  const { access_token, expires_in } = await tokenRes.json<{ access_token: string; expires_in: number }>();
  const ttl = Math.min(expires_in - 300, 3300);
  memSet('ga4:access_token', access_token, ttl);
  await env.GA4_CACHE.put('ga4:access_token', access_token, { expirationTtl: ttl });
  return access_token;
}

// OAuth user-account path (uses stored refresh token in KV)
async function getAccessTokenOAuth(env: Env): Promise<string> {
  const refreshToken = await env.GA4_CACHE.get('ga4:oauth_refresh_token');
  if (!refreshToken) throw new Error('ga4_not_connected');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) throw new Error(`OAuth token refresh failed: ${res.status}`);

  const { access_token, expires_in } = await res.json<{ access_token: string; expires_in: number }>();
  const ttl = Math.min(expires_in - 300, 3300);
  memSet('ga4:access_token', access_token, ttl);
  await env.GA4_CACHE.put('ga4:access_token', access_token, { expirationTtl: ttl });
  return access_token;
}

// Orchestrator: service account wins if configured, otherwise OAuth
async function getAccessToken(env: Env): Promise<string> {
  const cached = await cachedKvGet(env.GA4_CACHE, 'ga4:access_token', 3300);
  if (cached) return cached;
  if (env.GA4_SERVICE_ACCOUNT_B64) return getAccessTokenSA(env);
  return getAccessTokenOAuth(env);
}

// ── GA4 Realtime report ───────────────────────────────────────────────────────

const REALTIME_CACHE_TTL = 90; // was 60s — 30s poll interval bumped to 60s alongside this
const REPORT_CACHE_TTL = 900; // 15 min — was 5 min; report data doesn't need to be that fresh

async function runRealtimeReport(env: Env): Promise<unknown> {
  const cacheKey = 'ga4:realtime:v1';
  const cached = await cachedKvGet(env.GA4_CACHE, cacheKey, REALTIME_CACHE_TTL);
  if (cached) return JSON.parse(cached);

  const token = await getAccessToken(env);
  // GA4's realtime dimension is unifiedScreenName -- not unifiedPageScreen
  // (that name doesn't exist; confirmed via a live 400 whose own error
  // message suggested the correct one).
  const body = {
    dimensions: [{ name: 'unifiedScreenName' }, { name: 'country' }, { name: 'minutesAgo' }],
    metrics: [{ name: 'activeUsers' }],
  };

  const res = await fetch(`${GA4_REALTIME_BASE}/properties/${env.GA4_PROPERTY_ID}:runRealtimeReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`GA4 realtime error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const serialized = JSON.stringify(data);
  memSet(cacheKey, serialized, REALTIME_CACHE_TTL);
  await env.GA4_CACHE.put(cacheKey, serialized, { expirationTtl: REALTIME_CACHE_TTL });
  return data;
}

// ── GA4 Data report ───────────────────────────────────────────────────────────

interface ReportRequest {
  dateRange: { startDate: string; endDate: string };
  dimensions: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: unknown;
  orderBys?: unknown[];
  limit?: number;
}

async function runDataReport(env: Env, req: ReportRequest): Promise<unknown> {
  // Static cache key based on first metric + date range (single owner, no user-scoping needed)
  const cacheKey = `ga4:report:${req.dateRange.startDate}:${req.dateRange.endDate}:${req.metrics.map(m => m.name).join(',')}:${req.dimensions.map(d => d.name).join(',')}`;
  const cached = await cachedKvGet(env.GA4_CACHE, cacheKey, REPORT_CACHE_TTL);
  if (cached) return JSON.parse(cached);

  const token = await getAccessToken(env);
  const body = {
    dateRanges: [req.dateRange],
    dimensions: req.dimensions,
    metrics: req.metrics,
    ...(req.dimensionFilter ? { dimensionFilter: req.dimensionFilter } : {}),
    ...(req.orderBys ? { orderBys: req.orderBys } : {}),
    limit: req.limit ?? 20,
  };

  const res = await fetch(`${GA4_BASE}/properties/${env.GA4_PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 report error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const serialized = JSON.stringify(data);
  memSet(cacheKey, serialized, REPORT_CACHE_TTL);
  await env.GA4_CACHE.put(cacheKey, serialized, { expirationTtl: REPORT_CACHE_TTL });
  return data;
}

// ── Retention (GA4 native cohort report) ──────────────────────────────────────
// A cohortSpec request is a fundamentally different shape than every other
// query on this page — no dateRanges, cohorts define their own date ranges
// internally, and the response uses cohort/cohortNthWeek dimensions instead
// of the usual ones. Kept as its own function/route rather than overloading
// runDataReport(). Weekly granularity, 5 weeks (Week 0-4) as GA4's own
// Retention report defaults to.

async function runCohortReport(env: Env, sinceDate: string): Promise<unknown> {
  const cacheKey = `ga4:retention:${sinceDate}`;
  const cached = await cachedKvGet(env.GA4_CACHE, cacheKey, REPORT_CACHE_TTL);
  if (cached) return JSON.parse(cached);

  const token = await getAccessToken(env);
  // Cohort date ranges reject GA4's usual relative keywords ("today") --
  // confirmed via a live 400 ("cohort end date format is not correct") --
  // needs a literal YYYY-MM-DD.
  const todayLiteral = new Date().toISOString().slice(0, 10);
  const body = {
    dimensions: [{ name: 'cohort' }, { name: 'cohortNthWeek' }],
    metrics: [{ name: 'cohortActiveUsers' }, { name: 'cohortTotalUsers' }],
    cohortSpec: {
      cohorts: [{ dimension: 'firstSessionDate', name: 'cohort', dateRange: { startDate: sinceDate, endDate: todayLiteral } }],
      cohortsRange: { granularity: 'WEEKLY', startOffset: 0, endOffset: 4 },
    },
  };

  const res = await fetch(`${GA4_BASE}/properties/${env.GA4_PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 cohort report error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const serialized = JSON.stringify(data);
  memSet(cacheKey, serialized, REPORT_CACHE_TTL);
  await env.GA4_CACHE.put(cacheKey, serialized, { expirationTtl: REPORT_CACHE_TTL });
  return data;
}

// ── Daily analytics history (D1) ──────────────────────────────────────────────
// Persists the Overview tab's daily series independent of GA4's own retention
// window and the 15-min KV cache above — populated by the Cron Trigger
// (scheduled(), below) plus a one-time /api/ga/backfill call, read back via
// GET /api/ga/history. See workers/schema-analytics.sql for the table shape.

const OVERVIEW_METRICS = [
  { name: 'sessions' },
  { name: 'totalUsers' },
  { name: 'screenPageViews' },
  { name: 'engagementRate' },
  { name: 'averageSessionDuration' },
  { name: 'bounceRate' },
] as const;

interface OverviewRow {
  date: string; // YYYY-MM-DD
  sessions: number;
  users: number;
  pageviews: number;
  engagementRate: number;
  avgDurationSecs: number;
  bounceRate: number;
}

// GA4's `date` dimension returns YYYYMMDD with no separators — normalize to
// the YYYY-MM-DD shape used everywhere else (D1 primary key, API responses).
function normalizeGa4Date(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function rowsFromGa4Report(data: unknown): OverviewRow[] {
  const rows = (data as { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] }).rows ?? [];
  return rows.map(r => ({
    date: normalizeGa4Date(r.dimensionValues[0].value),
    sessions: parseInt(r.metricValues[0].value, 10) || 0,
    users: parseInt(r.metricValues[1].value, 10) || 0,
    pageviews: parseInt(r.metricValues[2].value, 10) || 0,
    engagementRate: parseFloat(r.metricValues[3].value) || 0,
    avgDurationSecs: parseFloat(r.metricValues[4].value) || 0,
    bounceRate: parseFloat(r.metricValues[5].value) || 0,
  }));
}

async function upsertOverviewRows(env: Env, rows: OverviewRow[]): Promise<void> {
  const now = new Date().toISOString();
  const stmt = env.ANALYTICS_DB.prepare(
    `INSERT INTO daily_overview (date, sessions, users, pageviews, engagement_rate, avg_duration_secs, bounce_rate, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       sessions = excluded.sessions,
       users = excluded.users,
       pageviews = excluded.pageviews,
       engagement_rate = excluded.engagement_rate,
       avg_duration_secs = excluded.avg_duration_secs,
       bounce_rate = excluded.bounce_rate,
       updated_at = excluded.updated_at`
  );
  const batch = rows.map(r => stmt.bind(r.date, r.sessions, r.users, r.pageviews, r.engagementRate, r.avgDurationSecs, r.bounceRate, now));
  if (batch.length > 0) await env.ANALYTICS_DB.batch(batch);
}

// Snapshots a single day (or short range) from GA4 into D1. Used both by the
// daily cron (last 3 days, self-healing via the upsert above) and by the
// one-time backfill route (a wide range in one GA4 call).
async function snapshotOverviewRange(env: Env, startDate: string, endDate: string): Promise<OverviewRow[]> {
  const data = await runDataReport(env, {
    dateRange: { startDate, endDate },
    dimensions: [{ name: 'date' }],
    metrics: [...OVERVIEW_METRICS],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: 1000,
  });
  const rows = rowsFromGa4Report(data);
  await upsertOverviewRows(env, rows);
  return rows;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Everything below can throw (KV, fetch, JSON parsing) — wrap it all in one
    // try/catch. This used to only wrap the /api/ga/* routes, leaving
    // /oauth/callback and verifyOwner() able to become uncaught worker
    // exceptions (Cloudflare's own analytics showed ~46% of all requests
    // failing with scriptThrewException — a real bug, not just noisy 401s
    // from unauthenticated/bot traffic, which return a clean Response and
    // don't count as script errors).
    try {

    // /oauth/callback is called by Google — no Bearer token, state param is the CSRF proof
    if (url.pathname === '/oauth/callback' && request.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code || !state) return new Response('Bad request', { status: 400 });

      // Single-use state: delete before exchange to prevent replay (AppSec Req 1)
      const stateKey = `oauth:state:${state}`;
      const storedOrigin = await env.GA4_CACHE.get(stateKey);
      if (!storedOrigin) return new Response('Invalid or expired state', { status: 403 });
      await env.GA4_CACHE.delete(stateKey);

      const workerBase = new URL(request.url).origin;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${workerBase}/oauth/callback`,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        return Response.redirect(`${storedOrigin}/monitoring?connected=error`, 302);
      }

      const tokens = await tokenRes.json<{ access_token: string; refresh_token?: string; expires_in: number }>();
      if (tokens.refresh_token) {
        // Stored silently — never echoed in any response (AppSec Req 2)
        await env.GA4_CACHE.put('ga4:oauth_refresh_token', tokens.refresh_token);
      }
      await env.GA4_CACHE.put('ga4:access_token', tokens.access_token, { expirationTtl: Math.min(tokens.expires_in - 300, 3300) });
      return Response.redirect(`${storedOrigin}/monitoring?connected=true`, 302);
    }

    // All other routes require either the owner's GitHub token, or the
    // shared sync key used by the weekly monitoring-snapshot-sync GitHub
    // Actions workflow (machine caller — no GitHub session to verify).
    const syncKey = request.headers.get('X-Sync-Key') ?? '';
    const isSyncCaller = Boolean(env.MONITORING_SYNC_KEY) && syncKey === env.MONITORING_SYNC_KEY;

    if (!isSyncCaller) {
      const authHeader = request.headers.get('Authorization') ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!token) return json({ error: 'Unauthorized' }, 401, origin);

      const isOwner = await verifyOwner(token, env.GA4_CACHE);
      if (!isOwner) return json({ error: 'Forbidden' }, 403, origin);
    }

      // GET /api/ga/status — returns connection method, never leaks tokens (AppSec Req 2)
      if (url.pathname === '/api/ga/status' && request.method === 'GET') {
        const hasSA = Boolean(env.GA4_SERVICE_ACCOUNT_B64);
        const hasOAuth = Boolean(await env.GA4_CACHE.get('ga4:oauth_refresh_token'));
        const method = hasSA ? 'service_account' : hasOAuth ? 'oauth' : 'none';
        return json({ connected: hasSA || hasOAuth, method }, 200, origin);
      }

      // GET /oauth/start — returns Google consent URL for the owner to navigate to
      if (url.pathname === '/oauth/start' && request.method === 'GET') {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
          return json({ error: 'OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET' }, 501, origin);
        }
        // crypto.randomUUID() for high-entropy state (AppSec Req 1)
        const state = crypto.randomUUID();
        const frontendOrigin = (origin && ALLOWED_ORIGINS.has(origin)) ? origin : 'https://aaryaai.dev';
        // TTL = 5 min; value = frontend origin for redirect-back (AppSec Req 1)
        await env.GA4_CACHE.put(`oauth:state:${state}`, frontendOrigin, { expirationTtl: 300 });
        const workerBase = new URL(request.url).origin;
        const params = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          redirect_uri: `${workerBase}/oauth/callback`,
          response_type: 'code',
          scope: TOKEN_SCOPES,
          access_type: 'offline',
          prompt: 'consent',
          state,
        });
        return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }, 200, origin);
      }

      // POST /oauth/disconnect — remove stored OAuth tokens from KV
      if (url.pathname === '/oauth/disconnect' && request.method === 'POST') {
        await Promise.all([
          env.GA4_CACHE.delete('ga4:oauth_refresh_token'),
          env.GA4_CACHE.delete('ga4:access_token'),
        ]);
        return json({ ok: true }, 200, origin);
      }

      if (url.pathname === '/api/ga/realtime' && request.method === 'GET') {
        const data = await runRealtimeReport(env);
        return json(data, 200, origin);
      }

      // GET /api/ga/retention — weekly cohort report (Week 0-4 % returning)
      // Query param: since=YYYY-MM-DD (cohort window start; defaults to HISTORY_START_DATE-equivalent)
      if (url.pathname === '/api/ga/retention' && request.method === 'GET') {
        const since = url.searchParams.get('since') ?? '2026-06-02';
        const data = await runCohortReport(env, since);
        return json(data, 200, origin);
      }

      if (url.pathname === '/api/ga/report' && request.method === 'POST') {
        const body: ReportRequest = await request.json();
        if (!body.dateRange || !body.dimensions || !body.metrics) {
          return json({ error: 'Missing dateRange, dimensions, or metrics' }, 400, origin);
        }
        const data = await runDataReport(env, body);
        return json(data, 200, origin);
      }

      // POST /api/ga/backfill — one-time (or re-run) wide-range snapshot into D1.
      // Body: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
      if (url.pathname === '/api/ga/backfill' && request.method === 'POST') {
        const body = await request.json<{ startDate?: string; endDate?: string }>();
        if (!body.startDate || !body.endDate) {
          return json({ error: 'Missing startDate or endDate' }, 400, origin);
        }
        const rows = await snapshotOverviewRange(env, body.startDate, body.endDate);
        const earliestDateReturned = rows.length > 0 ? rows[0].date : null;
        return json({
          inserted: rows.length,
          requestedStartDate: body.startDate,
          earliestDateReturned,
          truncated: earliestDateReturned !== null && earliestDateReturned !== body.startDate,
        }, 200, origin);
      }

      // GET /api/ga/history — reads the persisted daily series from D1, no GA4 call.
      // Query params: start=YYYY-MM-DD, end=YYYY-MM-DD
      if (url.pathname === '/api/ga/history' && request.method === 'GET') {
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');
        if (!start || !end) {
          return json({ error: 'Missing start or end query param' }, 400, origin);
        }
        const { results } = await env.ANALYTICS_DB.prepare(
          'SELECT * FROM daily_overview WHERE date BETWEEN ? AND ? ORDER BY date'
        ).bind(start, end).all();
        return json({ rows: results }, 200, origin);
      }

      return json({ error: 'Not found' }, 404, origin);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Internal error';
      // ga4_not_connected → tell the UI to show the connect banner
      if (msg === 'ga4_not_connected') return json({ error: 'ga4_not_connected' }, 503, origin);
      console.error('[ga4-proxy]', msg);
      return json({ error: 'GA4 request failed' }, 502, origin);
    }
  },

  // Cron Trigger (see [triggers] in wrangler.ga4.toml) — daily snapshot of the
  // last 3 days into ANALYTICS_DB. 3 days, not just yesterday, because GA4
  // data can still shift for ~48h after a day ends; the upsert in
  // upsertOverviewRows() makes re-snapshotting self-healing rather than
  // additive.
  //
  // Uses GA4's own relative-date keywords ("3daysAgo"/"yesterday") instead of
  // computing calendar dates client-side in UTC — the Data API resolves these
  // in the GA4 property's own configured reporting timezone, so if that
  // timezone isn't UTC, a UTC-computed date could snapshot the wrong calendar
  // day (and briefly disagree with what the live KPI tiles show for "today").
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      try {
        await snapshotOverviewRange(env, '3daysAgo', 'yesterday');
      } catch (err) {
        console.error('[ga4-proxy] scheduled snapshot failed', err instanceof Error ? err.message : err);
      }
    })());
  },
};
