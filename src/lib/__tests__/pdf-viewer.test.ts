import { describe, it, expect } from 'vitest';
import { buildCurrentPagePrint, clampPage, findTextMatches, normalizePoint } from '../pdf-viewer';

describe('PDF viewer rules', () => {
  it('prints exactly one rendered current-page image and accepts no page range', () => {
    const html = buildCurrentPagePrint('data:image/png;base64,Y3VycmVudA==', 600, 800);
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).toContain('src="data:image/png;base64,Y3VycmVudA=="');
    expect(() => buildCurrentPagePrint('https://example.com/book.pdf', 600, 800)).toThrow();
  });
  it('keeps finger and Pencil marks anchored to the same document point after zoom', () => {
    expect(normalizePoint(150, 200, 300, 400)).toEqual(normalizePoint(450, 600, 900, 1200));
    expect(normalizePoint(-2, 800, 300, 400, 0.8)).toEqual({ x: 0, y: 1, pressure: 0.8 });
  });
  it('finds repeated case-insensitive text and ignores blank searches', () => {
    expect(findTextMatches('Trumpet trumpet TRUMPET', 'trumpet')).toEqual([0, 8, 16]);
    expect(findTextMatches('Trumpet', ' ')).toEqual([]);
  });
  it('cannot navigate outside real PDF page boundaries', () => {
    expect(clampPage(0, 12)).toBe(1); expect(clampPage(13, 12)).toBe(12);
  });
});