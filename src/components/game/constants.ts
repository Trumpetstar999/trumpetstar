// Music theory constants for the NoteRunner game

export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// All chromatic notes with MIDI numbers for range selection
// Written pitch for Bb Trumpet, range roughly from F#3 to C6
export interface NoteInfo {
  name: string;       // e.g. "C4"
  midi: number;
  staffPosition: number; // semitones from middle C (C4=0)
}

// Generate all notes in trumpet written range
export function generateNoteRange(): NoteInfo[] {
  const notes: NoteInfo[] = [];
  for (let midi = 54; midi <= 84; midi++) { // F#3 to C6
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    const name = NOTE_NAMES_SHARP[noteIndex] + octave;
    notes.push({ name, midi, staffPosition: midi - 60 }); // C4 = 0
  }
  return notes;
}

export const ALL_NOTES = generateNoteRange();

// Scale intervals (semitones from root)
export const SCALE_INTERVALS: Record<string, number[]> = {
  major:            [0, 2, 4, 5, 7, 9, 11],
  natural_minor:    [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor:   [0, 2, 3, 5, 7, 8, 11],
  melodic_minor:    [0, 2, 3, 5, 7, 9, 11],
  major_pentatonic: [0, 2, 4, 7, 9],
  minor_pentatonic: [0, 3, 5, 7, 10],
  blues:            [0, 3, 5, 6, 7, 10],
  chromatic:        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const SCALE_DISPLAY_NAMES: Record<string, string> = {
  major: 'Major (Dur)',
  natural_minor: 'Natural Minor',
  harmonic_minor: 'Harmonic Minor',
  melodic_minor: 'Melodic Minor',
  major_pentatonic: 'Major Pentatonic',
  minor_pentatonic: 'Minor Pentatonic',
  blues: 'Blues',
  chromatic: 'Chromatic',
};

export const KEY_NAMES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

// Key to root note index (in chromatic scale)
export const KEY_TO_ROOT: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11,
};

// Key signatures: number of sharps (positive) or flats (negative)
export const KEY_SIGNATURES: Record<string, number> = {
  'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
  'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7,
};

// Get notes in a given key + scale within a MIDI range
export function getScaleNotes(key: string, scaleType: string, minMidi: number, maxMidi: number): number[] {
  const root = KEY_TO_ROOT[key] ?? 0;
  const intervals = SCALE_INTERVALS[scaleType] ?? SCALE_INTERVALS.chromatic;
  const notes: number[] = [];

  for (let midi = minMidi; midi <= maxMidi; midi++) {
    const noteInOctave = ((midi % 12) - root + 12) % 12;
    if (intervals.includes(noteInOctave)) {
      notes.push(midi);
    }
  }
  return notes;
}

// Weighted note selection (tonic, dominant, third more likely)
export function getWeightedNote(scaleNotes: number[], key: string): number {
  const root = KEY_TO_ROOT[key] ?? 0;
  const weighted: number[] = [];

  for (const midi of scaleNotes) {
    const interval = ((midi % 12) - root + 12) % 12;
    // Tonic (0), Third (4 or 3), Fifth (7) get extra weight
    if (interval === 0 || interval === 4 || interval === 3 || interval === 7) {
      weighted.push(midi, midi); // double weight
    }
    weighted.push(midi);
  }

  return weighted[Math.floor(Math.random() * weighted.length)];
}

// MIDI to note name
export function midiToNoteName(midi: number, useFlats: boolean = false): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const names = useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return names[noteIndex] + octave;
}

// Note name to MIDI
export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return 60;
  const [, note, octStr] = match;
  const octave = parseInt(octStr);
  const noteIndex = NOTE_NAMES_SHARP.indexOf(note) !== -1
    ? NOTE_NAMES_SHARP.indexOf(note)
    : NOTE_NAMES_FLAT.indexOf(note);
  return (octave + 1) * 12 + (noteIndex === -1 ? 0 : noteIndex);
}

// Staff position for rendering (0 = B4 line, each step = half line spacing)
// Returns position where 0=middle line (B4), positive=up, negative=down
export function midiToStaffPosition(midi: number): number {
  // Map MIDI to diatonic position relative to treble clef
  // B4 = middle line of treble clef = position 0
  // Each staff line/space = 1 unit
  const noteInOctave = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  
  // Diatonic positions within octave (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
  const diatonicMap = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // chromatic to diatonic
  const diatonicPos = diatonicMap[noteInOctave];
  
  // B4 is our reference (MIDI 71, octave 4, diatonic 6)
  // Position relative to B4
  const refOctave = 4;
  const refDiatonic = 6;
  
  return (octave - refOctave) * 7 + diatonicPos - refDiatonic;
}

// Check if a note needs ledger lines
export function getLedgerLines(staffPos: number): number[] {
  const lines: number[] = [];
  // Staff lines are at positions: -4 (E4), -2 (G4), 0 (B4), 2 (D5), 4 (F5)
  if (staffPos <= -6) {
    // Below staff: C4 is at -6
    for (let p = -6; p >= staffPos; p -= 2) {
      lines.push(p);
    }
  }
  if (staffPos >= 6) {
    // Above staff: A5 is at 6
    for (let p = 6; p <= staffPos; p += 2) {
      lines.push(p);
    }
  }
  return lines;
}

// Accidental type for a note
export function getNoteAccidental(midi: number): 'sharp' | 'flat' | 'natural' | null {
  const noteInOctave = midi % 12;
  const hasAccidental = [1, 3, 6, 8, 10].includes(noteInOctave);
  if (!hasAccidental) return null;
  return 'sharp'; // default to sharp, key signature handling adjusts this
}

// Range presets
export const RANGE_PRESETS = {
  easy: { min: 'C4', max: 'G5', minMidi: 60, maxMidi: 79 },
  normal: { min: 'A3', max: 'C6', minMidi: 57, maxMidi: 84 },
  hard: { min: 'F#3', max: 'C6', minMidi: 54, maxMidi: 84 },
};

// Game difficulty settings
export const SPEED_SETTINGS = {
  baseSpeed: 60, // pixels per second at speed 1
  speedMultiplier: 15, // additional px/s per speed level
  levelUpInterval: 10, // correct notes before level up
  speedUpPerLevel: 8, // additional px/s per level
};

export const CONFIDENCE_THRESHOLDS = {
  low: 0.005,
  medium: 0.01,
  high: 0.02,
};
