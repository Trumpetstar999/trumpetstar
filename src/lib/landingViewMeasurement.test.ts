import { describe, expect, it } from 'vitest';
import { isMeasuredLandingPath, landingViewMeasurement } from './landingViewMeasurement';

describe('live landing-page measurement', () => {
  it('enables capture and refreshes every fifteen seconds', () => {
    expect(landingViewMeasurement.status).toBe('active');
    expect(landingViewMeasurement.refreshInterval).toBe(15000);
  });
  it('counts only the marketing landing page, not home or app traffic', () => {
    expect(isMeasuredLandingPath('/trompete-lernen-app')).toBe(true);
    for (const path of ['/', '/app', '/app/admin', '/pricing', '/auth']) expect(isMeasuredLandingPath(path)).toBe(false);
  });
});