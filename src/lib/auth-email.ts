import type { SupabaseClient } from '@supabase/supabase-js';

export function authEmailRedirect(origin: string, purpose: 'magiclink' | 'recovery'): string {
  const url = new URL(origin);
  const publicOrigin = ['localhost', '127.0.0.1'].includes(url.hostname) ? 'https://www.trumpetstar.app' : url.origin;
  return `${publicOrigin}/${purpose === 'recovery' ? 'reset-password' : 'auth'}`;
}

export async function requestAuthEmail(client: SupabaseClient, email: string, origin: string, purpose: 'magiclink' | 'recovery') {
  const normalizedEmail = email.trim().toLowerCase();
  const redirectTo = authEmailRedirect(origin, purpose);
  // The managed auth service creates, signs and sends links; no custom mail relay or admin token generation.
  if (purpose === 'recovery') return client.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
  return client.auth.signInWithOtp({ email: normalizedEmail, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
}