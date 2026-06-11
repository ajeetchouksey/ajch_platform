import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  html_url: string;
}

export interface DeviceFlowState {
  userCode: string;
  verificationUri: string;
  expiresAt: number;   // ms timestamp
  deviceCode: string;
  interval: number;    // seconds between polls
}

interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isLoading: boolean;
  deviceFlow: DeviceFlowState | null;
  login: () => Promise<boolean>;
  loginWithToken: (token: string) => Promise<boolean>;
  cancelDeviceFlow: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'ccaf_gh_token';
const CLIENT_ID = import.meta.env.VITE_GH_CLIENT_ID || '';
const PROXY_URL = (import.meta.env.VITE_GH_OAUTH_PROXY as string | undefined) || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowState | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchUser = useCallback(async (accessToken: string): Promise<GitHubUser | null> => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { login: data.login, avatar_url: data.avatar_url, name: data.name, html_url: data.html_url };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      fetchUser(stored).then((u) => {
        if (u) { setUser(u); setToken(stored); }
        else { sessionStorage.removeItem(STORAGE_KEY); }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [fetchUser]);

  const cancelDeviceFlow = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setDeviceFlow(null);
  }, []);

  // Poll GitHub for token once device flow is active
  useEffect(() => {
    if (!deviceFlow) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() >= deviceFlow.expiresAt) { setDeviceFlow(null); return; }

      try {
        const tokenUrl = PROXY_URL
          ? `${PROXY_URL}/oauth/token`
          : 'https://github.com/login/oauth/access_token';
        const res = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            device_code: deviceFlow.deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        });
        const data = await res.json();

        if (data.access_token) {
          const u = await fetchUser(data.access_token);
          if (u && !cancelled) {
            setUser(u);
            setToken(data.access_token);
            sessionStorage.setItem(STORAGE_KEY, data.access_token);
            setDeviceFlow(null);
          }
        } else if (data.error === 'slow_down') {
          pollTimer.current = setTimeout(poll, (deviceFlow.interval + 5) * 1000);
        } else if (data.error === 'authorization_pending') {
          pollTimer.current = setTimeout(poll, deviceFlow.interval * 1000);
        } else {
          // expired_token, access_denied, unsupported_grant_type
          if (!cancelled) setDeviceFlow(null);
        }
      } catch {
        if (!cancelled) pollTimer.current = setTimeout(poll, deviceFlow.interval * 1000);
      }
    };

    pollTimer.current = setTimeout(poll, deviceFlow.interval * 1000);
    return () => { cancelled = true; if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [deviceFlow, fetchUser]);

  const login = useCallback(async (): Promise<boolean> => {
    if (!CLIENT_ID) return false;
    const deviceCodeUrl = PROXY_URL
      ? `${PROXY_URL}/oauth/device-code`
      : 'https://github.com/login/device/code';
    try {
      const r = await fetch(deviceCodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ client_id: CLIENT_ID, scope: 'gist read:user' }),
      });
      const data = await r.json();
      if (data.device_code) {
        setDeviceFlow({
          userCode: data.user_code,
          verificationUri: data.verification_uri || 'https://github.com/login/device',
          expiresAt: Date.now() + (data.expires_in ?? 900) * 1000,
          deviceCode: data.device_code,
          interval: data.interval ?? 5,
        });
        return true;
      }
      return false;
    } catch {
      return false; // CORS or network error — caller falls back to token input
    }
  }, []);

  const loginWithToken = useCallback(async (pat: string): Promise<boolean> => {
    const u = await fetchUser(pat);
    if (u) {
      setUser(u);
      setToken(pat);
      sessionStorage.setItem(STORAGE_KEY, pat);
      return true;
    }
    return false;
  }, [fetchUser]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(STORAGE_KEY);
    cancelDeviceFlow();
  }, [cancelDeviceFlow]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, deviceFlow, login, loginWithToken, cancelDeviceFlow, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Device flow only needs a client_id — no proxy, no secret
// eslint-disable-next-line react-refresh/only-export-components
export function isOAuthConfigured(): boolean {
  return !!CLIENT_ID;
}