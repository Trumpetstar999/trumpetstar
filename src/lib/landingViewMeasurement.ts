// Automatic marketing-page visitor logging was removed during privacy hardening.
// Historical rows remain useful, but cannot establish current visitor totals.
export const landingViewMeasurement = {
  status: 'disabled',
  currentTotals: null,
} as const;