import { describe, expect, it } from 'vitest';
import { barFill, emptyBars, events, placeBlock, resizeBars, setPitch } from '../rhythm';

describe('rhythm builder', () => {
  it('a bar accepts blocks only until 4 beats are full', () => {
    let bars = emptyBars(2);
    bars = placeBlock(bars, 'half', 0)!;
    bars = placeBlock(bars, 'dotted', 0)!;
    expect(barFill(bars[0])).toBe(8);
    const next = placeBlock(bars, 'quarter', 0)!;
    expect(next[0]).toHaveLength(2);
    expect(next[1]).toHaveLength(1);
  });

  it('returns null when every bar is full', () => {
    let bars = emptyBars(2);
    bars = placeBlock(bars, 'whole')!;
    bars = placeBlock(bars, 'whole')!;
    expect(placeBlock(bars, 'eighths')).toBeNull();
  });

  it('switches between 2 and 4 bars', () => {
    expect(emptyBars(4)).toHaveLength(4);
    const bars = placeBlock(emptyBars(4), 'whole', 3)!;
    expect(resizeBars(bars, 2)).toHaveLength(2);
    expect(resizeBars(resizeBars(emptyBars(2), 4), 4)).toHaveLength(4);
  });

  it('assigns a scale tone to each note head', () => {
    let bars = placeBlock(emptyBars(2), 'eighths')!;
    bars = setPitch(bars, 0, 0, 1, 7);
    expect(bars[0][0].pitches).toEqual([4, 7]);
    expect(setPitch(bars, 0, 0, 1, 99)).toBe(bars);
    expect(events(bars).map((e) => e.pitch)).toEqual([4, 7]);
  });
});
