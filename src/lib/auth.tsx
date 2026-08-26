import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Microsoft login is deferred — no Entra app registered yet. Add 'microsoft' back
// here (and to AUTHORIZE_CONFIG below) once that's set up.
export type AuthProviderId = 'github' | 'google';

export interface AppUser {
  provider: AuthProviderId;
  /** GitHub: username. Google: email local-part — a display handle only, not a real identifier. */
  login: string;
  name: string | null;
  avatar_url: string;
  /** GitHub only. */
  html_url?: string;
  /** Google (and GitHub if ever fetched). */
  email?: string;
}

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  login: (provider?: AuthProviderId) => boolean;
  loginWithToken: (token: string, provider?: AuthProviderId) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// GitHub flow: raw GitHub bearer token, re-verified against api.github.com on every mount.
const TOKEN_STORAGE_KEY = 'ccaf_gh_token';
// Google flow: Worker-signed session token + the profile it decodes to (embedded at
// mint time), so mount rehydration is a local JSON.parse — no network round-trip needed.
const PROVIDER_STORAGE_KEY = 'aarya_auth_provider';
const USER_STORAGE_KEY = 'aarya_auth_user';

const CLIENT_ID = import.meta.env.VITE_GH_CLIENT_ID || '';
const PROXY_URL = (import.meta.env.VITE_GH_OAUTH_PROXY as string | undefined) || '';
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';

const AUTHORIZE_CONFIG: Record<Exclude<AuthProviderId, 'github'>, { url: string; clientId: string; scope: string; callbackPath: string }> = {
  google: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
    callbackPath: '/oauth/google/callback',
  },
};

/** Fallback avatar for providers that don't return a picture URL. */
function initialsAvatarDataUri(label: string): string {
  const initials = label
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#6d28d9"/><text x="32" y="42" font-family="sans-serif" font-size="26" fill="#fff" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGitHubUser = useCallback(async (accessToken: string): Promise<AppUser | null> => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { provider: 'github', login: data.login, avatar_url: data.avatar_url, name: data.name, html_url: data.html_url };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const provider = (sessionStorage.getItem(PROVIDER_STORAGE_KEY) as AuthProviderId | null) ?? 'github';

    if (provider === 'github') {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        fetchGitHubUser(stored).then((u) => {
          if (u) { setUser(u); setToken(stored); }
          else { sessionStorage.removeItem(TOKEN_STORAGE_KEY); }
          setIsLoading(false);
        });
        return;
      }
      setIsLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    // Google: session token + decoded profile are both already in sessionStorage
    // (the token's own signature is re-checked server-side on every /profile/* call).
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AppUser);
        setToken(storedToken);
      } catch {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(USER_STORAGE_KEY);
        sessionStorage.removeItem(PROVIDER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, [fetchGitHubUser]);

  /**
   * Initiate an OAuth web flow for the given provider (default GitHub).
   * Generates a CSRF state nonce, stores it + the return path in sessionStorage,
   * then redirects the browser to the provider's authorize endpoint.
   * The Cloudflare Worker exchanges the code for a token server-side and redirects
   * back to /auth/callback#token=...&provider=...
   * Returns false if not configured (GitHub caller falls back to PAT input).
   */
  const login = useCallback((provider: AuthProviderId = 'github'): boolean => {
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_return', window.location.pathname);

    if (provider === 'github') {
      if (!CLIENT_ID || !PROXY_URL) return false;
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        scope: 'gist read:user',
        redirect_uri: `${PROXY_URL}/oauth/callback`,
        state,
      });
      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
      return true;
    }

    const config = AUTHORIZE_CONFIG[provider];
    if (!config.clientId || !PROXY_URL) return false;
    const params = new URLSearchParams({
      client_id: config.clientId,
      scope: config.scope,
      redirect_uri: `${PROXY_URL}${config.callbackPath}`,
      response_type: 'code',
      state,
    });
    window.location.href = `${config.url}?${params.toString()}`;
    return true;
  }, []);

  const loginWithToken = useCallback(async (accessToken: string, provider: AuthProviderId = 'github'): Promise<boolean> => {
    if (provider === 'github') {
      const u = await fetchGitHubUser(accessToken);
      if (!u) return false;
      setUser(u);
      setToken(accessToken);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      sessionStorage.setItem(PROVIDER_STORAGE_KEY, 'github');
      sessionStorage.removeItem(USER_STORAGE_KEY);
      return true;
    }

    // Google: the Worker's signed session token embeds the profile as its payload
    // segment (header.payload.signature) — decode it locally, no network call needed.
    try {
      const payloadSegment = accessToken.split('.')[1];
      const b64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded)) as {
        provider: AuthProviderId; id: string; name: string | null; email?: string; avatar_url: string; exp: number;
      };
      if (!payload.provider || payload.exp * 1000 < Date.now()) return false;
      const u: AppUser = {
        provider: payload.provider,
        login: payload.email ? payload.email.split('@')[0] : payload.id,
        name: payload.name,
        avatar_url: payload.avatar_url || initialsAvatarDataUri(payload.name ?? payload.email ?? payload.id),
        email: payload.email,
      };
      setUser(u);
      setToken(accessToken);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      sessionStorage.setItem(PROVIDER_STORAGE_KEY, provider);
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      return true;
    } catch {
      return false;
    }
  }, [fetchGitHubUser]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(PROVIDER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
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

/** Whether a given provider's OAuth web flow is configured (client_id + proxy URL present). */
// eslint-disable-next-line react-refresh/only-export-components
export function isProviderConfigured(provider: AuthProviderId): boolean {
  if (!PROXY_URL) return false;
  if (provider === 'github') return !!CLIENT_ID;
  return !!AUTHORIZE_CONFIG[provider].clientId;
}

export const OWNER_LOGIN = 'ajeetchouksey';
const DEV_BYPASS_ADMIN_AUTH = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';

/** Single source of truth for "is this the platform owner" across every admin/maintainer page. */
// eslint-disable-next-line react-refresh/only-export-components
export function useIsOwner(): boolean {
  const { user } = useAuth();
  return DEV_BYPASS_ADMIN_AUTH || user?.login === OWNER_LOGIN;
}