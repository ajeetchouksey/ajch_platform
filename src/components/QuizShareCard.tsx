/**
 * QuizShareCard — Issue #62
 * Post-quiz score share card with LinkedIn/Twitter share buttons and
 * ConvertKit email subscribe (public form — no API key in bundle).
 *
 * Required env var (public, safe to bundle):
 *   VITE_CONVERTKIT_FORM_ID=<your_form_numeric_id>
 */
import { useState } from 'react';
import { Share2, Mail, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';

// ── Next-track cross-sell map ─────────────────────────────────────────────────
const NEXT_TRACKS: Record<string, { id: string; title: string; href: string; color: string }[]> = {
  ccaf:  [{ id: 'ab100', title: 'Agentic AI Business Architect (AB-100)', href: '/skillup/ab100', color: '#1d4ed8' },
          { id: 'ghbp', title: 'GitHub Engineering Best Practices (GH-BP)', href: '/skillup/ghbp', color: '#16a34a' }],
  ab100: [{ id: 'ccaf', title: 'Claude Certified Architect – Foundations (CCA-F)', href: '/skillup/ccaf', color: '#7c3aed' },
          { id: 'ghbp', title: 'GitHub Engineering Best Practices (GH-BP)', href: '/skillup/ghbp', color: '#16a34a' }],
  ghbp:  [{ id: 'ccaf', title: 'Claude Certified Architect – Foundations (CCA-F)', href: '/skillup/ccaf', color: '#7c3aed' },
          { id: 'ab100', title: 'Agentic AI Business Architect (AB-100)', href: '/skillup/ab100', color: '#1d4ed8' }],
};

// ── ConvertKit config ─────────────────────────────────────────────────────────
// VITE_CONVERTKIT_FORM_ID must be set in .env — it is a public numeric ID,
// no private key is involved; submission is via the public form endpoint only.
const CK_FORM_ID = import.meta.env.VITE_CONVERTKIT_FORM_ID as string | undefined;

interface Props {
  score: number;
  total: number;
  pct: number;
  examShortTitle: string;
  examId: string;
  passed: boolean;
}

export default function QuizShareCard({ score, total, pct, examShortTitle, examId, passed }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subState, setSubState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Share text ──────────────────────────────────────────────────────────────
  const badge = passed ? '🏆 Passed' : '📊 Score';
  const shareText = `${badge}: ${pct}% (${score}/${total}) on the ${examShortTitle} practice exam — sharpening my AI skills on Aarya AI Learning Hub! #AISkills #${examShortTitle.replace(/[^A-Za-z0-9]/g, '')}`;
  const shareUrl  = `https://aaryaai.dev/skillup/${examId}`;

  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
  const twitterHref  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  // ── Email subscribe (ConvertKit public form) ────────────────────────────────
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!CK_FORM_ID) {
      setErrorMsg('Newsletter not yet configured.');
      setSubState('error');
      return;
    }
    setSubState('loading');
    try {
      const body = new URLSearchParams({ email_address: email, first_name: name });
      const res = await fetch(
        `https://app.convertkit.com/forms/${CK_FORM_ID}/subscriptions`,
        { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      if (!res.ok) throw new Error('Subscribe failed');
      setSubState('done');
    } catch {
      setErrorMsg('Something went wrong — please try again.');
      setSubState('error');
    }
  };

  const nextTracks = (NEXT_TRACKS[examId] ?? []).slice(0, 1);

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: passed
          ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.95) 60%)'
          : 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(15,23,42,0.95) 60%)',
        border: passed
          ? '1px solid rgba(52,211,153,0.22)'
          : '1px solid rgba(245,158,11,0.22)',
      }}
    >
      {/* ── Score headline ───────────────────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {examShortTitle} Practice Result
        </p>
        <div className="flex items-end justify-center gap-1.5">
          <span
            className="text-5xl font-black tabular-nums"
            style={{ color: passed ? '#34d399' : '#fbbf24' }}
          >
            {pct}%
          </span>
          <span className="text-slate-500 text-sm pb-2">
            {score}/{total} correct
          </span>
        </div>
        <p className="text-xs font-semibold" style={{ color: passed ? '#34d399' : '#fbbf24' }}>
          {passed ? '🏆 You passed! Keep the momentum.' : '📈 Good effort — review weak domains and try again.'}
        </p>
      </div>

      {/* ── Share buttons ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1.5">
          <Share2 size={9} /> Share your result
        </p>
        <div className="flex gap-2">
          <a
            href={linkedInHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(10,102,194,0.15)', border: '1px solid rgba(10,102,194,0.35)', color: '#60a5fa' }}
          >
            <ExternalLink size={13} /> LinkedIn
          </a>
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(29,161,242,0.10)', border: '1px solid rgba(29,161,242,0.30)', color: '#38bdf8' }}
          >
            <ExternalLink size={13} /> X / Twitter
          </a>
        </div>
      </div>

      {/* ── Email subscribe ───────────────────────────────────────────────────── */}
      {subState !== 'done' ? (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1.5">
            <Mail size={9} /> Get weekly AI learning tips
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <input
              type="text"
              placeholder="First name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-colors"
              maxLength={80}
              autoComplete="given-name"
            />
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-colors"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={subState === 'loading'}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'rgba(139,92,246,0.20)', border: '1px solid rgba(139,92,246,0.40)', color: '#a78bfa' }}
              >
                {subState === 'loading' ? '…' : 'Subscribe'}
              </button>
            </div>
            {subState === 'error' && (
              <p className="text-rose-400 text-[10px]">{errorMsg}</p>
            )}
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
          <CheckCircle size={14} /> You're subscribed — great choice!
        </div>
      )}

      {/* ── Next track nudge ─────────────────────────────────────────────────── */}
      {nextTracks.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
            What's next?
          </p>
          {nextTracks.map(track => (
            <a
              key={track.id}
              href={track.href}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl group transition-all hover:scale-[1.01]"
              style={{
                background: `rgba(${hexToRgb(track.color)},0.08)`,
                border: `1px solid rgba(${hexToRgb(track.color)},0.22)`,
              }}
            >
              <span className="text-xs text-slate-300">{track.title}</span>
              <ArrowRight size={13} className="shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
