import type { Language } from '@/contexts/LanguageContext';

const de = {
  bars2: '2 Takte', bars4: '4 Takte', blocks: 'Bausteine', bar: 'Takt', full: 'voll',
  whole: 'Ganze', half: 'Halbe', quarter: 'Viertel', eighths: '2 Achtel', qrest: 'Viertelpause', dotted: 'Punktierte Viertel + Achtel',
  hint: 'Tippe einen Baustein an oder ziehe ihn in einen Takt. Danach Baustein antippen und Töne wählen.',
  noRoom: 'Kein Takt hat mehr genug Platz.', tone: 'Ton', note: 'Note', remove: 'Entfernen', clear: 'Alles leeren',
  play: 'Abspielen', stop: 'Stopp', tempo: 'Tempo', selectBar: 'Takt wählen',
  lessons: 'Lektionen', lesson: 'Lektion', playalong: 'Mitspielen', video: 'Video', back: 'Zurück zur Übersicht',
  otherSheets: 'Weitere Noten',
};
type Copy = typeof de;
const en: Copy = {
  bars2: '2 bars', bars4: '4 bars', blocks: 'Building blocks', bar: 'Bar', full: 'full',
  whole: 'Whole', half: 'Half', quarter: 'Quarter', eighths: '2 eighths', qrest: 'Quarter rest', dotted: 'Dotted quarter + eighth',
  hint: 'Tap a block or drag it into a bar. Then tap a block to choose its notes.',
  noRoom: 'No bar has enough room left.', tone: 'Note', note: 'Note', remove: 'Remove', clear: 'Clear all',
  play: 'Play', stop: 'Stop', tempo: 'Tempo', selectBar: 'Select bar',
  lessons: 'Lessons', lesson: 'Lesson', playalong: 'Play along', video: 'Video', back: 'Back to overview',
  otherSheets: 'More sheet music',
};
const es: Copy = {
  bars2: '2 compases', bars4: '4 compases', blocks: 'Bloques', bar: 'Compás', full: 'lleno',
  whole: 'Redonda', half: 'Blanca', quarter: 'Negra', eighths: '2 corcheas', qrest: 'Silencio de negra', dotted: 'Negra con puntillo + corchea',
  hint: 'Toca un bloque o arrástralo a un compás. Después toca un bloque para elegir sus notas.',
  noRoom: 'Ningún compás tiene espacio suficiente.', tone: 'Nota', note: 'Nota', remove: 'Quitar', clear: 'Borrar todo',
  play: 'Reproducir', stop: 'Parar', tempo: 'Tempo', selectBar: 'Elegir compás',
  lessons: 'Lecciones', lesson: 'Lección', playalong: 'Tocar juntos', video: 'Vídeo', back: 'Volver al resumen',
  otherSheets: 'Más partituras',
};
const sl: Copy = {
  bars2: '2 takta', bars4: '4 takti', blocks: 'Gradniki', bar: 'Takt', full: 'poln',
  whole: 'Cela', half: 'Polovinka', quarter: 'Četrtinka', eighths: '2 osminki', qrest: 'Četrtinska pavza', dotted: 'Pikčasta četrtinka + osminka',
  hint: 'Tapni gradnik ali ga povleci v takt. Nato tapni gradnik in izberi tone.',
  noRoom: 'Noben takt nima več dovolj prostora.', tone: 'Ton', note: 'Nota', remove: 'Odstrani', clear: 'Počisti vse',
  play: 'Predvajaj', stop: 'Ustavi', tempo: 'Tempo', selectBar: 'Izberi takt',
  lessons: 'Lekcije', lesson: 'Lekcija', playalong: 'Igraj zraven', video: 'Video', back: 'Nazaj na pregled',
  otherSheets: 'Več notnega gradiva',
};
export const STAGE_COPY: Record<Language, Copy> = { de, en, es, sl };
