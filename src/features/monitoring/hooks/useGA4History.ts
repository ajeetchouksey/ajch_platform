import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { ga4ErrorMessage } from './ga4Error';

const PROXY_URL = (import.meta.env.VITE_GA4_PROXY_URL as string | undefined) ?? '';

export interface GA4HistoryRow {
  date: string; // YYYY-MM-DD
  sessions: number;
  users: number;
  pageviews: number;
  engagement_rate: number;
  avg_duration_secs: number;
  bounce_rate: number;
  updated_at: string;
}

interface State {
  rows: GA4HistoryRow[] | null;
  loading: boolean;
  error: string | null;
}

/** Reads the persisted daily series from ANALYTICS_DB (D1) — no live GA4 call, no KV, always fresh via the daily cron. */
export function useGA4History(start: string | null, end: string | null) {
  const { token } = useAuth();
  const [state, setState] = useState<State>({ rows: null, loading: false, error: null });
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!start || !end || !token || !PROXY_URL) return;
    let cancelled = false;
    const controller = new AbortController();
    fetch(`${PROXY_URL}/api/ga/history?start=${start}&end=${end}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok) throw new Error(await ga4ErrorMessage(res));
        return res.json() as Promise<{ rows: GA4HistoryRow[] }>;
      })
      .then(data => { if (!cancelled) setState({ rows: data.rows, loading: false, error: null }); })
      .catch(err => {
        if (!cancelled && err.name !== 'AbortError') {
          setState({ rows: null, loading: false, error: err instanceof Error ? err.message : 'Failed' });
        }
      });
    return () => { cancelled = true; controller.abort(); };
  }, [start, end, token, trigger]);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);
  return { ...state, refetch };
}
