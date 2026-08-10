import { useEffect, useState } from 'react';
import { Star, MessageCircle, X } from 'lucide-react';

const REPO        = 'https://github.com/ajeetchouksey/ajch_platform';
const LINKEDIN    = 'https://www.linkedin.com/in/ajeet-chouksey-bb365138/';
const DISCUSS     = 'https://github.com/ajeetchouksey/ajch_platform/discussions';
const SESSION_KEY = 'aarya_gp_seen';
const NEVER_KEY   = 'aarya_gp_never';
// show after 25 s — user has read something meaningful by then
const DELAY_MS    = 25_000;

export function GrowthPrompt() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(NEVER_KEY)) return;
    const id = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;

  const dismiss = (permanent = false) => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
    if (permanent) localStorage.setItem(NEVER_KEY, '1');
    setTimeout(() => setMounted(false), 320);
  };

  return (
    <div
      role="dialog"
      aria-label="Help Aarya grow"
      className="fixed bottom-6 right-4 sm:right-6 z-50 w-72 rounded-2xl bg-slate-900 border border-slate-700/70 shadow-2xl p-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <button
        onClick={() => dismiss()}
        className="absolute top-3 right-3 text-slate-600 hover:text-slate-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>

      <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-0.5">Help Aarya Grow</p>
      <p className="text-sm font-semibold text-white mb-1">Found this useful?</p>
      <p className="text-[12px] text-slate-400 leading-relaxed mb-3 pr-4">
        10 seconds helps this platform reach more AI engineers.
      </p>

      <div className="flex flex-col gap-1.5 mb-3">
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-yellow-500/10 border border-slate-700/50 hover:border-yellow-500/30 transition-all group"
        >
          <Star size={14} className="text-yellow-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white leading-tight">Star on GitHub</p>
            <p className="text-[10px] text-slate-500">Boosts discoverability</p>
          </div>
          <span className="text-[10px] text-slate-600 group-hover:text-yellow-500/70 transition-colors">↗</span>
        </a>

        <a
          href={LINKEDIN}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-blue-500/10 border border-slate-700/50 hover:border-blue-500/30 transition-all group"
        >
          {/* LinkedIn has no lucide icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400 shrink-0" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white leading-tight">Follow on LinkedIn</p>
            <p className="text-[10px] text-slate-500">Posts, videos &amp; resources</p>
          </div>
          <span className="text-[10px] text-slate-600 group-hover:text-blue-500/70 transition-colors">↗</span>
        </a>

        <a
          href={DISCUSS}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-violet-500/10 border border-slate-700/50 hover:border-violet-500/30 transition-all group"
        >
          <MessageCircle size={14} className="text-violet-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white leading-tight">Share your thoughts</p>
            <p className="text-[10px] text-slate-500">What would you like to see next?</p>
          </div>
          <span className="text-[10px] text-slate-600 group-hover:text-violet-400/70 transition-colors">↗</span>
        </a>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => dismiss(true)}
          className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          Don't show again
        </button>
        <button
          onClick={() => dismiss()}
          className="text-[10px] text-slate-400 hover:text-white transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
