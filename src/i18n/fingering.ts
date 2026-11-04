import type { Language } from '@/contexts/LanguageContext';

export const FINGERING_COPY: Record<Language, { ascending: string; descending: string }> = {
  de: { ascending: 'Chromatisch aufwärts ♯', descending: 'Chromatisch abwärts ♭' },
  en: { ascending: 'Chromatic ascending ♯', descending: 'Chromatic descending ♭' },
  es: { ascending: 'Cromática ascendente ♯', descending: 'Cromática descendente ♭' },
  sl: { ascending: 'Kromatično navzgor ♯', descending: 'Kromatično navzdol ♭' },
};