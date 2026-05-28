/**
 * GitHub public API helpers.
 *
 * ⚠️  SECURITY NOTE: VITE_GH_TOKEN is embedded in the JS bundle and visible
 * in browser DevTools. Use ONLY a fine-grained PAT with NO repository
 * permissions and NO OAuth scopes — for public-endpoint rate-limit uplift only
 * (60 → 5000 req/hr). A classic PAT must NOT be used.
 *
 * Create token: https://github.com/settings/personal-access-tokens/new
 * Set ALL permissions to "No access".
 */

const GH_USER = 'ajeetchouksey';
const GH_REPO = 'ajch_platform';
// ⚠️  Read security note above before setting this token.
const GH_TOKEN = import.meta.env.VITE_GH_TOKEN as string | undefined;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> { data: T; ts: number; }

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return entry.data;
  } catch { return null; }
}

function writeCache<T>(key: string, data: T): void {
  try {
    // ⚠️  Never cache the token — only the response data + timestamp.
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch { /* sessionStorage unavailable (e.g., incognito with storage blocked) */ }
}

function ghHeaders(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
  if (GH_TOKEN) h['Authorization'] = `Bearer ${GH_TOKEN}`;
  return h;
}

/** Validate that a URL uses http/https — guards against javascript: URI injection (OWASP A03). */
export function safeUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  return /^https?:\/\//i.test(raw) ? raw : undefined;
}

export interface GitHubUserStats {
  followers: number;
  publicRepos: number;
  avatarUrl: string;
  profileUrl: string;
}

export interface GitHubRepoStats {
  stars: number;
  watchers: number;
  forks: number;
  openIssues: number;
}

export async function fetchGitHubUser(): Promise<GitHubUserStats | null> {
  const CACHE_KEY = 'gh_user_stats';
  const cached = readCache<GitHubUserStats>(CACHE_KEY);
  if (cached) return cached;
  try {
    const res = await fetch(`https://api.github.com/users/${GH_USER}`, { headers: ghHeaders() });
    if (!res.ok) return null;
    const d = await res.json();
    const stats: GitHubUserStats = {
      followers:   d.followers   ?? 0,
      publicRepos: d.public_repos ?? 0,
      // safeUrl validates protocol to prevent javascript: injection
      avatarUrl:   safeUrl(d.avatar_url)  ?? '',
      profileUrl:  safeUrl(d.html_url)    ?? `https://github.com/${GH_USER}`,
    };
    writeCache(CACHE_KEY, stats);
    return stats;
  } catch { return null; }
}

export async function fetchGitHubRepo(): Promise<GitHubRepoStats | null> {
  const CACHE_KEY = 'gh_repo_stats';
  const cached = readCache<GitHubRepoStats>(CACHE_KEY);
  if (cached) return cached;
  try {
    const res = await fetch(`https://api.github.com/repos/${GH_USER}/${GH_REPO}`, { headers: ghHeaders() });
    if (!res.ok) return null;
    const d = await res.json();
    const stats: GitHubRepoStats = {
      stars:      d.stargazers_count  ?? 0,
      watchers:   d.subscribers_count ?? 0,
      forks:      d.forks_count       ?? 0,
      openIssues: d.open_issues_count ?? 0,
    };
    writeCache(CACHE_KEY, stats);
    return stats;
  } catch { return null; }
}
