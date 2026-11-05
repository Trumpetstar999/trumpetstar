import type { Language } from '@/contexts/LanguageContext';

const de = {
  metronome: 'Metronom', drums: 'Drum Machine', decrease: 'Tempo verringern', increase: 'Tempo erhöhen',
  meter: 'Taktart', sound: 'Klang', accent: 'Akzent auf 1', subdivision: 'Unterteilung', off: 'Aus', eighth: 'Achtel', triplet: 'Triolen',
  click: 'Klick', woodblock: 'Holzblock', beep: 'Signalton', rim: 'Rim', beat: 'Beat', noBeats: 'Keine Beats verfügbar', selectBeat: 'Beat wählen',
  original: 'Original', current: 'Jetzt', nativeMissing: 'Originaltempo unbekannt', loadingBeat: 'Beat wird geladen …',
  chooseLevel: 'Level wählen', tracks: 'Titel', noTracks: 'Keine Titel in diesem Level', searchPlaceholder: 'Alle Titel durchsuchen …', clearSearch: 'Suche löschen',
  settings: 'Einstellungen', transposition: 'Transposition', previous: 'Vorheriger Titel', next: 'Nächster Titel', resetTempo: 'Tempo zurücksetzen',
  loop: 'A–B Loop', enableLoop: 'Loop aktivieren', loopStart: 'Start setzen', loopEnd: 'Ende setzen', on: 'An',
  concert: 'Trompete in B♭', trumpetC: 'Trompete in C', hornF: 'Horn in F', hornEb: 'Horn in E♭', tenorhorn: 'Tenorhorn',
};
type PracticeCopy = typeof de;
const en: PracticeCopy = {
  metronome: 'Metronome', drums: 'Drum Machine', decrease: 'Decrease tempo', increase: 'Increase tempo',
  meter: 'Time signature', sound: 'Sound', accent: 'Accent beat 1', subdivision: 'Subdivision', off: 'Off', eighth: 'Eighth notes', triplet: 'Triplets',
  click: 'Click', woodblock: 'Woodblock', beep: 'Beep', rim: 'Rim', beat: 'Beat', noBeats: 'No beats available', selectBeat: 'Choose a beat',
  original: 'Original', current: 'Now', nativeMissing: 'Original tempo unknown', loadingBeat: 'Loading beat …',
  chooseLevel: 'Choose a level', tracks: 'Tracks', noTracks: 'No tracks in this level', searchPlaceholder: 'Search all tracks …', clearSearch: 'Clear search',
  settings: 'Settings', transposition: 'Transposition', previous: 'Previous track', next: 'Next track', resetTempo: 'Reset tempo',
  loop: 'A–B Loop', enableLoop: 'Enable loop', loopStart: 'Set start', loopEnd: 'Set end', on: 'On',
  concert: 'Trumpet in B♭', trumpetC: 'Trumpet in C', hornF: 'Horn in F', hornEb: 'Horn in E♭', tenorhorn: 'Tenor horn',
};
const es: PracticeCopy = {
  metronome: 'Metrónomo', drums: 'Caja de ritmos', decrease: 'Reducir tempo', increase: 'Aumentar tempo',
  meter: 'Compás', sound: 'Sonido', accent: 'Acento en 1', subdivision: 'Subdivisión', off: 'Desactivado', eighth: 'Corcheas', triplet: 'Tresillos',
  click: 'Clic', woodblock: 'Bloque de madera', beep: 'Pitido', rim: 'Aro', beat: 'Ritmo', noBeats: 'No hay ritmos disponibles', selectBeat: 'Elegir ritmo',
  original: 'Original', current: 'Ahora', nativeMissing: 'Tempo original desconocido', loadingBeat: 'Cargando ritmo …',
  chooseLevel: 'Elegir nivel', tracks: 'Pistas', noTracks: 'No hay pistas en este nivel', searchPlaceholder: 'Buscar en todas las pistas …', clearSearch: 'Borrar búsqueda',
  settings: 'Ajustes', transposition: 'Transposición', previous: 'Pista anterior', next: 'Siguiente pista', resetTempo: 'Restablecer tempo',
  loop: 'Bucle A–B', enableLoop: 'Activar bucle', loopStart: 'Fijar inicio', loopEnd: 'Fijar final', on: 'Activo',
  concert: 'Trompeta en Si♭', trumpetC: 'Trompeta en Do', hornF: 'Trompa en Fa', hornEb: 'Trompa en Mi♭', tenorhorn: 'Bombardino tenor',
};
const sl: PracticeCopy = {
  metronome: 'Metronom', drums: 'Bobenski ritmi', decrease: 'Znižaj tempo', increase: 'Zvišaj tempo',
  meter: 'Taktovski način', sound: 'Zvok', accent: 'Poudarek na 1', subdivision: 'Poddelitev', off: 'Izklop', eighth: 'Osminke', triplet: 'Triole',
  click: 'Klik', woodblock: 'Leseni blok', beep: 'Pisk', rim: 'Obroč', beat: 'Ritem', noBeats: 'Ni razpoložljivih ritmov', selectBeat: 'Izberi ritem',
  original: 'Izvirno', current: 'Zdaj', nativeMissing: 'Izvirni tempo ni znan', loadingBeat: 'Nalaganje ritma …',
  chooseLevel: 'Izberi lekcijo', tracks: 'Skladbe', noTracks: 'V tej lekciji ni skladb', searchPlaceholder: 'Išči po vseh skladbah …', clearSearch: 'Počisti iskanje',
  settings: 'Nastavitve', transposition: 'Transpozicija', previous: 'Prejšnja skladba', next: 'Naslednja skladba', resetTempo: 'Ponastavi tempo',
  loop: 'Zanka A–B', enableLoop: 'Vklopi zanko', loopStart: 'Nastavi začetek', loopEnd: 'Nastavi konec', on: 'Vklop',
  concert: 'Trobenta v B♭', trumpetC: 'Trobenta v C', hornF: 'Rog v F', hornEb: 'Rog v E♭', tenorhorn: 'Tenorski rog',
};

export const PRACTICE_COPY: Record<Language, PracticeCopy> = { de, en, es, sl };