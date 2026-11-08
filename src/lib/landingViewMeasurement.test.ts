import { describe, expect, it } from 'vitest';
import { landingViewMeasurement } from './landingViewMeasurement';

describe('disabled landing-page measurement', () => {
  it('reports unavailable totals rather than zero visitors when capture is disabled', () => {
    expect(landingViewMeasurement.status).toBe('disabled');
    expect(landingViewMeasurement.currentTotals).toBeNull();
  });
});