import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGitHubStar } from '@/hooks/useGitHubStar';

const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';

// module-level cache — all ContentFeedback instances share one fetch per page load
let _signalCachePromise: Promise<Record<string, number>> | null = null;
function getSignalCounts(): Promise<Record<string, number>> {
  if (!WORKER_URL) return Promise.resolve({});
  _signalCachePromise ??= fetch(`${WORKER_URL}/api/signal/total`)
    .then(r => r.json() as Promise<{ byContent: Record<string, number> }>)
    .then(d => d.byContent ?? {})
    .catch(() => ({}));
  return _signalCachePromise;
}

interface ContentFeedbackProps {
  contentId: string;
  /** slim single-line variant for sidebars */
  compact?: boolean;
}

type Vote = 'up' | 'down' | null;

function storageKey(id: string) {
  return `aarya_fb_${id}`;
}

export function ContentFeedback({ contentId, compact = false }: ContentFeedbackProps) {
  const [vote, setVote] = useState<Vote>(
    () => (localStorage.getItem(storageKey(contentId)) as Vote) ?? null
  );
  const { starRepo } = useGitHubStar();
  const [signalCount, setSignalCount] = useState(0);
  useEffect(() => {
    getSignalCounts().then(counts => setSignalCount(counts[contentId] ?? 0)).catch(() => {});
  }, [contentId]);

  const postSignal = (id: string) =>
    WORKER_URL
      ? fetch(`${WORKER_URL}/api/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentId: id }),
        }).catch(() => {})
      : Promise.resolve();

  const cast = (v: 'up' | 'down') => {
    if (vote === v) return;
    setVote(v);
    localStorage.setItem(storageKey(contentId), v);
    if (v === 'up') {
      localStorage.setItem(`aarya_star_${contentId}`, '1');
      void postSignal(contentId); // anonymous signal to Worker (all users)
      void starRepo();             // real GitHub star (auth users only, no-op otherwise)
    } else {
      localStorage.removeItem(`aarya_star_${contentId}`);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(71,85,105,0.18)' }}>
        <span className="text-[11px] text-slate-500 mr-1 shrink-0">Helpful?</span>
        <button
          onClick={() => cast('up')}
          aria-label="Helpful"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
            vote === 'up'
              ? 'bg-emerald-700/30 text-emerald-300'
              : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-700/15'
          }`}
        >
          <ThumbsUp size={12} className={vote === 'up' ? 'fill-emerald-400' : ''} />
          Yes
        </button>
        <button
          onClick={() => cast('down')}
          aria-label="Not helpful"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
            vote === 'down'
              ? 'bg-rose-700/30 text-rose-300'
              : 'text-slate-500 hover:text-rose-400 hover:bg-rose-700/15'
          }`}
        >
          <ThumbsDown size={12} className={vote === 'down' ? 'fill-rose-400' : ''} />
          No
        </button>
        {vote && (
          <span className="text-[10px] text-slate-600 ml-1">Thanks!</span>
        )}
        {!vote && signalCount > 0 && (
          <span className="text-[10px] text-slate-600 ml-1">{signalCount} helpful</span>
        )}
      </div>
    );
  }

  // Full inline variant
  return (
    <div className="my-8 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(71,85,105,0.2)' }}>

      {!vote ? (
        <>
          <div>
            <p className="text-sm font-medium text-slate-300">Was this helpful?</p>
            {signalCount > 0 && (
              <p className="text-[11px] text-slate-600 mt-0.5">{signalCount} {signalCount === 1 ? 'person' : 'people'} found this helpful</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => cast('up')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all
                text-slate-400 border-slate-700 hover:bg-emerald-700/20 hover:text-emerald-300 hover:border-emerald-700/50"
            >
              <ThumbsUp size={15} /> Yes, it helped
            </button>
            <button
              onClick={() => cast('down')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all
                text-slate-400 border-slate-700 hover:bg-rose-700/20 hover:text-rose-300 hover:border-rose-700/50"
            >
              <ThumbsDown size={15} /> Needs work
            </button>
          </div>
        </>
      ) : vote === 'up' ? (
        <>
          <ThumbsUp size={20} className="text-emerald-400 fill-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Glad it helped!</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {signalCount > 1
                ? `${signalCount} people found this helpful — thanks for the signal!`
                : 'Your feedback helps us keep improving the platform.'}
            </p>
          </div>
        </>
      ) : (
        <>
          <ThumbsDown size={20} className="text-amber-400 fill-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Thanks for the honest feedback.</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tell us more in the discussion below —{' '}
              <button
                onClick={() => {
                  const el = document.querySelector<HTMLElement>('.giscus');
                  const main = document.querySelector<HTMLElement>('main');
                  if (el && main) {
                    main.scrollBy({ top: el.getBoundingClientRect().top - main.getBoundingClientRect().top - 20, behavior: 'smooth' });
                  } else {
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="text-amber-400 hover:underline"
              >
                <MessageCircle size={11} className="inline mr-0.5 -mt-0.5" />
                jump to comments
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
