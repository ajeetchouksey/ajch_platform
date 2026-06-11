import { useEffect, useRef } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import AppRoutes from '@/app/router';
import { AuthProvider, useAuth } from '@/lib/auth';
import { trackPageView } from '@/lib/analytics';
import { mergeAnonymousProgress } from '@/lib/storage';

function GATracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

// On first login, promote anonymous quiz sessions to the newly authenticated user.
function AuthMerger() {
  const { user } = useAuth();
  const prevLogin = useRef<string | null>(null);
  useEffect(() => {
    if (user && prevLogin.current === null) {
      mergeAnonymousProgress(user.login);
    }
    prevLogin.current = user?.login ?? null;
  }, [user]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <GATracker />
        <AuthMerger />
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}