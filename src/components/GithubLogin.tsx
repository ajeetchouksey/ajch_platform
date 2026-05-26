import { useState } from 'react';
import { LogOut, Key } from 'lucide-react';
import { useAuth, isOAuthConfigured } from '../lib/auth';

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
        <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80">
          <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full border border-gray-600" />
          <span className="text-sm text-gray-200 hidden sm:inline">{user.name || user.login}</span>
        </a>
        <button onClick={logout} className="p-1 text-gray-400 hover:text-red-400 transition-colors" title="Logout">
          <LogOut size={16} />
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
        onClick={() => {
          if (isOAuthConfigured()) {
            login();
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
    </div>
  );
}