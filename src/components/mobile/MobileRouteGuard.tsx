import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMiniMode } from '@/hooks/useMiniMode';
import { useAuth } from '@/hooks/useAuth';
import { HOME_APPS, PROFILE_ROUTE } from '@/config/apps';

// The new homescreen and its modules work on every device size.
const HOME_ROUTES = ['/', PROFILE_ROUTE, ...HOME_APPS.map((a) => a.route)];

// Routes that are allowed on mobile (auth, onboarding, mobile routes)
const MOBILE_ALLOWED_PREFIXES = [
  '/auth',
  '/login',
  '/signup',
  '/reset-password',
  '/mobile/',
  '/mobile/home',
  '/mobile/plan',
  '/mobile/help',
  '/mobile/profile',
  '/mobile/locked',
  '/pricing',
  '/snowtone',
  '/qr/',
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
    // Recovery sessions must not fall through to normal login/app navigation.
    if (user && sessionStorage.getItem('password_recovery_user') === user.id && path !== '/reset-password') {
      navigate(`/reset-password${location.search}${location.hash}`, { replace: true });
      return;
    }

    if (isMiniMode && user) {
      // On mobile + logged in: redirect desktop routes to mobile
      const isOnMobileRoute = HOME_ROUTES.includes(path) || MOBILE_ALLOWED_PREFIXES.some(r => path === r || path.startsWith(r));
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
