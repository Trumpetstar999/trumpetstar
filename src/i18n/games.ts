import type { Language } from '@/hooks/useLanguage';

export const gamesCopy: Record<Language, { choose: string; start: string; back: string }> = {
  de: { choose: 'Spiel auswählen', start: 'Starten', back: 'Zurück zu Games' },
  en: { choose: 'Choose a game', start: 'Play', back: 'Back to Games' },
  es: { choose: 'Elegir juego', start: 'Jugar', back: 'Volver a Games' },
  sl: { choose: 'Izberi igro', start: 'Igraj', back: 'Nazaj na Games' },
};