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