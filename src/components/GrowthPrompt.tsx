import { useEffect, useState } from 'react';
import { Star, MessageCircle, X } from 'lucide-react';

const REPO        = 'https://github.com/ajeetchouksey/ajch_platform';
const LINKEDIN    = 'https://www.linkedin.com/in/ajeet-chouksey-bb365138/';
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
      aria-label="Aarya AI to Grow"
      className="fixed right-4 sm:right-6 top-1/2 z-50 flex flex-col items-center gap-2.5 rounded-2xl py-3 px-2.5"
      style={{
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(71,85,105,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <button
        onClick={() => dismiss()}
        className="text-slate-600 hover:text-slate-300 transition-colors mb-0.5"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>

      {/* Vertical label */}
      <p
        className="text-[8px] font-bold text-violet-400 uppercase tracking-widest select-none"
        style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
      >
        Aarya AI to Grow
      </p>

      <div className="flex flex-col gap-1.5 mt-1">
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          title="Star on GitHub — boosts discoverability"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 hover:bg-yellow-500/15 border border-white/8 hover:border-yellow-500/30 transition-all"
        >
          <Star size={15} className="text-yellow-400" />
        </a>

        <a
          href={LINKEDIN}
          target="_blank"
          rel="noreferrer"
          title="Follow on LinkedIn — posts, videos & resources"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 hover:bg-blue-500/15 border border-white/8 hover:border-blue-500/30 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>

        <button
          onClick={() => {
            dismiss();
            const el = document.querySelector<HTMLElement>('.giscus');
            const main = document.querySelector<HTMLElement>('main');
            if (el && main) {
              main.scrollBy({ top: el.getBoundingClientRect().top - main.getBoundingClientRect().top - 20, behavior: 'smooth' });
            }
          }}
          title="Share your thoughts — jump to community discussion"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 hover:bg-violet-500/15 border border-white/8 hover:border-violet-500/30 transition-all"
        >
          <MessageCircle size={15} className="text-violet-400" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-1 mt-1">
        <button
          onClick={() => dismiss(true)}
          className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors leading-none"
          title="Don't show again"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
