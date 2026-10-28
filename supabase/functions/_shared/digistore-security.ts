// Compatible with Digistore24's official sha_sign.php default (case-sensitive SHA-512).
export async function verifyIpnSignature(raw: Record<string, unknown>, secret: string | null): Promise<boolean> {
  if (!secret || typeof raw.sha_sign !== 'string' || !/^[a-fA-F0-9]{128}$/.test(raw.sha_sign)) return false;
  let canonical = '';
  for (const key of Object.keys(raw).sort()) {
    if (key === 'sha_sign' || key === 'SHASIGN') continue;
    const value = raw[key];
    if (value === null || value === '' || value === false) continue;
    // Flat decoded IPN parameters only; do not ambiguously serialize arrays/objects.
    if (typeof value !== 'string') return false;
    canonical += `${key}=${value}${secret}`;
  }
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-512', new TextEncoder().encode(canonical)));
  const expected = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const received = raw.sha_sign.toUpperCase();
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return diff === 0;
}

export function parseIpnForm(text: string): Record<string, string> {
  const raw: Record<string, string> = Object.create(null);
  for (const [key, value] of new URLSearchParams(text)) {
    if (Object.hasOwn(raw, key)) throw new Error('Duplicate IPN parameter');
    raw[key] = value;
  }
  return raw;
}

export function stripIpnCredentials(raw: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(raw).filter(([key]) =>
    !['sha_sign', 'SHASIGN', 'passphrase', 'secret', 'api_key', 'ipn_passphrase'].includes(key)));
}

export function isManualMembership(membership: { plan_key?: string; active_product_ids?: string[] } | null): boolean {
  return Boolean(membership?.plan_key && membership.plan_key !== 'FREE' && !membership.active_product_ids?.length);
}