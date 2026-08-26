import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { ga4ErrorMessage } from './ga4Error';

const PROXY_URL = (import.meta.env.VITE_GA4_PROXY_URL as string | undefined) ?? '';
const POLL_INTERVAL = 60_000;

export interface RealtimeData {
  rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
}

interface State {
  data: RealtimeData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useGA4Realtime(paused = false) {
  const { token } = useAuth();
  const [state, setState] = useState<State>({ data: null, loading: false, error: null, lastUpdated: null });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    if (!token || !PROXY_URL) return;
    setState(s => ({ ...s, loading: !s.data })); // only show loading on first fetch
    try {
      const res = await fetch(`${PROXY_URL}/api/ga/realtime`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await ga4ErrorMessage(res));
      const data: RealtimeData = await res.json();
      setState({ data, loading: false, error: null, lastUpdated: new Date() });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'Failed' }));
    }
  };

  useEffect(() => {
    if (paused || !token) return;
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [token, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
