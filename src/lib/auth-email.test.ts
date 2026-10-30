import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authEmailRedirect, requestAuthEmail } from './auth-email';

describe('auth email requests', () => {
  it('uses a public password recovery return address in local previews', () => {
    expect(authEmailRedirect('http://localhost:8080', 'recovery')).toBe('https://www.trumpetstar.app/reset-password');
  });
  it('returns magic links to the public auth page on the current domain', () => {
    expect(authEmailRedirect('https://www.trumpetstar.app', 'magiclink')).toBe('https://www.trumpetstar.app/auth');
  });
  it('requests managed magic links without creating unsolicited accounts', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signInWithOtp } } as unknown as SupabaseClient;
    await requestAuthEmail(client, ' TEST@EXAMPLE.COM ', 'https://www.trumpetstar.app', 'magiclink');
    expect(signInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com', options: { emailRedirectTo: 'https://www.trumpetstar.app/auth', shouldCreateUser: false } });
  });
  it('requests recovery from the managed auth service', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { resetPasswordForEmail } } as unknown as SupabaseClient;
    await requestAuthEmail(client, ' TEST@EXAMPLE.COM ', 'https://www.trumpetstar.app', 'recovery');
    expect(resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', { redirectTo: 'https://www.trumpetstar.app/reset-password' });
  });
});