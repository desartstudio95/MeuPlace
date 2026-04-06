import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ requireRole }: { requireRole?: string | string[] }) {
  const { currentUser, userProfile, loading } = useAuth();

  // If auth state is still initializing, or if we have a user but their profile hasn't loaded yet
  if (loading || (currentUser && !userProfile)) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!roles.includes(userProfile?.role || '') && userProfile?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }

  // Check for approval for agents and resorts
  if (userProfile && (userProfile.role === 'agent' || userProfile.role === 'resort') && !userProfile.isApproved) {
    // If they are on the dashboard, the dashboard will handle the message
    // If they are elsewhere (like /add-property), we redirect to dashboard
    if (window.location.pathname !== '/dashboard') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
