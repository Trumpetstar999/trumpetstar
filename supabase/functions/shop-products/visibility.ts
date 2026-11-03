/** Only an explicitly inactive provider product stays hidden on first import. */
export function initialShopVisibility(active: unknown): boolean {
  if (active === false || active === 0) return false;
  if (typeof active === 'string') {
    return !['N', 'NO', 'FALSE', '0'].includes(active.trim().toUpperCase());
  }
  return true;
}