import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, ExternalLink, X, ShieldCheck, ChevronRight, KeyRound } from 'lucide-react';
import { useAuth, isOAuthConfigured, isProviderConfigured, type AuthProviderId } from '@/lib/auth';

/** Compact trust / privacy assurance shown in sign-in panels. */
function TrustBadge() {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/30">
      <ShieldCheck size={13} className="text-emerald-400 shrink-0 mt-0.5" />
      <div className="text-[10px] leading-relaxed text-slate-400 space-y-0.5">
        <p><span className="text-emerald-400 font-medium">We will:</span> read your public name &amp; avatar, save your quiz scores to your account, synced across devices.</p>
        <p><span className="text-slate-500 font-medium">We will not:</span> access code, repos, emails, or DMs.</p>
      </div>
    </div>
  );
}

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z"/>
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 010-4.54V6.62H1.27a12 12 0 000 10.76l4-3.11z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"/>
    </svg>
  );
}

// Microsoft login is deferred (see AuthProviderId in auth.tsx) — add an icon + entry
// here once an Entra app registration exists.
const PROVIDER_META: Record<AuthProviderId, { label: string; icon: (props: { size?: number }) => React.JSX.Element }> = {
  github: { label: 'GitHub', icon: GithubIcon },
  google: { label: 'Google', icon: GoogleIcon },
};

/** Shared backdrop + centered panel shell used by both the provider picker and the PAT panel. */
function SignInPanel({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[199] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed left-1/2 top-16 -translate-x-1/2 z-[200] w-[22rem] max-h-[calc(100vh-5rem)] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            {icon} {title}
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">{children}</div>
      </div>
    </>
  );
}

export function LoginWidget() {
  const { user, isLoading, login, loginWithToken, logout } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [error, setError] = useState('');

  const closeAll = () => { setShowPicker(false); setShowTokenInput(false); setError(''); setTokenValue(''); };

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

  // ── PAT token input (GitHub only) ──────────────────────────────────────────
  if (showTokenInput) {
    return (
      <SignInPanel title="Sign in with GitHub" icon={<GithubIcon size={14} />} onClose={closeAll}>
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
        <TrustBadge />
        <p className="text-[10px] text-slate-500 -mt-1">Progress is saved to a private GitHub Gist you own.</p>

        <button
          onClick={async () => {
            if (!tokenValue.trim()) return;
            const ok = await loginWithToken(tokenValue.trim(), 'github');
            if (!ok) setError('Invalid token — check the token and scopes');
            else closeAll();
          }}
          className="w-full px-3 py-2 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-semibold"
        >
          Sign in
        </button>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
        <button
          onClick={() => { setShowTokenInput(false); setShowPicker(true); }}
          className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to sign-in options
        </button>
      </SignInPanel>
    );
  }

  // ── Provider picker ──────────────────────────────────────────────────────
  if (showPicker) {
    const providers: AuthProviderId[] = (['github', 'google'] as const)
      .filter((p) => p === 'github' || isProviderConfigured(p));

    return (
      <SignInPanel title="Sign in to Aarya" icon={<LogIn size={14} />} onClose={closeAll}>
        <div className="space-y-2">
          {providers.map((provider) => {
            const { label, icon: Icon } = PROVIDER_META[provider];
            return (
              <button
                key={provider}
                onClick={() => {
                  if (provider === 'github' && !isOAuthConfigured()) {
                    setShowPicker(false);
                    setShowTokenInput(true);
                    return;
                  }
                  const started = login(provider);
                  if (!started && provider === 'github') {
                    setShowPicker(false);
                    setShowTokenInput(true);
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-violet-500/40 text-sm text-slate-200 transition-colors"
              >
                <Icon size={16} />
                <span className="flex-1 text-left">Continue with {label}</span>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            );
          })}
        </div>

        <TrustBadge />

        <button
          onClick={() => { setShowPicker(false); setShowTokenInput(true); }}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors pt-1"
        >
          <KeyRound size={11} /> Use a GitHub personal access token instead
        </button>
      </SignInPanel>
    );
  }

  // ── Default: single idle "Sign in" trigger ─────────────────────────────────
  return (
    <button
      onClick={() => setShowPicker(true)}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
      title="Sign in"
    >
      <LogIn size={14} />
      <span>Sign in</span>
    </button>
  );
}
