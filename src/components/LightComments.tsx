import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Trash2, Reply as ReplyIcon } from 'lucide-react';
import { GlassCard, Button } from '@/components/ui';

// IDEA-0009 Phase 3 — one-level-deep replies (FR-2/FR-4) and @mention tagging
// (FR-13, display-only — no notification path exists for anonymous authors).

const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';
const BODY_MAX = 2000;
const NAME_MAX = 80;
const PAGE_SIZE = 20;
const REPLIES_COLLAPSE_AT = 3;

interface CommentDTO {
  id: number;
  parentCommentId: number | null;
  authorName: string | null;
  body: string;
  createdAt: string;
}

interface CommentNode extends CommentDTO {
  replies: CommentDTO[];
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

/** Groups a flat, oldest-first comment list into top-level nodes with their replies attached. */
function nestComments(flat: CommentDTO[]): CommentNode[] {
  const byId = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of flat) byId.set(c.id, { ...c, replies: [] });
  for (const c of flat) {
    if (c.parentCommentId === null) {
      roots.push(byId.get(c.id)!);
    } else {
      byId.get(c.parentCommentId)?.replies.push(c);
    }
  }
  return roots;
}

/**
 * Splits a comment body into plain-text and @mention segments, matched against the
 * other real (non-Anonymous) display names already present in the same thread (FR-13).
 * Purely presentational — matching text is never validated against who can "see" it.
 */
function splitMentions(body: string, knownNames: string[]): { text: string; mention: boolean }[] {
  if (knownNames.length === 0) return [{ text: body, mention: false }];
  const names = [...knownNames].sort((a, b) => b.length - a.length);
  const segments: { text: string; mention: boolean }[] = [];
  let i = 0;
  let plain = '';
  const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);
  while (i < body.length) {
    if (body[i] === '@') {
      const match = names.find((name) => {
        const slice = body.slice(i + 1, i + 1 + name.length);
        return slice.toLowerCase() === name.toLowerCase() && !isWordChar(body[i + 1 + name.length]);
      });
      if (match) {
        if (plain) segments.push({ text: plain, mention: false });
        plain = '';
        segments.push({ text: `@${match}`, mention: true });
        i += 1 + match.length;
        continue;
      }
    }
    plain += body[i];
    i += 1;
  }
  if (plain) segments.push({ text: plain, mention: false });
  return segments;
}

function CommentBody({ body, knownNames }: { body: string; knownNames: string[] }) {
  return (
    <p className="text-xs text-slate-400 leading-relaxed mt-1.5 whitespace-pre-wrap">
      {splitMentions(body, knownNames).map((seg, i) =>
        seg.mention ? (
          <span key={i} className="text-violet-300 font-medium bg-violet-500/10 rounded px-1">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  );
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

  // FR-2 — reply state is single-slot: only one reply box open at a time.
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  // FR-4 — which top-level threads have expanded past the collapse-at-3 default.
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());

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

  /** Shared by the top-level box and every inline reply box — only the parentId and the small
   * bits of local state (which box to clear, which spinner/error to drive) differ per caller. */
  const postComment = async (
    text: string,
    parentId: number | null,
    opts: {
      setBusy: (v: boolean) => void;
      setError: (v: string | null) => void;
      onSuccess: () => void;
    },
  ) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      opts.setError('Write something before posting.');
      return;
    }
    if (trimmed.length > BODY_MAX) {
      opts.setError(`Comments are capped at ${BODY_MAX} characters.`);
      return;
    }
    opts.setBusy(true);
    opts.setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/api/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          parentCommentId: parentId ?? undefined,
          authorName: authorName.trim() || undefined,
          body: trimmed,
          honeypot,
        }),
      });
      if (res.status === 503) {
        opts.setError('Comments are temporarily disabled.');
        return;
      }
      if (res.status === 429) {
        opts.setError('Too many comments too fast — try again in a few minutes.');
        return;
      }
      if (!res.ok) {
        opts.setError('Could not post — try again.');
        return;
      }
      const data = await res.json() as { id: number; ownerToken: string };
      storeOwnerToken(data.id, data.ownerToken);
      // FR-3 — append locally instead of refetching, so it renders immediately.
      const posted: CommentDTO = {
        id: data.id,
        parentCommentId: parentId,
        authorName: authorName.trim() || null,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...(prev ?? []), posted]);
      opts.onSuccess();
    } catch {
      opts.setError('Could not post — try again.');
    } finally {
      opts.setBusy(false);
    }
  };

  const submit = () =>
    void postComment(body, null, {
      setBusy: setSubmitting,
      setError: setFormError,
      onSuccess: () => setBody(''),
    });

  const submitReply = (parentId: number) =>
    void postComment(replyBody, parentId, {
      setBusy: setReplySubmitting,
      setError: setReplyError,
      onSuccess: () => {
        setReplyBody('');
        setReplyingTo(null);
      },
    });

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

  const threads = comments !== null ? nestComments(comments) : null;

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
          <Button variant="primary" size="sm" icon={Send} disabled={submitting} onClick={submit}>
            Post
          </Button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-[11px] text-rose-400 min-h-[1em]">
          {formError}
        </p>
      </GlassCard>

      {listError && <p className="text-xs text-rose-400">{listError}</p>}

      {threads === null && !listError && (
        <p className="text-xs text-slate-500">Loading comments…</p>
      )}

      {threads !== null && threads.length === 0 && (
        <p className="text-xs text-slate-500">No comments yet — be the first.</p>
      )}

      {threads !== null && threads.length > 0 && (
        <div className="space-y-2">
          {threads.map((c) => {
            const isDeletable = getOwnerToken(c.id) !== null;
            // FR-13 — mentionable names scoped to this one thread, not the whole page.
            const threadNames = [c.authorName, ...c.replies.map((r) => r.authorName)]
              .filter((n): n is string => !!n);
            const expanded = expandedThreads.has(c.id);
            const visibleReplies = expanded ? c.replies : c.replies.slice(0, REPLIES_COLLAPSE_AT);
            const hiddenCount = c.replies.length - visibleReplies.length;

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
                <CommentBody body={c.body} knownNames={threadNames} />

                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === c.id ? null : c.id);
                    setReplyError(null);
                    // Convenience pre-fill — skipped for anonymous authors (no unique name to tag).
                    setReplyBody(replyingTo === c.id ? '' : (c.authorName ? `@${c.authorName} ` : ''));
                  }}
                  className="mt-2 flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <ReplyIcon size={11} /> Reply
                </button>

                {replyingTo === c.id && (
                  <div className="mt-2 pl-3 border-l-2 border-violet-500/20">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={`Reply to ${c.authorName ?? 'this comment'}…`}
                      rows={2}
                      maxLength={BODY_MAX}
                      className="w-full mb-2 px-3 py-2 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:border-violet-500/60 resize-y"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={replySubmitting}
                        onClick={() => submitReply(c.id)}
                      >
                        Post reply
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                    {replyError && <p role="status" aria-live="polite" className="mt-1 text-[11px] text-rose-400">{replyError}</p>}
                  </div>
                )}

                {c.replies.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-slate-700/40 space-y-2">
                    {visibleReplies.map((r) => {
                      const replyDeletable = getOwnerToken(r.id) !== null;
                      return (
                        <div key={r.id}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-slate-300">{r.authorName ?? 'Anonymous'}</p>
                            {replyDeletable && (
                              <button
                                onClick={() => void deleteComment(r.id)}
                                disabled={deletingId === r.id}
                                aria-label="Delete my reply"
                                className="text-slate-600 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">{formatRelativeTime(r.createdAt)}</p>
                          <CommentBody body={r.body} knownNames={threadNames} />
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => setExpandedThreads((prev) => new Set(prev).add(c.id))}
                        className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Show {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                )}
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

