import { describe, expect, it } from 'vitest';
import { DESCENDING_FINGERINGS, FINGERINGS } from '../fingering';

describe('descending chromatic trumpet fingerings', () => {
  it('descends by semitones from high C to low G flat', () => {
    expect(DESCENDING_FINGERINGS).toHaveLength(31);
    expect(DESCENDING_FINGERINGS[0].name).toBe("c'''");
    expect(DESCENDING_FINGERINGS[30].name).toBe('ges');
    DESCENDING_FINGERINGS.slice(1).forEach((note, i) => {
      expect(note.midi).toBe(DESCENDING_FINGERINGS[i].midi - 1);
    });
  });
  it('spells altered notes with flats, including German B instead of A sharp', () => {
    const altered = DESCENDING_FINGERINGS.filter((note) => note.flat);
    expect(altered).toHaveLength(13);
    expect(altered.slice(0, 5).map((note) => [note.name, note.key])).toEqual([
      ["b''", 'bb/5'], ["as''", 'ab/5'], ["ges''", 'gb/5'], ["es''", 'eb/5'], ["des''", 'db/5'],
    ]);
    expect(DESCENDING_FINGERINGS.every((note) => !note.sharp)).toBe(true);
  });
  it('preserves the original valve combination and sounding pitch for every note', () => {
    DESCENDING_FINGERINGS.forEach((note, i) => {
      const original = FINGERINGS[30 - i];
      expect(note.midi).toBe(original.midi);
      expect(note.valves).toEqual(original.valves);
    });
  });
});