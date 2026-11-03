import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { HomeScreen } from './HomeScreen';

/** Guests see the homescreen with the login sheet instead of a hard redirect. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="ts-wall min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ts-deep" />
      </div>
    );
  }
  if (!user) return <HomeScreen lockedNext={location.pathname + location.search} />;
  return <>{children}</>;
}
