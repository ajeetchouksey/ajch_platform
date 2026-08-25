import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { ga4ErrorMessage } from './ga4Error';

const PROXY_URL = (import.meta.env.VITE_GA4_PROXY_URL as string | undefined) ?? '';

export interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

export interface GA4CohortResult {
  rows?: GA4Row[];
}

interface State {
  data: GA4CohortResult | null;
  loading: boolean;
  error: string | null;
}

/** Weekly retention curve (GA4 native cohortSpec report) — see runCohortReport() in workers/ga4-proxy.ts. */
export function useGA4Retention(since: string) {
  const { token } = useAuth();
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!since || !token || !PROXY_URL) return;
    let cancelled = false;
    const controller = new AbortController();
    fetch(`${PROXY_URL}/api/ga/retention?since=${since}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok) throw new Error(await ga4ErrorMessage(res));
        return res.json() as Promise<GA4CohortResult>;
      })
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch(err => {
        if (!cancelled && err.name !== 'AbortError') {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Failed' });
        }
      });
    return () => { cancelled = true; controller.abort(); };
  }, [since, token, trigger]);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);
  return { ...state, refetch };
}
