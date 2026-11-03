export function writtenTunerNote(noteIndex: number, octave: number, trumpet: boolean) {
  const midi = (octave + 1) * 12 + noteIndex + (trumpet ? 2 : 0);
  const index = ((midi % 12) + 12) % 12;
  const writtenOctave = Math.floor(midi / 12) - 1;
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const keys = ['c', 'c', 'd', 'e', 'e', 'f', 'f', 'g', 'a', 'a', 'b', 'b'];
  const accidentals = ['', '#', '', 'b', '', '', '#', '', 'b', '', 'b', ''];
  return { name: names[index], octave: writtenOctave, key: `${keys[index]}/${writtenOctave}`, accidental: accidentals[index] };
}

export function tuningDirection(cents: number): 'low' | 'high' | 'tuned' {
  return Math.abs(cents) <= 5 ? 'tuned' : cents < 0 ? 'low' : 'high';
}