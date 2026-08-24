import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

const PROXY_URL = (import.meta.env.VITE_CF_MONITOR_PROXY_URL as string | undefined) ?? '';

export interface CfZoneTraffic {
  requests: number;
  bytes: number;
  cachedRequests: number;
  cachedBytes: number;
  threats: number;
  cacheHitRatio: number;
}

export interface CfWorkerStat {
  scriptName: string;
  requests: number;
  errors: number;
  errorRate: number;
  cpuTimeP50Ms: number;
  cpuTimeP99Ms: number;
}

export interface CfOverview {
  zone: CfZoneTraffic | null;
  workers: CfWorkerStat[];
  since: string;
  until: string;
}

interface State {
  data: CfOverview | null;
  loading: boolean;
  error: string | null;
}

export function useCloudflareOverview(range: '7d' | '28d' | '90d') {
  const { token } = useAuth();
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!token || !PROXY_URL) return;
    let cancelled = false;
    const controller = new AbortController();
    setState(s => ({ ...s, loading: true })); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`${PROXY_URL}/api/cf/overview?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`Cloudflare error ${res.status}`);
        return res.json() as Promise<CfOverview>;
      })
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch(err => {
        if (!cancelled && err.name !== 'AbortError') {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Failed' });
        }
      });
    return () => { cancelled = true; controller.abort(); };
  }, [range, token, trigger]);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);
  return { ...state, refetch };
}
