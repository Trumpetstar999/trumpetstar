// Plan system types
// Plans: FREE (0), BASIC (10), PREMIUM (20)

export type PlanKey = 'FREE' | 'BASIC' | 'PREMIUM';

export interface Plan {
  key: PlanKey;
  display_name: string;
  rank: number;
}

export interface UserPlan {
  planKey: PlanKey;
  planRank: number;
  activeProductIds: string[];
  lastCheckedAt: Date | null;
}

export interface UpgradeLinks {
  BASIC: string | null;
  PREMIUM: string | null;
}

// Plan hierarchy for access checks
export const PLAN_RANKS: Record<PlanKey, number> = {
  FREE: 0,
  BASIC: 10,
  PREMIUM: 20,
};

// Display names (German)
export const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
  FREE: 'Free',
  BASIC: 'Basic',
  PREMIUM: 'Premium',
};

// Features requiring specific plans
export const PREMIUM_FEATURES = {
  CLASSROOM: 'PREMIUM',
  FEEDBACK: 'PREMIUM',
  TEACHER_MODE: 'PREMIUM',
} as const;

export function canAccessPlan(userPlanKey: PlanKey, requiredPlanKey: PlanKey): boolean {
  return PLAN_RANKS[userPlanKey] >= PLAN_RANKS[requiredPlanKey];
}

export function getRequiredUpgradePlans(userPlanKey: PlanKey, requiredPlanKey: PlanKey): PlanKey[] {
  const userRank = PLAN_RANKS[userPlanKey];
  const requiredRank = PLAN_RANKS[requiredPlanKey];
  
  if (userRank >= requiredRank) return [];
  
  const upgrades: PlanKey[] = [];
  
  // Show BASIC option if user is FREE and BASIC would unlock
  if (userPlanKey === 'FREE' && requiredPlanKey === 'BASIC') {
    upgrades.push('BASIC');
  }
  // Show BASIC and PREMIUM options if user is FREE and PREMIUM is required
  else if (userPlanKey === 'FREE' && requiredPlanKey === 'PREMIUM') {
    upgrades.push('BASIC', 'PREMIUM');
  }
  // Show only PREMIUM if user is BASIC and PREMIUM is required
  else if (userPlanKey === 'BASIC' && requiredPlanKey === 'PREMIUM') {
    upgrades.push('PREMIUM');
  }
  
  return upgrades;
}
