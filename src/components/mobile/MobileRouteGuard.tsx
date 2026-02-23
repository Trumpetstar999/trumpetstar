import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMiniMode } from '@/hooks/useMiniMode';
import { useAuth } from '@/hooks/useAuth';

// Routes that are allowed on mobile (auth, onboarding, mobile routes)
const MOBILE_ALLOWED_ROUTES = [
  '/auth',
  '/mobile/',
  '/mobile/home',
  '/mobile/plan',
  '/mobile/help',
  '/mobile/profile',
  '/mobile/locked',
];

// Desktop app routes that should redirect to locked on mobile
const DESKTOP_ROUTES = [
  '/',
  '/admin',
  '/chats',
  '/classroom',
  '/pricing',
  '/musicxml',
  '/game/play',
  '/practice/',
];

interface MobileRouteGuardProps {
  children: ReactNode;
}

export function MobileRouteGuard({ children }: MobileRouteGuardProps) {
  const isMiniMode = useMiniMode();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const path = location.pathname;

    if (isMiniMode && user) {
      // On mobile + logged in: redirect desktop routes to mobile
      const isOnMobileRoute = MOBILE_ALLOWED_ROUTES.some(r => path.startsWith(r));
      const isAuthRoute = path === '/auth';

      if (!isOnMobileRoute && !isAuthRoute) {
        // Check if it's the root route
        if (path === '/') {
          navigate('/mobile/home', { replace: true });
        } else {
          // Any other desktop route → locked
          navigate('/mobile/locked', { replace: true });
        }
      }
    } else if (!isMiniMode && user) {
      // On desktop: redirect mobile routes back to main app
      if (path.startsWith('/mobile/')) {
        navigate('/', { replace: true });
      }
    }
  }, [isMiniMode, user, loading, location.pathname, navigate]);

  return <>{children}</>;
}
