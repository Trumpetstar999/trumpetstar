import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { MobileRouteGuard } from './MobileRouteGuard';

vi.mock('@/hooks/useMiniMode', () => ({ useMiniMode: () => true }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'recovery-user' }, loading: false }) }));

it('keeps authenticated mobile recovery on the public reset route', async () => {
  let currentPath = '';
  function Capture() {
    currentPath = useLocation().pathname;
    return null;
  }
  render(<MemoryRouter initialEntries={['/reset-password']}><MobileRouteGuard><Routes><Route path="*" element={<Capture />} /></Routes></MobileRouteGuard></MemoryRouter>);
  await waitFor(() => expect(currentPath).toBe('/reset-password'));
});

it.each(['/admin', '/admin/users', '/app/legacy', '/games', '/app/game/play', '/app/game/toneforce/play', '/app/game/happybeginners/play', '/snowtone'])('keeps smartphone page at %s instead of legacy mobile', async (path) => {
  let currentPath = '';
  function Capture() {
    currentPath = useLocation().pathname;
    return null;
  }
  render(<MemoryRouter initialEntries={[path]}><MobileRouteGuard><Capture /></MobileRouteGuard></MemoryRouter>);
  await waitFor(() => expect(currentPath).toBe(path));
});

it.each([['/mobile/home', '/'], ['/mobile/plan', '/pricing'], ['/mobile/profile', '/profile'], ['/mobile/help', '/help'], ['/mobile/locked', '/']])('replaces old link %s with %s', async (oldPath, destination) => {
  let currentPath = '';
  function Capture() { currentPath = useLocation().pathname; return null; }
  render(<MemoryRouter initialEntries={[oldPath]}><MobileRouteGuard><Capture /></MobileRouteGuard></MemoryRouter>);
  await waitFor(() => expect(currentPath).toBe(destination));
});