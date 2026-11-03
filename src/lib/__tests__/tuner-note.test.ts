import { describe, expect, it } from 'vitest';
import { tuningDirection, writtenTunerNote } from '../tuner-note';

describe('tuner notation and direction', () => {
  it('displays sounding Bb3 as written C4 for Bb trumpet', () => {
    expect(writtenTunerNote(10, 3, true)).toEqual({ name: 'C', octave: 4, key: 'c/4', accidental: '' });
  });
  it('preserves concert pitch when concert mode is selected', () => {
    expect(writtenTunerNote(9, 4, false)).toEqual({ name: 'A', octave: 4, key: 'a/4', accidental: '' });
  });
  it('includes flat signs for written Bb', () => {
    expect(writtenTunerNote(8, 4, true)).toEqual({ name: 'B♭', octave: 4, key: 'b/4', accidental: 'b' });
  });
  it('distinguishes low, centered and high pitches', () => {
    expect(tuningDirection(-20)).toBe('low');
    expect(tuningDirection(20)).toBe('high');
    expect(tuningDirection(-5)).toBe('tuned');
    expect(tuningDirection(5)).toBe('tuned');
    expect(tuningDirection(6)).toBe('high');
  });
});