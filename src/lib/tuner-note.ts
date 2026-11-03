import type { Language } from '@/contexts/LanguageContext';

const NOTE_NAMES: Record<Language, string[]> = {
  de: ['C', 'Cis', 'D', 'Es', 'E', 'F', 'Fis', 'G', 'As', 'A', 'B', 'H'],
  en: ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'],
  es: ['Do', 'Do♯', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'],
  sl: ['C', 'Cis', 'D', 'Es', 'E', 'F', 'Fis', 'G', 'As', 'A', 'B', 'H'],
};

export function writtenTunerNote(noteIndex: number, octave: number, trumpet: boolean, language: Language = 'en') {
  const midi = (octave + 1) * 12 + noteIndex + (trumpet ? 2 : 0);
  const index = ((midi % 12) + 12) % 12;
  const writtenOctave = Math.floor(midi / 12) - 1;
  const names = NOTE_NAMES[language];
  const keys = ['c', 'c', 'd', 'e', 'e', 'f', 'f', 'g', 'a', 'a', 'b', 'b'];
  const accidentals = ['', '#', '', 'b', '', '', '#', '', 'b', '', 'b', ''];
  return { name: names[index], octave: writtenOctave, key: `${keys[index]}/${writtenOctave}`, accidental: accidentals[index] };
}

export function tuningDirection(cents: number): 'low' | 'high' | 'tuned' {
  return Math.abs(cents) <= 5 ? 'tuned' : cents < 0 ? 'low' : 'high';
}