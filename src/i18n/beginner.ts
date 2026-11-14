import type { Language } from '@/contexts/LanguageContext';
const de = {
  video: 'Video', feedback: 'Töne & Melodien üben – die App hört zu', soon: 'Kommt noch',
  unavailable: 'Videos konnten nicht geladen werden.', retry: 'Erneut versuchen',
  previous: 'Vorherige Videos', next: 'Weitere Videos', play: 'Abspielen', pause: 'Pause',
  fullscreen: 'Vollbild', loading: 'Video wird geladen …', tempo: 'Tempo',
};
type Copy = typeof de;
export const BEGINNER_COPY: Record<Language, Copy> = {
  de,
  en: { video: 'Video', feedback: 'Practise notes & melodies – the app listens', soon: 'Coming soon', unavailable: 'Videos could not be loaded.', retry: 'Try again', previous: 'Previous videos', next: 'More videos', play: 'Play', pause: 'Pause', fullscreen: 'Full screen', loading: 'Loading video …', tempo: 'Tempo' },
  es: { video: 'Vídeo', feedback: 'Practicar notas y melodías – la app escucha', soon: 'Próximamente', unavailable: 'No se pudieron cargar los vídeos.', retry: 'Reintentar', previous: 'Vídeos anteriores', next: 'Más vídeos', play: 'Reproducir', pause: 'Pausa', fullscreen: 'Pantalla completa', loading: 'Cargando vídeo …', tempo: 'Tempo' },
  sl: { video: 'Video', feedback: 'Vadi tone in melodije – aplikacija posluša', soon: 'Kmalu', unavailable: 'Videov ni bilo mogoče naložiti.', retry: 'Poskusi znova', previous: 'Prejšnji videi', next: 'Več videov', play: 'Predvajaj', pause: 'Premor', fullscreen: 'Celoten zaslon', loading: 'Nalaganje videa …', tempo: 'Tempo' },
};