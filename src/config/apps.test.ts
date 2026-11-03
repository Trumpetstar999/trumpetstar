import { describe, it, expect } from 'vitest';
import { HOME_APPS, safeNextPath } from './apps';

describe('homescreen access rules', () => {
  it('locks exactly Beginnerkurs, Videos, Games, Playlists, Feedback, Noten', () => {
    const locked = HOME_APPS.filter((a) => a.requiresAuth).map((a) => a.slug).sort();
    expect(locked).toEqual(['beginner', 'feedback', 'games', 'noten', 'playlists', 'videos']);
  });

  it('keeps Rhythmus, Metronom, Audio, Shop, Tuner, Grifftabelle free', () => {
    const free = HOME_APPS.filter((a) => !a.requiresAuth).map((a) => a.slug).sort();
    expect(free).toEqual(['audio', 'grifftabelle', 'metronom', 'rhythmus', 'shop', 'tuner']);
  });

  it('puts Shop, Noten, Tuner, Grifftabelle in the third row', () => {
    expect(HOME_APPS.slice(8).map((a) => a.slug)).toEqual(['shop', 'noten', 'tuner', 'grifftabelle']);
  });

  it('rejects off-site login destinations', () => {
    expect(safeNextPath('//evil.com')).toBeNull();
    expect(safeNextPath('https://evil.com')).toBeNull();
    expect(safeNextPath('/videos')).toBe('/videos');
  });
});
