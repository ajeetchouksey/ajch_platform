import { useState } from 'react';
import { Button } from '@/components/ui';

type SubscribeState = 'idle' | 'loading' | 'success' | 'error' | 'already_subscribed';

interface SubscribeFormProps {
  compact?: boolean;
  className?: string;
}

export function SubscribeForm({ compact = false, className = '' }: SubscribeFormProps) {
  const formId = import.meta.env.VITE_CONVERTKIT_FORM_ID as string | undefined;
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [state, setState] = useState<SubscribeState>('idle');

  if (!formId) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    try {
      const params = new URLSearchParams({ email });
      if (firstName) params.set('first_name', firstName);
      const res = await fetch(
        `https://app.convertkit.com/forms/${formId}/subscriptions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        }
      );
      if (res.ok) {
        setState('success');
        setEmail('');
        setFirstName('');
      } else if (res.status === 422) {
        setState('already_subscribed');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <p className={`text-emerald-400 text-xs ${className}`}>
        You&rsquo;re subscribed! Check your inbox.
      </p>
    );
  }

  if (state === 'already_subscribed') {
    return (
      <p className={`text-violet-300 text-xs ${className}`}>
        You&rsquo;re already subscribed &mdash; thanks!
      </p>
    );
  }

  const inputCls =
    'bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-100 ' +
    'placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/60 ' +
    'focus:ring-1 focus:ring-violet-500/30 transition-colors';

  return (
    <form onSubmit={handleSubmit} className={className}>
      {state === 'error' && (
        <p className="text-red-400 text-xs mb-2">Something went wrong. Please try again.</p>
      )}
      {compact ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={`${inputCls} px-3 py-1.5 w-44 min-w-0`}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={state === 'loading'}
          >
            {state === 'loading' ? 'Subscribing\u2026' : 'Subscribe'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={`${inputCls} px-4 py-2.5 w-full`}
          />
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name (optional)"
            maxLength={80}
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
        </div>
      )}
    </form>
  );
}
