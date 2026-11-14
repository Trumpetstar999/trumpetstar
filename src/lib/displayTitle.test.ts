import { describe, it, expect } from 'vitest';
import { displayTitle } from './displayTitle';
describe('displayTitle', () => {
  it('removes import prefixes and underscores', () => expect(displayTitle('01_erste_töne_c1')).toBe('Erste töne c¹'));
  it('removes file extensions', () => expect(displayTitle('Tägliche Aufwärmübung.m4v')).toBe('Tägliche Aufwärmübung'));
  it('fixes the known typo', () => expect(displayTitle('Erste Trompetenstunde – ohne Werbnung')).toBe('Erste Trompetenstunde – ohne Werbung'));
  it('keeps normal titles', () => expect(displayTitle('Hallo Elefant')).toBe('Hallo Elefant'));
});
