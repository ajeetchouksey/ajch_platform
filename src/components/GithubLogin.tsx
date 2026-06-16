import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Key, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { useAuth, isOAuthConfigured } from '@/lib/auth';

/** Compact trust / privacy assurance shown in sign-in panels. */
function TrustBadge() {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/30">
      <ShieldCheck size={13} className="text-emerald-400 shrink-0 mt-0.5" />
      <div className="text-[10px] leading-relaxed text-slate-400 space-y-0.5">
        <p><span className="text-emerald-400 font-medium">We will:</span> read your public name &amp; avatar, save quiz scores to a private Gist you own.</p>
        <p><span className="text-slate-500 font-medium">We will not:</span> access code, repos, emails, or DMs.</p>
      </div>
    </div>
  );
}

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

export function GithubLogin() {
  const { user, isLoading, login, loginWithToken, logout } = useAuth();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [error, setError] = useState('');

  if (isLoading) return <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 group" title="My Profile">
          <div className="relative shrink-0">
            <img src={user.avatar_url} alt={user.login} className="w-7 h-7 rounded-full ring-1 ring-slate-700 group-hover:ring-violet-500/50 transition-all duration-200" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <span className="text-sm text-slate-200 hidden sm:inline">{user.name || user.login}</span>
        </Link>
        <button onClick={logout} className="p-1 text-slate-400 hover:text-red-400 transition-colors" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // ── PAT token input ────────────────────────────────────────────────────────
  if (showTokenInput) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[199] bg-black/60 backdrop-blur-sm"
          onClick={() => { setShowTokenInput(false); setError(''); setTokenValue(''); }}
          aria-hidden="true"
        />
        {/* Centered panel */}
        <div className="fixed left-1/2 top-16 -translate-x-1/2 z-[200] w-[22rem] max-h-[calc(100vh-5rem)] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <GithubIcon size={14} /> Sign in with GitHub
            </span>
            <button
              onClick={() => { setShowTokenInput(false); setError(''); setTokenValue(''); }}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Save your quiz scores across devices with a free GitHub token.
            </p>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-950/40 border border-violet-800/30">
              <span className="shrink-0 w-4 h-4 rounded-full bg-violet-700 text-white text-[9px] font-bold flex items-center justify-center mt-0.5">1</span>
              <div>
                <p className="text-[11px] text-slate-300 font-medium mb-0.5">Create a GitHub token</p>
                <a
                  href="https://github.com/settings/tokens/new?scopes=gist,read:user&description=Aarya+Learning+Hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <ExternalLink size={10} /> Open GitHub → create token
                </a>
                <p className="text-[10px] text-slate-500 mt-0.5">Scopes pre-filled: gist, read:user</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[9px] font-bold flex items-center justify-center mt-1">2</span>
              <div className="flex-1">
                <p className="text-[11px] text-slate-300 font-medium mb-1">Paste token here</p>
                <input
                  type="password"
                  value={tokenValue}
                  onChange={(e) => { setTokenValue(e.target.value); setError(''); }}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-600 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
            {/* Trust assurance */}
            <TrustBadge />

            <button
              onClick={async () => {
                if (!tokenValue.trim()) return;
                const ok = await loginWithToken(tokenValue.trim());
                if (!ok) setError('Invalid token — check the token and scopes');
                else { setTokenValue(''); setShowTokenInput(false); }
              }}
              className="w-full px-3 py-2 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-semibold"
            >
              Sign in
            </button>
            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>
        </div>
      </>
    );
  }

  // ── Default: idle login buttons ────────────────────────────────────────────
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => {
          if (isOAuthConfigured()) {
            const started = login();
            if (!started) setShowTokenInput(true);
          } else {
            setShowTokenInput(true);
          }
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
        title={isOAuthConfigured() ? 'Login with GitHub OAuth' : 'Login with Token'}
      >
        <GithubIcon size={14} />
        <span className="hidden sm:inline">Login</span>
      </button>
      {isOAuthConfigured() && (
        <button
          onClick={() => setShowTokenInput(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          title="Login with Personal Access Token"
        >
          <Key size={14} />
        </button>
      )}
    </div>
  );
}
