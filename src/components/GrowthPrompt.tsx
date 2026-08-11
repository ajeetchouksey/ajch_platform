import { useEffect, useState } from 'react';
import { Star, MessageCircle, X } from 'lucide-react';

const REPO        = 'https://github.com/ajeetchouksey/ajch_platform';
const LINKEDIN    = 'https://www.linkedin.com/in/ajeet-chouksey-bb365138/';
const SESSION_KEY = 'aarya_gp_seen';
const NEVER_KEY   = 'aarya_gp_never';
// show after 25 s — user has read something meaningful by then
const DELAY_MS    = 25_000;

const LI_SVG = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400 shrink-0" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export function GrowthPrompt() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

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

  const scrollToGiscus = () => {
    const el = document.querySelector<HTMLElement>('.giscus');
    const main = document.querySelector<HTMLElement>('main');
    if (el && main) {
      main.scrollBy({ top: el.getBoundingClientRect().top - main.getBoundingClientRect().top - 20, behavior: 'smooth' });
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Help Aarya to Grow"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        right: '16px',
        top: '50%',
        zIndex: 50,
        borderRadius: '20px',
        overflow: 'hidden',
        width: hovered ? '200px' : '36px',
        background: hovered ? 'rgba(15,23,42,0.82)' : 'rgba(15,23,42,0.22)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: hovered ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(71,85,105,0.15)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.12)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(-50%)' : 'translateY(-50%) translateX(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, width 0.3s ease, background 0.3s ease, border 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      {/* ── Collapsed view: rotated label + icons ── */}
      <div
        style={{
          display: hovered ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 0',
        }}
      >
        <p style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: '7px', fontWeight: 700, color: 'rgba(167,139,250,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', userSelect: 'none', lineHeight: 1 }}>
          Help Aarya to Grow
        </p>
        <Star size={14} className="text-yellow-400/70" />
        {LI_SVG}
        <MessageCircle size={14} className="text-violet-400/70" />
      </div>

      {/* ── Expanded view (hovered) ── */}
      <div style={{ display: hovered ? 'flex' : 'none', flexDirection: 'column', padding: '14px 14px 12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <p style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(167,139,250,0.9)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Help Aarya to Grow</p>
          <button onClick={() => dismiss()} aria-label="Dismiss" style={{ color: 'rgba(100,116,139,0.8)', lineHeight: 1 }} className="hover:text-slate-300 transition-colors">
            <X size={11} />
          </button>
        </div>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>Found this useful?</p>
        <p style={{ fontSize: '10px', color: 'rgba(148,163,184,0.8)', marginBottom: '10px', lineHeight: 1.4 }}>10 seconds helps reach more AI engineers.</p>

        {/* Action rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          <a href={REPO} target="_blank" rel="noreferrer"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/25 transition-all group">
            <Star size={13} className="text-yellow-400 shrink-0" />
            <div>
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#e2e8f0', lineHeight: 1.2 }}>Star on GitHub</p>
              <p style={{ fontSize: '9px', color: 'rgba(100,116,139,0.9)' }}>Boosts discoverability</p>
            </div>
            <span className="ml-auto text-[9px] text-slate-700 group-hover:text-yellow-500/60 transition-colors">↗</span>
          </a>

          <a href={LINKEDIN} target="_blank" rel="noreferrer"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-blue-500/10 border border-transparent hover:border-blue-500/25 transition-all group">
            {LI_SVG}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#e2e8f0', lineHeight: 1.2 }}>Follow on LinkedIn</p>
              <p style={{ fontSize: '9px', color: 'rgba(100,116,139,0.9)' }}>Posts &amp; resources</p>
            </div>
            <span className="ml-auto text-[9px] text-slate-700 group-hover:text-blue-500/60 transition-colors">↗</span>
          </a>

          <button onClick={() => { dismiss(); scrollToGiscus(); }}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-violet-500/10 border border-transparent hover:border-violet-500/25 transition-all group text-left w-full">
            <MessageCircle size={13} className="text-violet-400 shrink-0" />
            <div>
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#e2e8f0', lineHeight: 1.2 }}>Share thoughts</p>
              <p style={{ fontSize: '9px', color: 'rgba(100,116,139,0.9)' }}>Jump to discussion</p>
            </div>
            <span className="ml-auto text-[9px] text-slate-700 group-hover:text-violet-400/60 transition-colors">↓</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => dismiss(true)} className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors">Don't show again</button>
          <button onClick={() => dismiss()} className="text-[9px] text-slate-500 hover:text-white transition-colors">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
