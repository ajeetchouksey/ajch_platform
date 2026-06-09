import { useState, useEffect } from 'react';
import { Mail, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui';

type Channel = 'email' | 'gh';
type SubscribeState = 'idle' | 'loading' | 'success' | 'error' | 'already_subscribed';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GH_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

interface GistStats { email_count: number; gh_count: number }

interface SubscribeFormProps {
  compact?: boolean;
  className?: string;
}

export function SubscribeForm({ compact = false, className = '' }: SubscribeFormProps) {
  const workerUrl = import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined;
  const statsGistId = import.meta.env.VITE_STATS_GIST_ID as string | undefined;

  const [channel, setChannel] = useState<Channel>('email');
  const [value, setValue] = useState('');
  const [state, setState] = useState<SubscribeState>('idle');
  const [liveCount, setLiveCount] = useState<number | null>(null);

  useEffect(() => {
    if (!statsGistId) return;
    fetch(
      `https://gist.githubusercontent.com/ajeetchouksey/${statsGistId}/raw/aarya-stats.json`,
      { cache: 'no-store' }
    )
      .then(r => r.json() as Promise<GistStats>)
      .then(d => setLiveCount((d.email_count ?? 0) + (d.gh_count ?? 0)))
      .catch(() => {});
  }, [statsGistId]);

  if (!workerUrl) return null;

  function validate(): boolean {
    if (channel === 'email') return EMAIL_RE.test(value.trim());
    return GH_RE.test(value.trim().replace(/^@/, ''));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setState('loading');
    const sanitized = channel === 'gh' ? value.trim().replace(/^@/, '') : value.trim();
    try {
      const res = await fetch(workerUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: channel === 'gh' ? 'github' : 'email', value: sanitized }),
      });
      if (res.status === 201) {
        setState('success');
        setValue('');
        setLiveCount(c => (c ?? 0) + 1);
      } else if (res.status === 200) {
        setState('already_subscribed');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  function switchChannel(c: Channel) {
    setChannel(c);
    setValue('');
    setState('idle');
  }

  if (state === 'success') {
    return (
      <p className={`text-emerald-400 text-xs ${className}`}>
        {channel === 'email'
          ? "You\u2019re subscribed! Check your inbox."
          : "You\u2019re on the list! You\u2019ll receive a GitHub collaborator invite."}
      </p>
    );
  }

  if (state === 'already_subscribed') {
    return (
      <p className={`text-violet-300 text-xs ${className}`}>
        Already subscribed \u2014 thanks!
      </p>
    );
  }

  const inputCls =
    'bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-100 ' +
    'placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/60 ' +
    'focus:ring-1 focus:ring-violet-500/30 transition-colors';

  const tabBase =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150';
  const tabActive = 'text-white';
  const tabInactive = 'text-slate-500 hover:text-slate-300';

  const tabs = (
    <div className="flex items-center gap-1 mb-3 p-1 rounded-xl w-fit"
      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(71,85,105,0.25)' }}>
      <button type="button" onClick={() => switchChannel('email')}
        className={`${tabBase} ${channel === 'email' ? tabActive : tabInactive}`}
        style={channel === 'email' ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.30)' } : {}}>
        <Mail size={11} /> Email
      </button>
      <button type="button" onClick={() => switchChannel('gh')}
        className={`${tabBase} ${channel === 'gh' ? tabActive : tabInactive}`}
        style={channel === 'gh' ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.30)' } : {}}>
        <GitBranch size={11} /> GitHub
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={className}>
      {!compact && tabs}
      {state === 'error' && (
        <p className="text-red-400 text-xs mb-2">Something went wrong. Please try again.</p>
      )}
      {compact ? (
        <div className="flex flex-wrap items-center gap-2">
          {tabs}
          <input
            type={channel === 'email' ? 'email' : 'text'}
            required
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={channel === 'email' ? 'your@email.com' : '@githubhandle'}
            maxLength={channel === 'email' ? 254 : 39}
            className={`${inputCls} px-3 py-1.5 w-44 min-w-0`}
          />
          <Button type="submit" variant="primary" size="sm" disabled={state === 'loading'}>
            {state === 'loading' ? 'Subscribing\u2026' : 'Subscribe'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type={channel === 'email' ? 'email' : 'text'}
            required
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={channel === 'email' ? 'your@email.com' : '@githubhandle'}
            maxLength={channel === 'email' ? 254 : 39}
            className={`${inputCls} px-4 py-2.5 w-full`}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={state === 'loading'}
            className="w-full justify-center"
          >
            {state === 'loading' ? 'Subscribing\u2026' : 'Subscribe'}
          </Button>
          {liveCount !== null && liveCount > 0 && (
            <p className="text-[11px] text-slate-500 text-center">
              Join <span className="text-violet-400 font-bold">{liveCount.toLocaleString()}</span> subscribers
            </p>
          )}
        </div>
      )}
    </form>
  );
}
