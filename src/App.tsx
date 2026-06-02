import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import AppRoutes from '@/app/router';
import { AuthProvider } from '@/lib/auth';
import { trackPageView } from '@/lib/analytics';

function GATracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <GATracker />
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}