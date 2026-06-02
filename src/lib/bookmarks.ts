// ── Bookmark Layer ────────────────────────────────────────────────────────
// Pure, immutable functions operating on ProgressV2.bookmarks[].
// No DOM, no React, no external deps.
// All functions return a new ProgressV2 — original is never mutated.
// ──────────────────────────────────────────────────────────────────────────

import type { ProgressV2 } from '@/lib/progress-schema';

/**
 * Add a content ID to bookmarks (idempotent — no duplicate if already present).
 */
export function addBookmark(progress: ProgressV2, id: string): ProgressV2 {
  if (progress.bookmarks.includes(id)) return progress;
  return {
    ...progress,
    bookmarks: [...progress.bookmarks, id].sort(),
  };
}

/**
 * Remove a content ID from bookmarks (idempotent — no-op if not present).
 */
export function removeBookmark(progress: ProgressV2, id: string): ProgressV2 {
  const filtered = progress.bookmarks.filter((b) => b !== id);
  if (filtered.length === progress.bookmarks.length) return progress;
  return { ...progress, bookmarks: filtered };
}

/**
 * Return a sorted copy of the bookmarks array.
 */
export function getBookmarks(progress: ProgressV2): string[] {
  return [...progress.bookmarks].sort();
}

/**
 * Return true if the given content ID is bookmarked.
 */
export function isBookmarked(progress: ProgressV2, id: string): boolean {
  return progress.bookmarks.includes(id);
}
