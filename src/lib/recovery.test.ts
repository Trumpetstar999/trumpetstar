import { expect, it } from 'vitest';
import { hasRecoveryCallback, shouldRouteToRecovery } from './recovery';

it('recognizes recovery hash before the auth client clears it', () => {
  expect(hasRecoveryCallback(new URL('https://www.trumpetstar.app/#type=recovery&access_token=test'))).toBe(true);
});
it('routes a recovery event to password reset instead of the app', () => {
  expect(shouldRouteToRecovery(new URL('https://www.trumpetstar.app/auth'), 'PASSWORD_RECOVERY')).toBe(true);
});
it('does not treat ordinary sessions or magic links as recovery', () => {
  expect(hasRecoveryCallback(new URL('https://www.trumpetstar.app/reset-password'))).toBe(false);
  expect(shouldRouteToRecovery(new URL('https://www.trumpetstar.app/auth#type=magiclink'), 'SIGNED_IN')).toBe(false);
});