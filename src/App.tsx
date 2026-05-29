import { BrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import AppRoutes from '@/app/router';
import { AuthProvider } from '@/lib/auth';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}