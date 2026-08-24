/**
 * Turns a failed GA4-proxy response into a message worth showing an owner,
 * instead of a bare HTTP status code. The proxy (workers/ga4-proxy.ts) returns
 * a JSON body like `{ error: "ga4_not_connected" }` on failure — read it when
 * present, and special-case the "not connected yet" state since it's the most
 * common one (before OAuth/service-account setup is finished).
 */
export async function ga4ErrorMessage(res: Response): Promise<string> {
  let body: { error?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body (e.g. a Cloudflare edge error page) — fall through to the status code
  }
  if (res.status === 503 && body?.error === 'ga4_not_connected') {
    return 'Not connected yet — click "Connect Google Analytics" above.';
  }
  if (res.status === 503 && body?.error === 'kv_quota_exceeded') {
    return "Hit Cloudflare's daily KV read limit — try again after it resets (UTC midnight), or upgrade the Workers plan.";
  }
  if (body?.error) return `GA4 error: ${body.error}`;
  return `GA4 request failed (HTTP ${res.status})`;
}
