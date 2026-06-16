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
  login: () => boolean;
  loginWithToken: (token: string) => Promise<boolean>;
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

  /**
   * Initiate GitHub OAuth web flow.
   * Generates a CSRF state nonce, stores it + the return path in sessionStorage,
   * then redirects the browser to GitHub's authorize endpoint.
   * The Cloudflare Worker at /oauth/callback exchanges the code for a token
   * and redirects back to /auth/callback#token=...
   * Returns false if not configured (caller falls back to PAT input).
   */
  const login = useCallback((): boolean => {
    if (!CLIENT_ID || !PROXY_URL) return false;
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_return', window.location.pathname);
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'gist read:user',
      redirect_uri: `${PROXY_URL}/oauth/callback`,
      state,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return true;
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithToken, logout }}>
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

// Standard OAuth web flow requires both client_id and the proxy Worker URL.
// eslint-disable-next-line react-refresh/only-export-components
export function isOAuthConfigured(): boolean {
  return !!CLIENT_ID && !!PROXY_URL;
}