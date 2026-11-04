import { expect, it } from 'vitest';
import { vimeoPlayerUrl } from '../vimeo-player-url';
it('retains the provider unlisted hash needed for playback', () => {
  expect(new URL(vimeoPlayerUrl('1025459773', 'https://player.vimeo.com/video/1025459773?h=c80577adc2')).searchParams.get('h')).toBe('c80577adc2');
});
it('rejects foreign iframe hosts and mismatched video hashes', () => {
  expect(new URL(vimeoPlayerUrl('1025459773', 'https://evil.example/video/1025459773?h=secret')).searchParams.has('h')).toBe(false);
  expect(new URL(vimeoPlayerUrl('1025459773', 'https://player.vimeo.com/video/123?h=secret')).searchParams.has('h')).toBe(false);
});