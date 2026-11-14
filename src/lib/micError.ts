type Lang = 'de' | 'en' | 'es' | 'sl';
const COPY: Record<Lang, Record<'denied' | 'missing' | 'busy' | 'other', string>> = {
  de: { denied: 'Mikrofon blockiert: Erlaube den Zugriff in den Browser-Einstellungen und lade die Seite neu.', missing: 'Kein Mikrofon gefunden. Schließe ein Mikrofon an oder nutze ein anderes Gerät.', busy: 'Das Mikrofon wird gerade von einer anderen App benutzt. Schließe sie und versuche es erneut.', other: 'Mikrofon konnte nicht gestartet werden. Bitte versuche es erneut.' },
  en: { denied: 'Microphone blocked: allow access in your browser settings and reload the page.', missing: 'No microphone found. Connect one or use another device.', busy: 'The microphone is in use by another app. Close it and try again.', other: 'The microphone could not start. Please try again.' },
  es: { denied: 'Micrófono bloqueado: permite el acceso en el navegador y recarga la página.', missing: 'No se encontró micrófono. Conecta uno o usa otro dispositivo.', busy: 'Otra app está usando el micrófono. Ciérrala e inténtalo de nuevo.', other: 'No se pudo iniciar el micrófono. Inténtalo de nuevo.' },
  sl: { denied: 'Mikrofon je blokiran: dovolite dostop v nastavitvah brskalnika in osvežite stran.', missing: 'Mikrofona ni mogoče najti. Priključite ga ali uporabite drugo napravo.', busy: 'Mikrofon uporablja druga aplikacija. Zaprite jo in poskusite znova.', other: 'Mikrofona ni bilo mogoče zagnati. Poskusite znova.' },
};
export function micErrorKind(err: unknown) {
  const n = (err as { name?: string })?.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'denied' as const;
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'missing' as const;
  if (n === 'NotReadableError' || n === 'AbortError') return 'busy' as const;
  return 'other' as const;
}
export function micErrorMessage(err: unknown, lang?: string): string {
  const l = (['de', 'en', 'es', 'sl'].includes(lang ?? '') ? lang : (typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'de')) as Lang;
  return (COPY[l] ?? COPY.de)[micErrorKind(err)];
}
