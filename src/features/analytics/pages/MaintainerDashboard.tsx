import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { isAnalyticsConfigured } from '@/lib/analytics';
import { BarChart2, AlertCircle } from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';

export default function MaintainerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (!authLoading && (!user || user.login !== OWNER_LOGIN)) {
    return <Navigate to="/maintainer" replace />;
  }

  const configured = isAnalyticsConfigured();

  return (
    <div className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={20} className="text-violet-400" />
          Analytics Dashboard
        </h1>
        <span className="text-xs text-slate-500">
          {configured ? 'GA4 connected' : 'Not configured'}
        </span>
      </div>

      <div className="glass-card rounded-xl p-8 border-violet-500/20 text-center">
        <AlertCircle size={32} className="mx-auto text-violet-400 mb-3" />
        <h3 className="text-base font-semibold text-white mb-2">GA4 Analytics — Coming Soon</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          GoatCounter has been removed. GA4 cookieless analytics will be wired in Issue #14.
          Set <code className="text-violet-300">VITE_GA_MEASUREMENT_ID</code> in GitHub Pages secrets once your GA4 property is ready.
        </p>
      </div>
    </div>
  );
}
