import { describe, expect, it } from 'vitest';
import { SoundTouch, SimpleFilter } from 'soundtouchjs';
import { loopSource, setDrumTempo } from '../drum-loop';

describe('drum tempo without pitch changes', () => {
  it('changes tempo only, keeping pitch and sample rate at unity', () => {
    const processor = { tempo: 1, pitch: 2, rate: 2 };
    setDrumTempo(processor, 150, 100);
    expect(processor).toEqual({ tempo: 1.5, pitch: 1, rate: 1 });
    setDrumTempo(processor, 50, 100);
    expect(processor).toEqual({ tempo: 0.5, pitch: 1, rate: 1 });
  });
  it('loops across the end instead of outputting silence or invalid samples', () => {
    const source = loopSource({ length: 3, numberOfChannels: 1, getChannelData: () => new Float32Array([1, 2, 3]) });
    const output = new Float32Array(10);
    expect(source.extract(output, 5, 2)).toBe(5);
    expect([...output]).toEqual([3, 3, 1, 1, 2, 2, 3, 3, 1, 1]);
  });
  it('keeps a 440 Hz tone at 440 Hz when tempo doubles or halves', () => {
    const samples = Float32Array.from({ length: 44100 }, (_, i) => Math.sin(2 * Math.PI * 440 * i / 44100));
    for (const bpm of [50, 200]) {
      const processor = new SoundTouch();
      setDrumTempo(processor, bpm, 100);
      const filter = new SimpleFilter(loopSource({ length: samples.length, numberOfChannels: 1, getChannelData: () => samples }), processor);
      const output = new Float32Array(44100 * 2);
      expect(filter.extract(output, 44100)).toBe(44100);
      let crossings = 0;
      for (let i = 1; i < 44100; i++) if (output[2 * (i - 1)] <= 0 && output[2 * i] > 0) crossings++;
      expect(crossings).toBeGreaterThan(435);
      expect(crossings).toBeLessThan(445);
    }
  });
});