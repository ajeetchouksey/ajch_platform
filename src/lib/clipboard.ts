// ── Clipboard ──────────────────────────────────────────────────────────────────
// Small shared helper for copying arbitrary text (e.g. an AI handoff prompt).
// Deliberately separate from share.ts — sharePost() has a different
// {title,url,text} Web Share API shape built for sharing a page URL.
//
// SECURITY: never log the `text` parameter — copied content may include a
// user-composed AI prompt and must not be leaked to the browser console.

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// TEST SPEC:
// - navigator.clipboard.writeText resolves → returns true
// - navigator.clipboard.writeText rejects → returns false, no throw
// - navigator.clipboard undefined/missing → returns false, no throw
// - text content is never passed to console.log/console.error (spy-check)
