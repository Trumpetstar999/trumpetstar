import type { Language } from '@/contexts/LanguageContext';

const de = {
  title: 'Stimmgerät', instrument: 'B♭-Trompete', concert: 'Klingend', start: 'Mikrofon aktivieren', stop: 'Mikrofon stoppen',
  ready: 'Bereit zum Stimmen', waiting: 'Warte auf deinen Ton …', low: 'Zu tief', high: 'Zu hoch', tuned: 'Stimmt!',
  reference: 'Kammerton', decrease: 'Kammerton senken', increase: 'Kammerton erhöhen', close: 'Schließen',
  microphoneError: 'Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff auf dein Mikrofon.', staff: 'Gespielte Note',
};
type TunerCopy = typeof de;
export const TUNER_COPY: Record<Language, TunerCopy> = {
  de,
  en: { title: 'Tuner', instrument: 'B♭ trumpet', concert: 'Concert pitch', start: 'Enable microphone', stop: 'Stop microphone', ready: 'Ready to tune', waiting: 'Waiting for your note …', low: 'Too low', high: 'Too high', tuned: 'In tune!', reference: 'Reference pitch', decrease: 'Lower reference pitch', increase: 'Raise reference pitch', close: 'Close', microphoneError: 'Microphone unavailable. Please allow access to your microphone.', staff: 'Played note' },
  es: { title: 'Afinador', instrument: 'Trompeta en Si♭', concert: 'Sonido real', start: 'Activar micrófono', stop: 'Detener micrófono', ready: 'Listo para afinar', waiting: 'Esperando tu nota …', low: 'Demasiado grave', high: 'Demasiado agudo', tuned: '¡Afinado!', reference: 'Diapasón', decrease: 'Bajar el diapasón', increase: 'Subir el diapasón', close: 'Cerrar', microphoneError: 'Micrófono no disponible. Permite el acceso a tu micrófono.', staff: 'Nota tocada' },
  sl: { title: 'Uglaševalnik', instrument: 'Trobenta v B♭', concert: 'Koncertni ton', start: 'Vklopi mikrofon', stop: 'Ustavi mikrofon', ready: 'Pripravljeno za uglaševanje', waiting: 'Čakam na tvoj ton …', low: 'Prenizko', high: 'Previsoko', tuned: 'Uglašeno!', reference: 'Referenčni ton', decrease: 'Znižaj referenčni ton', increase: 'Zvišaj referenčni ton', close: 'Zapri', microphoneError: 'Mikrofon ni na voljo. Dovoli dostop do mikrofona.', staff: 'Zaigrana nota' },
};