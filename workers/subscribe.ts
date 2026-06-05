/**
 * aarya-subscribe — Cloudflare Worker
 * POST /subscribe — dual-channel (email + GitHub handle) subscription endpoint
 *
 * Storage : GitHub Gists (private subscriber list + public aggregate stats)
 * Invites : GitHub App installation token → repo collaborator invite (read-only)
 * Security: CORS origin check, OWASP A03 input validation, KV rate limiting,
 *           PII-safe error logs (no email/handle ever logged)
 *
 * Required secrets (set via `wrangler secret put <NAME>`):
 *   GIST_TOKEN             Fine-grained PAT, Gists R/W scope only
 *   SUBSCRIBER_GIST_ID     Private/secret gist ID — subscribers.json
 *   PUBLIC_STATS_GIST_ID   Public gist ID        — aarya-stats.json
 *   GH_APP_ID              GitHub App ID (aarya-platform-bot)
 *   GH_APP_PRIVATE_KEY     GitHub App RSA private key (PEM, PKCS#1 or PKCS#8)
 *   GH_APP_INSTALLATION_ID GitHub App installation ID on ajch_platform repo
 */

const ALLOWED_ORIGIN = 'https://ajeetchouksey.github.io';
const REPO_OWNER = 'ajeetchouksey';
const REPO_NAME = 'ajch_platform';
const GH_API = 'https://api.github.com';

// ── OWASP A03 — Input validation patterns ────────────────────────────────────
// Email: local-part ≤64 chars, domain ≤253; no nested quantifiers (ReDoS-safe).
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(?:\.[a-zA-Z]{2,})+$/;
// GitHub handle: starts/ends with alphanumeric, hyphens in middle only, max 39 chars.
const GH_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Env {
  /** Fine-grained PAT — Gists read/write scope only. */
  GIST_TOKEN: string;
  /**
   * INVARIANT: this must be a *secret* (private) gist — never public.
   * Public gist = PII breach. The gist was created with "Create secret gist" in
   * the browser. Never re-create it as a public gist.
   */
  SUBSCRIBER_GIST_ID: string;
  /** Public gist — contains only aggregate counts (email_count, gh_count). No PII. */
  PUBLIC_STATS_GIST_ID: string;
  GH_APP_ID: string;
  /** RSA private key PEM (PKCS#1 or PKCS#8). Stored as a Worker secret. */
  GH_APP_PRIVATE_KEY: string;
  GH_APP_INSTALLATION_ID: string;
  /** Workers KV namespace — used for per-IP rate limiting. */
  RATE_LIMITER: KVNamespace;
}

interface Subscriber {
  type: 'email' | 'github';
  value: string;
  subscribed_at: string;
}

interface PublicStats {
  email_count: number;
  gh_count: number;
  synced_at: string;
}

// ── DER helpers — PKCS#1 RSA key → PKCS#8 (required by Web Crypto API) ───────

function derLength(n: number): number[] {
  if (n < 0x80) return [n];
  if (n < 0x100) return [0x81, n];
  return [0x82, (n >> 8) & 0xff, n & 0xff];
}

/**
 * Wraps a raw PKCS#1 RSA private key in a PKCS#8 PrivateKeyInfo envelope.
 * Web Crypto's `importKey('pkcs8', ...)` requires PKCS#8 format; GitHub App
 * private keys are downloaded in PKCS#1 ("RSA PRIVATE KEY") format.
 */
function pkcs1ToPkcs8(pkcs1: Uint8Array): Uint8Array {
  // AlgorithmIdentifier for rsaEncryption OID 1.2.840.113549.1.1.1
  const rsaOid = Uint8Array.from([
    0x30, 0x0d,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    0x05, 0x00,
  ]);
  const version = Uint8Array.from([0x02, 0x01, 0x00]);
  const octetLen = derLength(pkcs1.length);
  const octet = Uint8Array.from([0x04, ...octetLen, ...pkcs1]);
  const inner = Uint8Array.from([...version, ...rsaOid, ...octet]);
  const seqLen = derLength(inner.length);
  return Uint8Array.from([0x30, ...seqLen, ...inner]);
}

// ── JWT (RS256) helpers ───────────────────────────────────────────────────────

function b64url(s: string): string {
  return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlBytes(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function signGitHubAppJWT(appId: string, pemKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const signingInput = `${header}.${payload}`;

  const pemBody = pemKey.replace(/-----[^-]+-----|\s/g, '');
  const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const pkcs8 = pemKey.includes('RSA PRIVATE KEY') ? pkcs1ToPkcs8(der) : der;

  const key = await crypto.subtle.importKey(
    'pkcs8', pkcs8,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${b64urlBytes(new Uint8Array(sig))}`;
}

async function getInstallationToken(env: Env): Promise<string> {
  const jwt = await signGitHubAppJWT(env.GH_APP_ID, env.GH_APP_PRIVATE_KEY);
  const res = await fetch(
    `${GH_API}/app/installations/${env.GH_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'aarya-subscribe-worker/1.0',
      },
    },
  );
  if (!res.ok) throw new Error(`installation-token:${res.status}`);
  const data = await res.json() as { token: string };
  return data.token;
}

// ── Gist API helpers ──────────────────────────────────────────────────────────

async function readGist<T>(gistId: string, filename: string, token: string): Promise<T> {
  const res = await fetch(`${GH_API}/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'aarya-subscribe-worker/1.0',
    },
  });
  if (!res.ok) throw new Error(`gist-read:${res.status}`);
  const gist = await res.json() as { files: Record<string, { content: string }> };
  const content = gist.files[filename]?.content ?? '[]';
  return JSON.parse(content) as T;
}

async function writeGist(
  gistId: string, filename: string, content: unknown, token: string,
): Promise<void> {
  const res = await fetch(`${GH_API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'aarya-subscribe-worker/1.0',
    },
    body: JSON.stringify({
      files: { [filename]: { content: JSON.stringify(content, null, 2) } },
    }),
  });
  if (!res.ok) throw new Error(`gist-write:${res.status}`);
}

// ── GitHub collaborator invite (non-fatal) ────────────────────────────────────

/** Sends a read-only collaborator invite via GitHub App token. Fire-and-forget. */
async function inviteCollaborator(handle: string, env: Env): Promise<void> {
  try {
    const token = await getInstallationToken(env);
    await fetch(
      `${GH_API}/repos/${REPO_OWNER}/${REPO_NAME}/collaborators/${handle}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'aarya-subscribe-worker/1.0',
        },
        body: JSON.stringify({ permission: 'read' }),
      },
    );
  } catch (err) {
    // Non-fatal; subscriber is already persisted. Log error code only — no PII.
    console.error('collaborator-invite-failed:', (err as Error).message);
  }
}

// ── Rate limiting (Workers KV — 5 req per 15 min per IP) ─────────────────────

/**
 * Returns false if the IP has exceeded 5 POST requests in the current 15-min
 * window. Uses Workers KV with a 30-min TTL per bucket key.
 * Fails open on KV errors to avoid blocking legitimate traffic — zone-level
 * Cloudflare rate limiting should be configured as the primary defence.
 */
async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const key = `rl:${ip}:${bucket}`;
  try {
    const raw = await env.RATE_LIMITER.get(key);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= 5) return false;
    await env.RATE_LIMITER.put(key, String(count + 1), { expirationTtl: 1800 });
    return true;
  } catch {
    // KV unavailable — fail open; rely on Cloudflare zone-level rules
    return true;
  }
}

// ── CORS ──────────────────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ── Worker entry point ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');

    // Handle preflight
    if (request.method === 'OPTIONS') {
      if (origin !== ALLOWED_ORIGIN) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // CORS enforcement (browser clients only; servers always bypass CORS)
    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    // Per-IP rate limiting (5 req / 15 min)
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (!(await checkRateLimit(env, ip))) {
      return json({ error: 'Too many requests — please wait before subscribing again.' }, 429);
    }

    // ── Parse + validate body (OWASP A03) ─────────────────────────────────────
    let body: { type?: unknown; value?: unknown };
    try {
      body = await request.json() as { type?: unknown; value?: unknown };
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const { type, value } = body;

    if (type !== 'email' && type !== 'github') {
      return json({ error: 'Invalid subscription type' }, 400);
    }
    if (typeof value !== 'string' || value.length === 0 || value.length > 254) {
      return json({ error: 'Invalid value' }, 400);
    }

    const trimmed = value.trim();
    const normalised = trimmed.toLowerCase();

    if (type === 'email' && !EMAIL_RE.test(normalised)) {
      return json({ error: 'Invalid email address' }, 400);
    }
    if (type === 'github' && !GH_HANDLE_RE.test(trimmed)) {
      return json({ error: 'Invalid GitHub handle' }, 400);
    }

    // ── Read subscribers (INVARIANT: private gist) ─────────────────────────────
    let subscribers: Subscriber[];
    try {
      subscribers = await readGist<Subscriber[]>(
        env.SUBSCRIBER_GIST_ID, 'subscribers.json', env.GIST_TOKEN,
      );
      if (!Array.isArray(subscribers)) subscribers = [];
    } catch (err) {
      // Log error code only — no PII in logs
      console.error('subscriber-read-failed:', (err as Error).message);
      return json({ error: 'Service temporarily unavailable' }, 503);
    }

    // ── Deduplicate ────────────────────────────────────────────────────────────
    const dedupKey = `${type}:${normalised}`;
    if (subscribers.some(s => `${s.type}:${s.value.toLowerCase()}` === dedupKey)) {
      return json({ status: 'already_subscribed' }, 200);
    }

    // ── Persist ────────────────────────────────────────────────────────────────
    subscribers.push({
      type: type as 'email' | 'github',
      value: normalised,
      subscribed_at: new Date().toISOString(),
    });

    try {
      await writeGist(env.SUBSCRIBER_GIST_ID, 'subscribers.json', subscribers, env.GIST_TOKEN);
    } catch (err) {
      console.error('subscriber-write-failed:', (err as Error).message);
      return json({ error: 'Service temporarily unavailable' }, 503);
    }

    // ── Update public stats (aggregate counts only — no PII) ──────────────────
    const stats: PublicStats = {
      email_count: subscribers.filter(s => s.type === 'email').length,
      gh_count: subscribers.filter(s => s.type === 'github').length,
      synced_at: new Date().toISOString(),
    };
    try {
      await writeGist(env.PUBLIC_STATS_GIST_ID, 'aarya-stats.json', stats, env.GIST_TOKEN);
    } catch (err) {
      // Non-fatal — subscriber already persisted; stats will catch up on next subscribe
      console.error('stats-update-failed:', (err as Error).message);
    }

    // ── Invite GitHub collaborator (fire-and-forget) ───────────────────────────
    if (type === 'github') {
      void inviteCollaborator(trimmed, env);
    }

    return json({ status: 'subscribed' }, 200);
  },
};
