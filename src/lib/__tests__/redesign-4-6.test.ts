import { describe, expect, it } from 'vitest';
import { FINGERINGS, soundingFrequency } from '../fingering';
import { countUnread, pickLocalized } from '../news';
import { isNewProduct, isSafeShopOrderUrl, sortShopProducts } from '../shop';

const f = (name: string) => FINGERINGS.find((n) => n.name === name)!;

describe('fingering chart', () => {
  it('has all 31 chromatic notes from fis to c\'\'\'', () => {
    expect(FINGERINGS).toHaveLength(31);
    expect(FINGERINGS[0].name).toBe('fis');
    expect(FINGERINGS[30].name).toBe("c'''");
    FINGERINGS.forEach((n, i) => i > 0 && expect(n.midi - FINGERINGS[i - 1].midi).toBe(1));
  });
  it('uses the standard fingerings from the instructions', () => {
    expect(f('fis').valves).toEqual([1, 2, 3]);
    expect(f('g').valves).toEqual([1, 3]);
    expect(f("cis'").valves).toEqual([1, 2, 3]);
    expect(f("g'").valves).toEqual([]);
    expect(f("gis'").valves).toEqual([2, 3]);
    expect(f("cis''").valves).toEqual([1, 2]);
    expect(f("dis''").valves).toEqual([2]);
    expect(f("gis''").valves).toEqual([2, 3]);
    expect(f("c'''").valves).toEqual([]);
  });
  it('maps notation keys and sounds a whole tone lower', () => {
    expect(f('fis').key).toBe('f#/3');
    expect(f("h''").key).toBe('b/5');
    expect(soundingFrequency(f("c''").midi)).toBeCloseTo(466.16, 1); // written c'' = sounding b♭'
  });
});

describe('news bell', () => {
  it('counts only unread updates', () => {
    expect(countUnread([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['b'])).toBe(2);
    expect(countUnread([{ id: 'a' }], ['a'])).toBe(0);
  });
  it('falls back to German text', () => {
    expect(pickLocalized({ de: 'Hallo', en: 'Hi' }, 'sl')).toBe('Hallo');
    expect(pickLocalized({ de: 'Hallo', en: 'Hi' }, 'en')).toBe('Hi');
  });
});

describe('shop', () => {
  const now = Date.parse('2026-11-03T00:00:00Z');
  it('marks products new within 60 days or when flagged', () => {
    expect(isNewProduct({ is_new: false, created_at: '2026-10-01T00:00:00Z' }, now)).toBe(true);
    expect(isNewProduct({ is_new: false, created_at: '2026-08-01T00:00:00Z' }, now)).toBe(false);
    expect(isNewProduct({ is_new: true, created_at: '2020-01-01T00:00:00Z' }, now)).toBe(true);
  });
  it('sorts manual order first, then newest first', () => {
    const list = sortShopProducts([
      { id: 'old', sort_override: null, created_at: '2020-01-01' },
      { id: 'new', sort_override: null, created_at: '2026-01-01' },
      { id: 'pin2', sort_override: 2, created_at: '2019-01-01' },
      { id: 'pin1', sort_override: 1, created_at: '2018-01-01' },
    ]);
    expect(list.map((p) => p.id)).toEqual(['pin1', 'pin2', 'new', 'old']);
  });
  it('only allows Digistore24 product order pages', () => {
    expect(isSafeShopOrderUrl('https://www.digistore24.com/product/345999')).toBe(true);
    expect(isSafeShopOrderUrl('https://evil.example/product/345999')).toBe(false);
    expect(isSafeShopOrderUrl('http://www.digistore24.com/product/345999')).toBe(false);
    expect(isSafeShopOrderUrl('https://www.digistore24.com/product/abc')).toBe(false);
  });
});
