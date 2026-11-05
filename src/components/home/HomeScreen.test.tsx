import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';

const state = vi.hoisted(() => ({ planKey: 'BASIC', navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test', email: 'test@example.test', user_metadata: {} } }) }));
vi.mock('@/hooks/useMembership', () => ({ useMembership: () => ({ planKey: state.planKey, isLoading: false }) }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key, language: 'de', hasCompletedLanguageSetup: true }) }));
vi.mock('@/hooks/useUnreadMessages', () => ({ useUnreadMessages: () => 0 }));
vi.mock('@/hooks/useAppUpdates', () => ({ useAppUpdates: () => ({ updates: [], unread: 0, markAllRead: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }), then: (fn: (data: unknown) => void) => Promise.resolve({ count: 0 }).then(fn) }) }) }) } }));
vi.mock('@/components/onboarding/LanguageSelectionDialog', () => ({ LanguageSelectionDialog: () => null }));
vi.mock('./LoginSheet', () => ({ LoginSheet: () => null }));
vi.mock('./LanguageSheet', () => ({ LanguageSheet: () => null, HOME_LANGUAGES: [] }));
vi.mock('./NewsSheet', () => ({ NewsSheet: () => null }));
vi.mock('./ProfileSheet', () => ({ ProfileSheet: ({ open }: { open: boolean }) => open ? <div role="dialog" aria-label="Profile" /> : null }));
vi.mock('./ShopCarousel', () => ({ ShopCarousel: () => null }));
vi.mock('@/components/legal/LegalLinks', () => ({ LegalLinks: () => null }));
vi.mock('./ShopPurchaseDialog', () => ({ ShopPurchaseDialog: ({ product, onClose }: { product: { id: string }; onClose: () => void }) => <div role="dialog" aria-label="Upgrade"><output data-testid="product">{product.id}</output><button onClick={onClose}>Close</button></div> }));

afterEach(() => { cleanup(); state.planKey = 'BASIC'; vi.clearAllMocks(); });
describe('Home membership actions', () => {
  it('opens the PRO purchase selection from BASIC without opening the profile', () => {
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Mitgliedsstatus: BASIC' }));
    expect(screen.getByTestId('product').textContent).toBe('575565');
    expect(screen.queryByRole('dialog', { name: 'Profile' })).toBeNull();
    expect(state.navigate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Upgrade' })).toBeNull();
  });
  it('keeps PRO status linked to the profile', () => {
    state.planKey = 'PRO';
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Mitgliedsstatus: PRO' }));
    expect(screen.getByRole('dialog', { name: 'Profile' })).toBeInTheDocument();
  });
  it('keeps FREE upgrade linked to pricing', () => {
    state.planKey = 'FREE';
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    expect(state.navigate).toHaveBeenCalledWith('/pricing');
  });
});