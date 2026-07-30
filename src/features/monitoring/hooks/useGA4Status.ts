import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

const PROXY_URL = (import.meta.env.VITE_GA4_PROXY_URL as string | undefined) ?? '';

export type GA4ConnectionMethod = 'service_account' | 'oauth' | 'none';

interface Status {
  connected: boolean;
  method: GA4ConnectionMethod;
  loading: boolean;
  error: string | null;
}

export function useGA4Status() {
  const { token } = useAuth();
  const [status, setStatus] = useState<Status>({ connected: false, method: 'none', loading: true, error: null });
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!token || !PROXY_URL) {
      setStatus({ connected: false, method: 'none', loading: false, error: null }); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    let cancelled = false;
    fetch(`${PROXY_URL}/api/ga/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json() as Promise<{ connected: boolean; method: GA4ConnectionMethod }>)
      .then(d => { if (!cancelled) setStatus({ ...d, loading: false, error: null }); })
      .catch(() => { if (!cancelled) setStatus({ connected: false, method: 'none', loading: false, error: 'Status check failed' }); });
    return () => { cancelled = true; };
  }, [token, trigger]);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);
  return { ...status, refetch };
}
