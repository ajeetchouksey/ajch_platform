import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Key, Copy, Check, ExternalLink } from 'lucide-react';
import { useAuth, isOAuthConfigured } from '@/lib/auth';

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

export function GithubLogin() {
  const { user, isLoading, login, loginWithToken, logout, deviceFlow, cancelDeviceFlow } = useAuth();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(deviceFlow?.userCode ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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

  // Device flow in progress — show code + spinner
  if (deviceFlow) {
    const secondsLeft = Math.max(0, Math.round((deviceFlow.expiresAt - Date.now()) / 1000));
    return (
      <div className="flex items-center gap-1.5 bg-gray-800/90 border border-violet-500/40 rounded-lg px-2.5 py-1.5">
        {/* Step hint */}
        <span className="text-[10px] text-gray-400 hidden sm:inline whitespace-nowrap">
          <a href={deviceFlow.verificationUri} target="_blank" rel="noopener noreferrer"
            className="text-violet-400 hover:underline">github.com/login/device</a> →
        </span>
        {/* Code */}
        <button
          onClick={copyCode}
          className="flex items-center gap-1 font-mono font-bold text-white text-sm bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded transition-colors"
          title="Click to copy"
        >
          {deviceFlow.userCode}
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-gray-400" />}
        </button>
        {/* Open GitHub */}
        <a
          href={deviceFlow.verificationUri}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-gray-400 hover:text-violet-300 transition-colors"
          title="Open GitHub device activation"
        >
          <ExternalLink size={13} />
        </a>
        {/* Spinner + expiry */}
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <span className="w-2.5 h-2.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin inline-block" />
          {secondsLeft}s
        </span>
        {/* Cancel */}
        <button onClick={cancelDeviceFlow} className="text-gray-500 hover:text-gray-300 text-xs leading-none" title="Cancel">
          ✕
        </button>
      </div>
    );
  }

  if (showTokenInput) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="password"
          value={tokenValue}
          onChange={(e) => { setTokenValue(e.target.value); setError(''); }}
          placeholder="ghp_... (gist + read:user)"
          className="w-40 sm:w-56 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={async () => {
            if (!tokenValue.trim()) return;
            const ok = await loginWithToken(tokenValue.trim());
            if (!ok) setError('Invalid token');
            else { setTokenValue(''); setShowTokenInput(false); }
          }}
          className="px-2 py-1 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
        >
          Go
        </button>
        <button onClick={() => { setShowTokenInput(false); setError(''); }} className="px-1 py-1 text-xs text-gray-400 hover:text-gray-200">
          ✕
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={async () => {
          if (isOAuthConfigured()) {
            const started = await login();
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