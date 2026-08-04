/**
 * aarya-ga4-proxy — Cloudflare Worker
 * GET  /api/ga/realtime  — active users, top pages, top countries (60 s KV cache)
 * POST /api/ga/report    — GA4 Data API report {dateRange, dimensions, metrics}
 *
 * Auth: every request must carry Authorization: Bearer <github_token>
 *   1. SHA-256 hash token → 16-char key
 *   2. Check KV auth:<hash> (10-min TTL) for cached login
 *   3. On miss → call GitHub /user, verify login === 'ajeetchouksey'
 *   4. Cache verified login in KV
 *
 * GA4 service-account JWT is signed here; access token cached in KV (55 min TTL).
 *
 * Secrets (set via `wrangler secret put <NAME> --config wrangler.ga4.toml`):
 *   GA4_SERVICE_ACCOUNT_B64   base64-encoded service-account JSON
 *   GA4_PROPERTY_ID           GA4 numeric property ID (e.g. "123456789")
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
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
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
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'aarya-ga4-proxy/1.0' },
  });
  if (!res.ok) return false;

  const { login } = await res.json<{ login: string }>();
  // Cache result for 10 minutes regardless of pass/fail (empty string = not owner)
  await kv.put(cacheKey, login === OWNER_LOGIN ? OWNER_LOGIN : '', { expirationTtl: 600 });
  return login === OWNER_LOGIN;
}

// ── GA4 JWT + access token ────────────────────────────────────────────────────

interface ServiceAccount {
  client_email: string;
  private_key: string;
  private_key_id: string;
}

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
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
  await env.GA4_CACHE.put('ga4:access_token', access_token, { expirationTtl: Math.min(expires_in - 300, 3300) });
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
  await env.GA4_CACHE.put('ga4:access_token', access_token, { expirationTtl: Math.min(expires_in - 300, 3300) });
  return access_token;
}

// Orchestrator: service account wins if configured, otherwise OAuth
async function getAccessToken(env: Env): Promise<string> {
  const cached = await env.GA4_CACHE.get('ga4:access_token');
  if (cached) return cached;
  if (env.GA4_SERVICE_ACCOUNT_B64) return getAccessTokenSA(env);
  return getAccessTokenOAuth(env);
}

// ── GA4 Realtime report ───────────────────────────────────────────────────────

async function runRealtimeReport(env: Env): Promise<unknown> {
  const cacheKey = 'ga4:realtime:v1';
  const cached = await env.GA4_CACHE.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const token = await getAccessToken(env);
  const body = {
    dimensions: [{ name: 'unifiedPageScreen' }, { name: 'country' }, { name: 'minutesAgo' }],
    metrics: [{ name: 'activeUsers' }],
  };

  const res = await fetch(`${GA4_REALTIME_BASE}/properties/${env.GA4_PROPERTY_ID}:runRealtimeReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`GA4 realtime error: ${res.status}`);
  const data = await res.json();
  await env.GA4_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
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
  const cached = await env.GA4_CACHE.get(cacheKey);
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
  await env.GA4_CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 }); // 5-min cache
  return data;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

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

    // All other routes require owner GitHub token
    const authHeader = request.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) return json({ error: 'Unauthorized' }, 401, origin);

    const isOwner = await verifyOwner(token, env.GA4_CACHE);
    if (!isOwner) return json({ error: 'Forbidden' }, 403, origin);

    try {
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

      if (url.pathname === '/api/ga/report' && request.method === 'POST') {
        const body: ReportRequest = await request.json();
        if (!body.dateRange || !body.dimensions || !body.metrics) {
          return json({ error: 'Missing dateRange, dimensions, or metrics' }, 400, origin);
        }
        const data = await runDataReport(env, body);
        return json(data, 200, origin);
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
};
