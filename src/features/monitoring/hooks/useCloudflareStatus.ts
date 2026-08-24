import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';

const PROXY_URL = (import.meta.env.VITE_CF_MONITOR_PROXY_URL as string | undefined) ?? '';

interface Status {
  connected: boolean;
  zoneConfigured: boolean;
  loading: boolean;
  error: string | null;
}

export function useCloudflareStatus() {
  const { token } = useAuth();
  const [status, setStatus] = useState<Status>({ connected: false, zoneConfigured: false, loading: true, error: null });
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!token || !PROXY_URL) {
      setStatus({ connected: false, zoneConfigured: false, loading: false, error: null }); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    let cancelled = false;
    fetch(`${PROXY_URL}/api/cf/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json() as Promise<{ connected: boolean; zoneConfigured: boolean }>)
      .then(d => { if (!cancelled) setStatus({ ...d, loading: false, error: null }); })
      .catch(() => { if (!cancelled) setStatus({ connected: false, zoneConfigured: false, loading: false, error: 'Status check failed' }); });
    return () => { cancelled = true; };
  }, [token, trigger]);

  const refetch = useCallback(() => setTrigger(t => t + 1), []);
  return { ...status, refetch };
}
