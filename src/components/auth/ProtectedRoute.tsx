import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ requireRole }: { requireRole?: 'admin' | 'agent' | 'user' | 'resort' }) {
  const { currentUser, userProfile, loading } = useAuth();

  // If auth state is still initializing, or if we have a user but their profile hasn't loaded yet
  if (loading || (currentUser && !userProfile)) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && userProfile?.role !== requireRole && userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
