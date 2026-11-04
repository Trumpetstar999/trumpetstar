import { describe, expect, it } from 'vitest';
import { beginnerShowcases, orderedBeginnerVideos } from '../beginner-course';
describe('beginner course selection', () => {
  it('uses both German showcases in the requested order', () => { expect(beginnerShowcases('de')).toEqual(['11436499', '11332971']); });
  it('switches to the English showcase', () => { expect(beginnerShowcases('en')).toEqual(['12143230']); });
  it('switches to the Spanish showcase', () => { expect(beginnerShowcases('es')).toEqual(['12198352']); });
  it('uses English videos for Slovenian', () => { expect(beginnerShowcases('sl')).toEqual(['12143230']); });
  it('retains imported provider order regardless of query arrival order', () => {
    expect(orderedBeginnerVideos([{ id: 'third', sort_order: 2 }, { id: 'first', sort_order: 0 }, { id: 'second', sort_order: 1 }]).map(v => v.id)).toEqual(['first', 'second', 'third']);
  });
});