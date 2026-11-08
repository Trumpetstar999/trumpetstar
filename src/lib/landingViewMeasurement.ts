export const landingViewMeasurement = {
  status: 'active',
  refreshInterval: 15000,
} as const;

export function isMeasuredLandingPath(path: string): boolean {
  return path === '/trompete-lernen-app';
}