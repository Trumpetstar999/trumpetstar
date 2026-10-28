export function hasRecoveryCallback(url: URL): boolean {
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  return hash.get('type') === 'recovery' ||
    (url.searchParams.get('type') === 'recovery' && url.searchParams.has('token_hash'));
}

export function shouldRouteToRecovery(url: URL, event?: string): boolean {
  return event === 'PASSWORD_RECOVERY' || hasRecoveryCallback(url);
}