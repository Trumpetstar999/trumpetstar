import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PlanKey, UpgradeLinks, canAccessPlan, PLAN_RANKS } from '@/types/plans';
import { getCheckoutUrl } from '@/lib/checkout';

interface MembershipState {
  isLoading: boolean;
  planKey: PlanKey;
  planRank: number;
  activeProductIds: string[];
  upgradeLinks: UpgradeLinks;
  lastSync: Date | null;
  error: string | null;
}

interface MembershipContextType extends MembershipState {
  refreshMembership: () => Promise<void>;
  canAccessLevel: (requiredPlanKey: PlanKey) => boolean;
  canAccessFeature: (requiredPlanKey: PlanKey) => boolean;
  getUpgradeLink: (planKey: PlanKey) => string | null;
}

const CACHE_KEY = 'membership_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const defaultState: MembershipState = {
  isLoading: true,
  planKey: 'FREE',
  planRank: 0,
  activeProductIds: [],
  upgradeLinks: { BASIC: null, PRO: null },
  lastSync: null,
  error: null,
};

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export function MembershipProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<MembershipState>(defaultState);

  // Load cached state (or force refresh if cache is empty/expired)
  useEffect(() => {
    if (user) {
      const cached = sessionStorage.getItem(`${CACHE_KEY}_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const lastSync = parsed.lastSync ? new Date(parsed.lastSync) : null;
          
          // Check if cache is still valid (max 5 minutes for better responsiveness)
          const cacheTtl = 5 * 60 * 1000; // 5 minutes
          if (lastSync && Date.now() - lastSync.getTime() < cacheTtl) {
            setState({
              ...parsed,
              lastSync,
              isLoading: false,
            });
            return;
          }
        } catch (e) {
          console.error('Failed to parse membership cache:', e);
          // Clear invalid cache
          sessionStorage.removeItem(`${CACHE_KEY}_${user.id}`);
        }
      }
      // Load fresh data
      checkMembership();
    } else {
      // Signed-out visitors: nothing to load, never block purchase buttons
      setState({ ...defaultState, isLoading: false });
    }
  }, [user?.id]);

  const persistCache = useCallback((newState: MembershipState) => {
    if (user) {
      sessionStorage.setItem(`${CACHE_KEY}_${user.id}`, JSON.stringify({
        ...newState,
        lastSync: newState.lastSync?.toISOString(),
      }));
    }
  }, [user?.id]);

  const checkMembership = useCallback(async () => {
    if (!user?.email) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('digimember?action=check-membership', {
        body: {},
      });
      if (invokeError) throw invokeError;
      
      if (data.success) {
        // Normalize PREMIUM -> PRO for legacy API responses
        const normalizedPlanKey = (data.planKey === 'PREMIUM' ? 'PRO' : data.planKey) || 'FREE';
        
        const newState: MembershipState = {
          isLoading: false,
          planKey: normalizedPlanKey as PlanKey,
          planRank: data.planRank || PLAN_RANKS[normalizedPlanKey as PlanKey] || 0,
          activeProductIds: data.activeProductIds || [],
          upgradeLinks: {
            BASIC: data.upgradeLinks?.BASIC || null,
            PRO: data.upgradeLinks?.PRO || data.upgradeLinks?.PREMIUM || null,
          },
          lastSync: new Date(),
          error: null,
        };
        
        setState(newState);
        persistCache(newState);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Membership check error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Fehler beim Laden',
      }));
    }
  }, [user?.email, user?.id, persistCache]);

  const refreshMembership = useCallback(async () => {
    await checkMembership();
  }, [checkMembership]);

  const canAccessLevel = useCallback((requiredPlanKey: PlanKey): boolean => {
    return canAccessPlan(state.planKey, requiredPlanKey);
  }, [state.planKey]);

  const canAccessFeature = useCallback((requiredPlanKey: PlanKey): boolean => {
    return canAccessPlan(state.planKey, requiredPlanKey);
  }, [state.planKey]);

  const getUpgradeLink = useCallback((planKey: PlanKey): string | null => {
    return getCheckoutUrl(planKey);
  }, []);

  // Auto-refresh on focus (if cache expired)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.email && state.lastSync) {
        const isExpired = Date.now() - state.lastSync.getTime() > CACHE_TTL;
        if (isExpired) {
          checkMembership();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.email, state.lastSync, checkMembership]);

  return (
    <MembershipContext.Provider
      value={{
        ...state,
        refreshMembership,
        canAccessLevel,
        canAccessFeature,
        getUpgradeLink,
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}
