import { createContext } from 'react';

export type Language = 'de' | 'en' | 'es';
export type SkillLevel = 'beginner' | 'intermediate';

export interface LanguageContextType {
  language: Language;
  skillLevel: SkillLevel;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
  hasCompletedLanguageSetup: boolean;
  hasSeenWelcome: boolean;
  completeOnboarding: (lang: Language, skill: SkillLevel) => Promise<void>;
  completeWelcome: () => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
