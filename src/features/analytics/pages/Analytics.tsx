import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { BarChart2, AlertCircle } from 'lucide-react';

const ADMIN_USERS = ['ajeetchouksey', 'ajchava'];

export default function Analytics() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const isAdmin = user ? ADMIN_USERS.includes(user.login) : false;

  return (
    <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="page-eyebrow">Platform Analytics</p>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={20} className="text-violet-400" />
            <h1 className="text-xl font-bold tracking-tight"><span className="heading-gradient">Analytics</span></h1>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">GA4 · Issue #14</p>
        </div>
      </div>

      {authLoading && (
        <p className="text-slate-500 text-sm animate-pulse py-12 text-center">Checking authentication…</p>
      )}

      {!authLoading && !user && (
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <BarChart2 size={22} className="text-slate-400" />
          </div>
          <h2 className="section-heading mb-2">Sign in required</h2>
          <p className="text-sm text-slate-400">This page is restricted to repository collaborators.</p>
        </div>
      )}

      {!authLoading && user && !isAdmin && (
        <div className="max-w-md mx-auto mt-16 text-center">
          <h2 className="section-heading mb-2">Access denied</h2>
          <p className="text-sm text-slate-400">
            Signed in as <span className="text-slate-300 font-medium">@{user.login}</span> — not a repository collaborator.
          </p>
        </div>
      )}

      {!authLoading && isAdmin && (
        <div className="glass-card rounded-xl p-8 border-violet-500/20 text-center">
          <AlertCircle size={32} className="mx-auto text-violet-400 mb-3" />
          <h3 className="text-base font-semibold text-white mb-2">GA4 Analytics — Coming Soon</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            GoatCounter has been removed. GA4 cookieless analytics will be wired in Issue #14.
            Set <code className="text-violet-300">VITE_GA_MEASUREMENT_ID</code> in GitHub Pages secrets once your GA4 property is ready.
          </p>
        </div>
      )}
    </div>
  );
}
