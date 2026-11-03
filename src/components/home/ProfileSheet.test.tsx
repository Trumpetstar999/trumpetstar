import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileSheet } from './ProfileSheet';

const state = vi.hoisted(() => ({ isAdmin: false, isLoading: false, navigate: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ signOut: vi.fn() }) }));
vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => state }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock('./BottomSheet', () => ({ BottomSheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

afterEach(() => { cleanup(); state.isAdmin = false; state.isLoading = false; vi.clearAllMocks(); });

describe('Admin profile access', () => {
  it('opens administration and closes the profile for admins', () => {
    state.isAdmin = true;
    const close = vi.fn();
    render(<ProfileSheet open onClose={close} name="Test" stars={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'home.adminArea' }));
    expect(state.navigate).toHaveBeenCalledWith('/app/admin');
    expect(close).toHaveBeenCalledOnce();
  });
  it('does not offer admin navigation to non-admins', () => {
    render(<ProfileSheet open onClose={vi.fn()} name="Test" stars={0} />);
    expect(screen.queryByRole('button', { name: 'home.adminArea' })).not.toBeInTheDocument();
  });
  it('waits for role verification before offering admin navigation', () => {
    state.isAdmin = true;
    state.isLoading = true;
    render(<ProfileSheet open onClose={vi.fn()} name="Test" stars={0} />);
    expect(screen.queryByRole('button', { name: 'home.adminArea' })).not.toBeInTheDocument();
  });
});