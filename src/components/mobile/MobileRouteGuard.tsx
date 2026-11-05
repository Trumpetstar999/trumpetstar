import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PROFILE_ROUTE } from '@/config/apps';

// The new homescreen and its modules work on every device size.
const LEGACY_MOBILE_DESTINATIONS: Record<string, string> = {
  '/mobile/home': '/',
  '/mobile/plan': '/pricing',
  '/mobile/help': '/hilfe',
  '/mobile/profile': PROFILE_ROUTE,
  '/mobile/locked': '/',
};

interface MobileRouteGuardProps {
  children: ReactNode;
}

export function MobileRouteGuard({ children }: MobileRouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const path = location.pathname;
    // Recovery sessions must not fall through to normal login/app navigation.
    if (user && sessionStorage.getItem('password_recovery_user') === user.id && path !== '/reset-password') {
      navigate(`/reset-password${location.search}${location.hash}`, { replace: true });
      return;
    }

    if (path.startsWith('/mobile/')) {
      const destination = LEGACY_MOBILE_DESTINATIONS[path.replace(/\/$/, '')] ?? '/';
      navigate(`${destination}${location.search}${location.hash}`, { replace: true });
    }
  }, [user, loading, location.pathname, location.search, location.hash, navigate]);

  return <>{children}</>;
}
