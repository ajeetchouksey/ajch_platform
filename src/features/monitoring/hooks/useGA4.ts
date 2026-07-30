import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

const PROXY_URL = (import.meta.env.VITE_GA4_PROXY_URL as string | undefined) ?? '';

export interface GA4ReportRequest {
  dateRange: { startDate: string; endDate: string };
  dimensions: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: unknown;
  orderBys?: unknown[];
  limit?: number;
}

export interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

export interface GA4ReportResult {
  rows?: GA4Row[];
  rowCount?: number;
}

interface State {
  data: GA4ReportResult | null;
  loading: boolean;
  error: string | null;
}

export function useGA4(request: GA4ReportRequest | null) {
  const { token } = useAuth();
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!request || !token || !PROXY_URL) return;
    let cancelled = false;
    const controller = new AbortController();
    fetch(`${PROXY_URL}/api/ga/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`GA4 error ${res.status}`);
        return res.json() as Promise<GA4ReportResult>;
      })
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch(err => {
        if (!cancelled && err.name !== 'AbortError') {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Failed' });
        }
      });
    return () => { cancelled = true; controller.abort(); };
  }, [request, token, trigger]);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);
  return { ...state, refetch };
}
