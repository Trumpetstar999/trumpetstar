import type { Language } from '@/hooks/useLanguage';

export const shopCopy: Record<Language, { pricing: string }> = {
  de: { pricing: 'Mitgliedschaften & Preise' },
  en: { pricing: 'Memberships & pricing' },
  es: { pricing: 'Membresías y precios' },
  sl: { pricing: 'Članstva in cene' },
};