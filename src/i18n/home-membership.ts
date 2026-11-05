import type { Language } from '@/hooks/useLanguage';

export const homeMembershipCopy: Record<Language, { upgrade: string; status: string; loading: string }> = {
  de: { upgrade: 'Upgrade', status: 'Mitgliedsstatus', loading: 'Wird geladen' },
  en: { upgrade: 'Upgrade', status: 'Membership status', loading: 'Loading' },
  es: { upgrade: 'Mejorar', status: 'Estado de membresía', loading: 'Cargando' },
  sl: { upgrade: 'Nadgradi', status: 'Status članstva', loading: 'Nalaganje' },
};