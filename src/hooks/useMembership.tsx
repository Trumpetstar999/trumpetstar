import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PlanKey, UpgradeLinks, canAccessPlan, PLAN_RANKS } from '@/types/plans';

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
  upgradeLinks: { BASIC: null, PREMIUM: null },
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
      setState(defaultState);
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digimember?action=check-membership`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Membership check failed');
      }

      const data = await response.json();
      
      if (data.success) {
        const newState: MembershipState = {
          isLoading: false,
          planKey: data.planKey || 'FREE',
          planRank: data.planRank || PLAN_RANKS[data.planKey as PlanKey] || 0,
          activeProductIds: data.activeProductIds || [],
          upgradeLinks: {
            BASIC: data.upgradeLinks?.BASIC || null,
            PREMIUM: data.upgradeLinks?.PREMIUM || null,
          },
          lastSync: new Date(),
          error: null,
        };
        
        setState(newState);
        persistCache(newState);
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
    if (planKey === 'BASIC') return state.upgradeLinks.BASIC;
    if (planKey === 'PREMIUM') return state.upgradeLinks.PREMIUM;
    return null;
  }, [state.upgradeLinks]);

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
