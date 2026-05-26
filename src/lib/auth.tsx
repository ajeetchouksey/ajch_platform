import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  html_url: string;
}

interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isLoading: boolean;
  login: () => void;
  loginWithToken: (token: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'ccaf_gh_token';
const CLIENT_ID = import.meta.env.VITE_GH_CLIENT_ID || '';
const PROXY_URL = import.meta.env.VITE_GH_OAUTH_PROXY || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      fetchUser(stored).then((u) => {
        if (u) { setUser(u); setToken(stored); }
        else { localStorage.removeItem(STORAGE_KEY); }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = useCallback(() => {
    if (!CLIENT_ID || !PROXY_URL) {
      alert('GitHub OAuth not configured. Use "Login with Token" instead.\n\nTo enable: set VITE_GH_CLIENT_ID and VITE_GH_OAUTH_PROXY in .env');
      return;
    }
    window.open(
      `${PROXY_URL}/login?client_id=${CLIENT_ID}&scope=gist,read:user`,
      'gh-auth',
      'width=500,height=700'
    );
  }, []);

  const loginWithToken = useCallback(async (pat: string): Promise<boolean> => {
    const u = await fetchUser(pat);
    if (u) {
      setUser(u);
      setToken(pat);
      localStorage.setItem(STORAGE_KEY, pat);
      return true;
    }
    return false;
  }, [fetchUser]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'gh-oauth-token' && event.data.token) {
        loginWithToken(event.data.token);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [loginWithToken]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isOAuthConfigured(): boolean {
  return !!(CLIENT_ID && PROXY_URL);
}