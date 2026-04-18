import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TrumpetstarLoader } from '@/components/common/TrumpetstarLoader';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <TrumpetstarLoader />;
  }

  if (!user) {
    // Store the intended destination for post-login redirect
    const returnTo = location.pathname + location.search;
    sessionStorage.setItem('returnTo', returnTo);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
