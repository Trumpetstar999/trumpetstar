import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ single: vi.fn(), update: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ language: 'de' }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: mocks.success } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({
    select: async () => ({ data: [{ id: '346007', name: 'BASIC', visible: true, price: 15, currency: 'EUR', image_url: null, order_url: 'https://www.digistore24.com/product/346007', is_new: false, sort_override: null, created_at: '2026-11-05' }], error: null }),
    update: (values: unknown) => { mocks.update(values); return { eq: () => ({ select: () => ({ single: mocks.single }) }) }; },
  }),
} }));
import { ShopSection } from './AdminHomeContentManager';

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('admin shop visibility', () => {
  it('persists hiding and showing the same product without changing other fields', async () => {
    mocks.single.mockResolvedValueOnce({ data: { id: '346007', visible: false }, error: null })
      .mockResolvedValueOnce({ data: { id: '346007', visible: true }, error: null });
    render(<ShopSection />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Produkt ausblenden: BASIC' }));
    await screen.findByRole('switch', { name: 'Produkt einblenden: BASIC' });
    expect(mocks.update).toHaveBeenNthCalledWith(1, { visible: false });
    fireEvent.click(screen.getByRole('switch', { name: 'Produkt einblenden: BASIC' }));
    await screen.findByRole('switch', { name: 'Produkt ausblenden: BASIC' });
    expect(mocks.update).toHaveBeenNthCalledWith(2, { visible: true });
  });

  it('keeps the product visible when saving is denied', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: 'denied' } });
    render(<ShopSection />);
    fireEvent.click(await screen.findByRole('switch', { name: 'Produkt ausblenden: BASIC' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(screen.getByRole('switch', { name: 'Produkt ausblenden: BASIC' })).toBeChecked();
  });
});