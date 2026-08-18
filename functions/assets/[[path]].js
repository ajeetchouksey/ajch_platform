// Guards against Cloudflare Pages' cache-poisoning bug for missing build assets.
//
// _redirects can't fix this: Cloudflare Pages only supports 200 (rewrite) and
// 3xx (redirect) status codes there — a custom 404 status is documented as
// unsupported (confirmed: developers.cloudflare.com/pages/configuration/redirects/).
// Two earlier attempts using _redirects (#412, #413) both silently no-op'd for
// exactly this reason.
//
// Without this Function, a request for a JS chunk that no longer exists in the
// current build (e.g. an old lazy-loaded chunk hash rotated out by a newer
// deploy) falls through to the SPA shell (index.html, 200) — Cloudflare's
// automatic behavior when no top-level 404.html is present. That wrong
// response still matches the /assets/* rule in public/_headers
// (Cache-Control: public, max-age=31536000, immutable), so Cloudflare's edge
// caches the mistaken 200-HTML response as if it were the real JS file — for
// up to a year. The next browser to request that exact chunk URL gets HTML
// back for a <script type="module"> load and fails with "Failed to load
// module script ... MIME type of 'text/html'" — reproduced live on
// aaryaai.dev.
//
// This Function intercepts every /assets/* request. If the underlying asset
// fetch comes back as the HTML shell (the tell-tale sign of the SPA fallback
// having kicked in for a path that should have been a real static file), it
// returns a genuine 404 with Cache-Control: no-store instead — so it can
// never be cached, poisoned, or mistaken for the real asset.
export async function onRequest(context) {
  const response = await context.env.ASSETS.fetch(context.request);
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html')) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return response;
}
