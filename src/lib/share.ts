export interface SharePayload {
  title: string;
  url: string;
  text?: string;
}

export type ShareResult = 'shared' | 'copied' | 'error';

/**
 * Attempts to share content using the best available browser API.
 *
 * Returns:
 * - `'shared'`  — Web Share API succeeded (native share sheet opened and confirmed)
 * - `'copied'`  — Clipboard API succeeded (URL written to clipboard as fallback)
 * - `'error'`   — Neither API available, user dismissed the share sheet (AbortError),
 *                 or an unexpected error occurred in either path
 */
export async function sharePost(payload: SharePayload): Promise<ShareResult> {
  const { title, url, text } = payload;

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    navigator.canShare({ title, url })
  ) {
    try {
      await navigator.share({ title, url, text });
      return 'shared';
    } catch {
      return 'error';
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard != null &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch {
      return 'error';
    }
  }

  return 'error';
}

// TEST SPEC:
// - navigator.share available + canShare true + resolves → 'shared'
// - navigator.share available + canShare true + throws AbortError → 'error'
// - navigator.share available + canShare true + throws generic error → 'error'
// - navigator.share undefined, clipboard.writeText resolves → 'copied'
// - navigator.share available + canShare false, clipboard.writeText resolves → 'copied'
// - navigator.share undefined, clipboard.writeText throws → 'error'
// - navigator.share undefined, navigator.clipboard null/undefined → 'error'
// - neither API available (SSR / fully restricted env) → 'error'
// - payload.text undefined → share still called with title + url only (text omitted from shareData)
