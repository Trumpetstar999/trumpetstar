import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ResetPasswordPage from './ResetPasswordPage';

const auth = vi.hoisted(() => ({ getSession: vi.fn(), exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn(), updateUser: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth } }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/reset-password');
  auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } });
  auth.exchangeCodeForSession.mockResolvedValue({ error: null });
  auth.verifyOtp.mockResolvedValue({ error: null });
  auth.updateUser.mockResolvedValue({ error: null });
});
afterEach(cleanup);
const open = () => render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);

it('rejects a normal session without recovery intent', async () => {
  open();
  await screen.findByText('auth.resetInvalid');
  expect(screen.queryByLabelText('auth.newPassword')).toBeNull();
});
it('accepts recovery intent captured before lazy route loading and updates password', async () => {
  sessionStorage.setItem('password_recovery_user', 'test-user');
  open();
  fireEvent.change(await screen.findByLabelText('auth.newPassword'), { target: { value: 'TestPassword-2026' } });
  fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'TestPassword-2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'auth.savePassword' }));
  await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: 'TestPassword-2026' }));
  expect(sessionStorage.getItem('password_recovery_user')).toBeNull();
});
it('rejects recovery intent for a different account', async () => {
  sessionStorage.setItem('password_recovery_user', 'different-user');
  open();
  await screen.findByText('auth.resetInvalid');
});
it('exchanges a PKCE code once', async () => {
  window.history.replaceState({}, '', '/reset-password?code=test-code');
  open();
  await screen.findByLabelText('auth.newPassword');
  expect(auth.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith('test-code');
});
it('accepts an implicit recovery session', async () => {
  window.history.replaceState({}, '', '/reset-password#type=recovery');
  open();
  await screen.findByLabelText('auth.newPassword');
  expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
});
it('rejects expired callback errors even with an existing session', async () => {
  window.history.replaceState({}, '', '/reset-password#error=access_denied&type=recovery');
  open();
  await screen.findByText('auth.resetInvalid');
  expect(auth.updateUser).not.toHaveBeenCalled();
});