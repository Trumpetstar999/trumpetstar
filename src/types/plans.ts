// Plan system types
// Plans: FREE (0), BASIC (10), PRO (20)

export type PlanKey = 'FREE' | 'BASIC' | 'PRO';

export interface Plan {
  key: PlanKey;
  display_name: string;
  rank: number;
}

export interface PlanInfo {
  key: PlanKey;
  title: string;
  shortDescription: string;
  description: string;
  cta: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  yearlyDiscount?: number;
  features: PlanFeature[];
  highlighted?: boolean;
}

export interface PlanFeature {
  category: 'lernen' | 'feedback' | 'mitspielen' | 'motivation';
  name: string;
  included: boolean;
  detail?: string;
}

export interface UserPlan {
  planKey: PlanKey;
  planRank: number;
  activeProductIds: string[];
  lastCheckedAt: Date | null;
}

export interface UpgradeLinks {
  BASIC: string | null;
  PRO: string | null;
}

// Plan hierarchy for access checks
export const PLAN_RANKS: Record<PlanKey, number> = {
  FREE: 0,
  BASIC: 10,
  PRO: 20,
};

// Display names
export const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
  FREE: 'Free',
  BASIC: 'Basic',
  PRO: 'Pro',
};

// Complete plan information
export const PLAN_INFO: Record<PlanKey, PlanInfo> = {
  FREE: {
    key: 'FREE',
    title: 'Free',
    shortDescription: 'Kostenloser Einstieg – entdecke ausgewählte Lerninhalte.',
    description: 'Kostenloser Zugang zu ausgewählten Lernvideos, PDF-Noten und Basistools. Kein persönliches Feedback. Perfekt zum Reinschnuppern.',
    cta: 'Kostenlos starten',
    features: [
      // Lernen
      { category: 'lernen', name: 'Ausgewählte Lernvideos', included: true },
      { category: 'lernen', name: 'Alle Lernvideos', included: false },
      { category: 'lernen', name: 'PDF-Noten (Auswahl)', included: true },
      { category: 'lernen', name: 'Alle PDF-Noten & Materialien', included: false },
      { category: 'lernen', name: 'Offline-Zugriff', included: false },
      // Feedback
      { category: 'feedback', name: 'KI-Assistent (DE/EN/ES)', included: false },
      { category: 'feedback', name: 'Video-Feedback vom Lehrer', included: false },
      { category: 'feedback', name: '1:1 Chat mit Lehrer', included: false },
      { category: 'feedback', name: 'Live-Feedback-Calls', included: false },
      // Mitspielen
      { category: 'mitspielen', name: 'Basis-Tools', included: true },
      { category: 'mitspielen', name: 'Aufnahme-Funktion', included: false },
      { category: 'mitspielen', name: 'Stimmgerät', included: true },
      // Motivation
      { category: 'motivation', name: 'Fortschrittsanzeige', included: false },
      { category: 'motivation', name: 'Übungskalender', included: false },
      { category: 'motivation', name: 'Sterne & Erfolge', included: false },
      { category: 'motivation', name: 'Priorisierter Support', included: false },
    ],
  },
  BASIC: {
    key: 'BASIC',
    title: 'Basic',
    shortDescription: 'Zugriff auf alle Videos & Lernmaterialien.',
    description: 'Enthält alle Lernvideos, alle Noten/Materialien, MusicXML-Viewer, Offline, KI-Chat in DE/EN/ES, Fortschrittsanzeige, Kalender & Spielspaß-Tools. Kein persönliches Feedback von Lehrern.',
    cta: 'Basic freischalten',
    monthlyPrice: 19,
    yearlyPrice: 149,
    yearlyDiscount: 35,
    features: [
      // Lernen
      { category: 'lernen', name: 'Ausgewählte Lernvideos', included: true },
      { category: 'lernen', name: 'Alle Lernvideos', included: true },
      { category: 'lernen', name: 'PDF-Noten (Auswahl)', included: true },
      { category: 'lernen', name: 'Alle PDF-Noten & Materialien', included: true },
      { category: 'lernen', name: 'Offline-Zugriff', included: true },
      // Feedback
      { category: 'feedback', name: 'KI-Assistent (DE/EN/ES)', included: true },
      { category: 'feedback', name: 'Video-Feedback vom Lehrer', included: false },
      { category: 'feedback', name: '1:1 Chat mit Lehrer', included: false },
      { category: 'feedback', name: 'Live-Feedback-Calls', included: false },
      // Mitspielen
      { category: 'mitspielen', name: 'Basis-Tools', included: true },
      { category: 'mitspielen', name: 'Aufnahme-Funktion', included: true },
      { category: 'mitspielen', name: 'Stimmgerät', included: true },
      // Motivation
      { category: 'motivation', name: 'Fortschrittsanzeige', included: true },
      { category: 'motivation', name: 'Übungskalender', included: true },
      { category: 'motivation', name: 'Sterne & Erfolge', included: true },
      { category: 'motivation', name: 'Priorisierter Support', included: false },
    ],
  },
  PRO: {
    key: 'PRO',
    title: 'Pro',
    shortDescription: 'Alle Vorteile von Basic + persönliches Feedback.',
    description: 'Enthält alles aus Basic + individuelles Feedback zu eigenen Videos, 1:1 Chat mit Lehrer, regelmäßige Live-Feedback-Calls, priorisierter Support.',
    cta: 'Pro freischalten',
    monthlyPrice: 59,
    yearlyPrice: 399,
    yearlyDiscount: 32,
    highlighted: true,
    features: [
      // Lernen
      { category: 'lernen', name: 'Ausgewählte Lernvideos', included: true },
      { category: 'lernen', name: 'Alle Lernvideos', included: true },
      { category: 'lernen', name: 'PDF-Noten (Auswahl)', included: true },
      { category: 'lernen', name: 'Alle PDF-Noten & Materialien', included: true },
      { category: 'lernen', name: 'Offline-Zugriff', included: true },
      // Feedback
      { category: 'feedback', name: 'KI-Assistent (DE/EN/ES)', included: true },
      { category: 'feedback', name: 'Video-Feedback vom Lehrer', included: true },
      { category: 'feedback', name: '1:1 Chat mit Lehrer', included: true },
      { category: 'feedback', name: 'Live-Feedback-Calls', included: true },
      // Mitspielen
      { category: 'mitspielen', name: 'Basis-Tools', included: true },
      { category: 'mitspielen', name: 'Aufnahme-Funktion', included: true },
      { category: 'mitspielen', name: 'Stimmgerät', included: true },
      // Motivation
      { category: 'motivation', name: 'Fortschrittsanzeige', included: true },
      { category: 'motivation', name: 'Übungskalender', included: true },
      { category: 'motivation', name: 'Sterne & Erfolge', included: true },
      { category: 'motivation', name: 'Priorisierter Support', included: true },
    ],
  },
};

// Features requiring specific plans
export const PREMIUM_FEATURES = {
  CLASSROOM: 'PRO',
  FEEDBACK: 'PRO',
  TEACHER_MODE: 'PRO',
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
  // Show BASIC and PRO options if user is FREE and PRO is required
  else if (userPlanKey === 'FREE' && requiredPlanKey === 'PRO') {
    upgrades.push('BASIC', 'PRO');
  }
  // Show only PRO if user is BASIC and PRO is required
  else if (userPlanKey === 'BASIC' && requiredPlanKey === 'PRO') {
    upgrades.push('PRO');
  }
  
  return upgrades;
}

// Category display names for the comparison table
export const FEATURE_CATEGORIES = {
  lernen: { name: 'Lernen', icon: 'BookOpen', color: 'text-blue-600' },
  feedback: { name: 'Feedback', icon: 'MessageCircle', color: 'text-green-600' },
  mitspielen: { name: 'Mitspielen', icon: 'Music', color: 'text-purple-600' },
  motivation: { name: 'Motivation', icon: 'Trophy', color: 'text-amber-600' },
} as const;
