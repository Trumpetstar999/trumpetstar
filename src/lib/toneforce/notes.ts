// Note utilities. German "H" === English "B"; "B" (preset) === English "Bb".
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type NoteName = string; // e.g. "C", "F#", "B"

// Map user-facing labels (incl. German) to canonical semitone class (0..11, C=0)
const ALIAS: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
  E: 4, F: 5, "F#": 6, Fis: 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10,
  B: 11, H: 11,
};

export function noteToPc(name: string): number {
  const n = ALIAS[name];
  if (n === undefined) throw new Error(`Unknown note: ${name}`);
  return n;
}

export function freqToNote(freq: number, transposeSemitones = 0): { name: string; midi: number; cents: number } {
  const midiFloat = 69 + 12 * Math.log2(freq / 440) + transposeSemitones;
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const pc = ((midi % 12) + 12) % 12;
  return { name: NOTE_NAMES[pc], midi, cents };
}

export type InstrumentKey = "C" | "Bb" | "Eb" | "F";
export const INSTRUMENT_OPTIONS: { id: InstrumentKey; label: string; semitones: number }[] = [
  { id: "C", label: "C (Posaune, Flöte, Klavier)", semitones: 0 },
  { id: "Bb", label: "B♭ (Trompete, Klarinette)", semitones: 2 },
  { id: "Eb", label: "E♭ (Altsaxophon)", semitones: 9 },
  { id: "F", label: "F (Horn)", semitones: 7 },
];
export function instrumentSemitones(id: InstrumentKey | undefined): number {
  return INSTRUMENT_OPTIONS.find((i) => i.id === id)?.semitones ?? 0;
}

export function pcMatches(detectedName: string, targetName: string): boolean {
  return noteToPc(detectedName) === noteToPc(targetName);
}

export const CHORD_PRESETS: { id: string; label: string; notes: [string, string, string] }[] = [
  { id: "C", label: "C-Dur (C-E-G)", notes: ["C", "E", "G"] },
  { id: "F", label: "F-Dur (F-A-C)", notes: ["F", "A", "C"] },
  { id: "G", label: "G-Dur (G-H-D)", notes: ["G", "H", "D"] },
  { id: "B", label: "B-Dur (B-D-F)", notes: ["B", "D", "F"] },
  { id: "D", label: "D-Dur (D-F#-A)", notes: ["D", "F#", "A"] },
];
