import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type MembershipPlan = 'FREE' | 'PLAN_A' | 'PLAN_B';

interface WPProduct {
  productId: string;
  status: string;
}

interface WPUser {
  email: string;
  displayName: string;
  wpUserId: string;
}

interface UpgradeLinks {
  planA: string | null;
  planB: string | null;
}

interface WordPressMembershipState {
  isLoading: boolean;
  isLinked: boolean;
  wpUser: WPUser | null;
  plan: MembershipPlan;
  products: WPProduct[];
  upgradeLinks: UpgradeLinks | null;
  wpAccessToken: string | null;
  lastSync: Date | null;
  error: string | null;
}

interface WordPressMembershipContextType extends WordPressMembershipState {
  startOAuthFlow: () => Promise<void>;
  handleOAuthCallback: (code: string, state: string) => Promise<boolean>;
  refreshMembership: () => Promise<void>;
  disconnect: () => void;
  canAccessLevel: (requiredPlan: MembershipPlan) => boolean;
  getUpgradeLink: (requiredPlan: MembershipPlan) => string | null;
}

const STORAGE_KEY = 'wp_membership';

const defaultState: WordPressMembershipState = {
  isLoading: false,
  isLinked: false,
  wpUser: null,
  plan: 'FREE',
  products: [],
  upgradeLinks: null,
  wpAccessToken: null,
  lastSync: null,
  error: null,
};

const WordPressMembershipContext = createContext<WordPressMembershipContextType | undefined>(undefined);

export function WordPressMembershipProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<WordPressMembershipState>(defaultState);

  // Load saved state from sessionStorage on mount
  useEffect(() => {
    if (user) {
      const saved = sessionStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState({
            ...parsed,
            lastSync: parsed.lastSync ? new Date(parsed.lastSync) : null,
            isLoading: false,
          });
        } catch (e) {
          console.error('Failed to parse saved WP membership:', e);
        }
      }
    } else {
      // Clear state when user logs out
      setState(defaultState);
    }
  }, [user]);

  // Persist state to sessionStorage
  const persistState = useCallback((newState: WordPressMembershipState) => {
    if (user && newState.isLinked) {
      sessionStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({
        ...newState,
        lastSync: newState.lastSync?.toISOString(),
      }));
    }
  }, [user]);

  // Check membership via DigiMember API on initial load
  const checkDigiMemberMembership = useCallback(async () => {
    if (!user?.email) return;
    
    console.log('Checking DigiMember membership for:', user.email);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=check-membership`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
          }),
        }
      );

      if (!response.ok) {
        console.error('DigiMember check failed:', await response.text());
        return;
      }

      const data = await response.json();
      console.log('DigiMember membership response:', data);
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          plan: data.plan || 'FREE',
          upgradeLinks: data.upgradeLinks || null,
          lastSync: new Date(),
        }));
      }
    } catch (error) {
      console.error('DigiMember membership check error:', error);
    }
  }, [user?.email, user?.id]);

  // Auto-check DigiMember membership when user logs in
  useEffect(() => {
    if (user?.email) {
      checkDigiMemberMembership();
    }
  }, [user?.email, checkDigiMemberMembership]);

  const startOAuthFlow = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const redirectUri = `${window.location.origin}/auth/wordpress/callback`;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wp-oauth?action=authorize&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get authorize URL');
      }

      const { authorize_url, state: oauthState } = await response.json();
      
      // Store state for verification
      sessionStorage.setItem('wp_oauth_state', oauthState);
      
      // Redirect to WordPress OAuth
      window.location.href = authorize_url;
    } catch (error) {
      console.error('OAuth flow error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'OAuth fehlgeschlagen' 
      }));
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, returnedState: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Verify state
      const savedState = sessionStorage.getItem('wp_oauth_state');
      if (savedState !== returnedState) {
        throw new Error('Invalid OAuth state');
      }
      sessionStorage.removeItem('wp_oauth_state');

      const redirectUri = `${window.location.origin}/auth/wordpress/callback`;

      // Exchange code for token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wp-oauth?action=token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const tokenData = await response.json();

      // Now check DigiMember for the actual membership
      const wpEmail = tokenData.user?.email;
      let plan: MembershipPlan = 'FREE';
      let upgradeLinks: UpgradeLinks | null = null;

      if (wpEmail && user?.id) {
        try {
          const membershipResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=check-membership`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: wpEmail,
                userId: user.id,
              }),
            }
          );

          if (membershipResponse.ok) {
            const membershipData = await membershipResponse.json();
            if (membershipData.success) {
              plan = membershipData.plan || 'FREE';
              upgradeLinks = membershipData.upgradeLinks || null;
            }
          }
        } catch (membershipError) {
          console.error('Membership check error:', membershipError);
        }
      }

      const newState: WordPressMembershipState = {
        isLoading: false,
        isLinked: true,
        wpUser: tokenData.user,
        plan,
        products: tokenData.products || [],
        upgradeLinks,
        wpAccessToken: tokenData.access_token,
        lastSync: new Date(),
        error: null,
      };

      setState(newState);
      persistState(newState);
      
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Callback fehlgeschlagen' 
      }));
      return false;
    }
  }, [persistState, user?.id]);

  const refreshMembership = useCallback(async () => {
    if (!user?.email) {
      setState(prev => ({ ...prev, error: 'Nicht eingeloggt' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Use the linked WP email if available, otherwise use Supabase user email
      const emailToCheck = state.wpUser?.email || user.email;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=check-membership`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: emailToCheck,
            userId: user.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Membership check failed');
      }

      const data = await response.json();

      const newState: WordPressMembershipState = {
        ...state,
        isLoading: false,
        plan: data.plan || 'FREE',
        upgradeLinks: data.upgradeLinks || null,
        lastSync: new Date(),
        error: null,
      };

      setState(newState);
      persistState(newState);
    } catch (error) {
      console.error('Refresh membership error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Aktualisierung fehlgeschlagen' 
      }));
    }
  }, [user?.email, user?.id, state.wpUser?.email, persistState]);

  const disconnect = useCallback(() => {
    if (user) {
      sessionStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    }
    setState(defaultState);
  }, [user]);

  const canAccessLevel = useCallback((requiredPlan: MembershipPlan): boolean => {
    const planHierarchy: Record<MembershipPlan, number> = {
      'FREE': 0,
      'PLAN_A': 1,
      'PLAN_B': 2,
    };
    return planHierarchy[state.plan] >= planHierarchy[requiredPlan];
  }, [state.plan]);

  const getUpgradeLink = useCallback((requiredPlan: MembershipPlan): string | null => {
    if (!state.upgradeLinks) return null;
    
    if (requiredPlan === 'PLAN_A') {
      return state.upgradeLinks.planA;
    } else if (requiredPlan === 'PLAN_B') {
      return state.upgradeLinks.planB;
    }
    return null;
  }, [state.upgradeLinks]);

  // Auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (user?.email) {
        // Only refresh if last sync was more than 5 minutes ago
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!state.lastSync || state.lastSync < fiveMinutesAgo) {
          refreshMembership();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.email, state.lastSync, refreshMembership]);

  return (
    <WordPressMembershipContext.Provider
      value={{
        ...state,
        startOAuthFlow,
        handleOAuthCallback,
        refreshMembership,
        disconnect,
        canAccessLevel,
        getUpgradeLink,
      }}
    >
      {children}
    </WordPressMembershipContext.Provider>
  );
}

export function useWordPressMembership() {
  const context = useContext(WordPressMembershipContext);
  if (context === undefined) {
    throw new Error('useWordPressMembership must be used within a WordPressMembershipProvider');
  }
  return context;
}