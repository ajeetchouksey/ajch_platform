import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

/**
 * /auth/callback — landing page for the GitHub OAuth web flow.
 *
 * GitHub redirects here after the Cloudflare Worker exchanges the one-time
 * `code` for an access token. The Worker passes the token via the URL
 * fragment (#token=...) so it is never sent to the Pages server.
 *
 * Security:
 *  - state param verified against sessionStorage nonce (CSRF protection)
 *  - URL fragment is cleared immediately (history.replaceState) before any
 *    other action, so the token never lingers in the address bar or history
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip leading #
    const params = new URLSearchParams(hash);

    // Scrub the fragment from the address bar / history IMMEDIATELY before use
    window.history.replaceState(null, '', window.location.pathname);

    const token = params.get('token');
    const state = params.get('state');
    const errParam = params.get('error');

    if (errParam) {
      setError(errParam === 'access_denied' ? 'You declined the GitHub authorization.' : `OAuth error: ${errParam}`); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    if (!token || !state) {
      setError('Missing token or state in callback. Please try again.');
      return;
    }

    // CSRF: verify state matches the nonce stored before redirect
    const expectedState = sessionStorage.getItem('oauth_state');
    if (!expectedState || state !== expectedState) {
      setError('Invalid state parameter. Possible CSRF — please try again.');
      return;
    }
    sessionStorage.removeItem('oauth_state');

    const returnPath = sessionStorage.getItem('oauth_return') ?? '/';
    sessionStorage.removeItem('oauth_return');

    // Exchange token for user info and store in auth context
    loginWithToken(token).then((ok) => {
      if (ok) {
        navigate(returnPath, { replace: true });
      } else {
        setError('Token was accepted by GitHub but user info could not be loaded. Please try again.');
      }
    });
    // Deliberately don't include loginWithToken/navigate in deps — fires once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-800/40 rounded-2xl p-8 text-center space-y-4">
          <p className="text-red-400 font-semibold text-lg">Sign-in failed</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <a
            href="/"
            className="inline-block mt-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Return home &amp; try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
