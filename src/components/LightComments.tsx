import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';

// IDEA-0009 Phase 2 — flat, anonymous comments only. Replies/threading and
// @mention tagging are deliberately Phase 3 scope, not implemented here.

const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';
const BODY_MAX = 2000;
const NAME_MAX = 80;
const PAGE_SIZE = 20;

interface CommentDTO {
  id: number;
  parentCommentId: number | null;
  authorName: string | null;
  body: string;
  createdAt: string;
}

function ownerTokenKey(id: number) {
  return `aarya_comment_owner_${id}`;
}

function storeOwnerToken(id: number, token: string) {
  try {
    localStorage.setItem(ownerTokenKey(id), token);
  } catch {
    /* localStorage unavailable (private mode etc.) — delete affordance just won't show */
  }
}

function getOwnerToken(id: number): string | null {
  try {
    return localStorage.getItem(ownerTokenKey(id));
  } catch {
    return null;
  }
}

function formatRelativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

interface LightCommentsProps {
  contentId: string;
}

export function LightComments({ contentId }: LightCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState('');
  const [body, setBody] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // NFR-7 — lazy-fetch only once the section actually scrolls into view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !WORKER_URL) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loadPage = useCallback(async (offset: number) => {
    const res = await fetch(
      `${WORKER_URL}/api/comment?contentId=${encodeURIComponent(contentId)}&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    if (!res.ok) throw new Error(String(res.status));
    return res.json() as Promise<{ comments: CommentDTO[]; hasMore: boolean }>;
  }, [contentId]);

  useEffect(() => {
    if (!inView) return;
    loadPage(0)
      .then((data) => {
        setComments(data.comments);
        setHasMore(data.hasMore);
      })
      .catch(() => setListError('Comments are unavailable right now — try again later.'));
  }, [inView, loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await loadPage(comments?.length ?? 0);
      setComments((prev) => [...(prev ?? []), ...data.comments]);
      setHasMore(data.hasMore);
    } catch {
      setListError('Could not load more comments — try again later.');
    } finally {
      setLoadingMore(false);
    }
  };

  const submit = async () => {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      setFormError('Write something before posting.');
      return;
    }
    if (trimmed.length > BODY_MAX) {
      setFormError(`Comments are capped at ${BODY_MAX} characters.`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`${WORKER_URL}/api/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          authorName: authorName.trim() || undefined,
          body: trimmed,
          honeypot,
        }),
      });
      if (res.status === 503) {
        setFormError('Comments are temporarily disabled.');
        return;
      }
      if (res.status === 429) {
        setFormError('Too many comments too fast — try again in a few minutes.');
        return;
      }
      if (!res.ok) {
        setFormError('Could not post your comment — try again.');
        return;
      }
      const data = await res.json() as { id: number; ownerToken: string };
      storeOwnerToken(data.id, data.ownerToken);
      // FR-3 — append locally instead of refetching, so it renders immediately.
      const posted: CommentDTO = {
        id: data.id,
        parentCommentId: null,
        authorName: authorName.trim() || null,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...(prev ?? []), posted]);
      setBody('');
    } catch {
      setFormError('Could not post your comment — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: number) => {
    const token = getOwnerToken(id);
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${WORKER_URL}/api/comment/${id}`, {
        method: 'DELETE',
        headers: { 'X-Owner-Token': token },
      });
      if (res.ok) setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
    } catch {
      /* leave the comment as-is — the reader can retry the delete */
    } finally {
      setDeletingId(null);
    }
  };

  if (!WORKER_URL) return null; // no Worker configured (e.g. static preview) — omit the section entirely

  return (
    <div ref={containerRef} className="mt-10">
      <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
        <MessageCircle size={14} className="text-violet-400" />
        Comments
      </h2>

      <GlassCard accent="violet" className="p-4 mb-4">
        <label htmlFor={`comment-name-${contentId}`} className="sr-only">Name (optional)</label>
        <input
          id={`comment-name-${contentId}`}
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value.slice(0, NAME_MAX))}
          placeholder="Name (optional)"
          className="w-full mb-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:border-violet-500/60"
        />
        {/* Honeypot — off-screen, never visible to a real reader; bots that fill every field trip it. */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        />
        <label htmlFor={`comment-body-${contentId}`} className="sr-only">Comment</label>
        <textarea
          id={`comment-body-${contentId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share a question or a thought about this use case…"
          rows={3}
          maxLength={BODY_MAX}
          className="w-full mb-2 px-3 py-2 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:border-violet-500/60 resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Posting is anonymous — no account needed. We store a hashed IP only to prevent
            spam (never the raw address), and you can delete your own comment any time.
          </p>
          <Button variant="primary" size="sm" icon={Send} disabled={submitting} onClick={() => void submit()}>
            Post
          </Button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-[11px] text-rose-400 min-h-[1em]">
          {formError}
        </p>
      </GlassCard>

      {listError && <p className="text-xs text-rose-400">{listError}</p>}

      {comments === null && !listError && (
        <p className="text-xs text-slate-500">Loading comments…</p>
      )}

      {comments !== null && comments.length === 0 && (
        <p className="text-xs text-slate-500">No comments yet — be the first.</p>
      )}

      {comments !== null && comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((c) => {
            const isDeletable = getOwnerToken(c.id) !== null;
            return (
              <GlassCard key={c.id} border="border-slate-700/40" className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">{c.authorName ?? 'Anonymous'}</p>
                    <p className="text-[10px] text-slate-500">{formatRelativeTime(c.createdAt)}</p>
                  </div>
                  {isDeletable && (
                    <button
                      onClick={() => void deleteComment(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="Delete my comment"
                      className="text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1.5 whitespace-pre-wrap">{c.body}</p>
              </GlassCard>
            );
          })}
          {hasMore && (
            <div className="text-center pt-1">
              <Button variant="ghost" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
