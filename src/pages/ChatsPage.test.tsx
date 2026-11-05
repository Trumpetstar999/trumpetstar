import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ plan: 'FREE', admin: false, loading: false, mounted: vi.fn() }));
vi.mock('@/hooks/useMembership', () => ({ useMembership: () => ({ canAccessFeature: () => state.plan === 'PRO', isLoading: state.loading }) }));
vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => ({ isAdmin: state.admin, isLoading: false }) }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ language: 'de' }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/components/chat/FeedbackMessaging', () => ({ FeedbackMessaging: () => { state.mounted(); return <div data-testid="messages" />; } }));
import { ChatsPage } from './ChatsPage';
beforeEach(() => { state.plan = 'FREE'; state.admin = false; state.loading = false; state.mounted.mockClear(); });
describe('PRO teacher feedback', () => {
  it.each(['FREE', 'BASIC'])('does not load messages for %s', plan => {
    state.plan = plan; render(<ChatsPage />); expect(state.mounted).not.toHaveBeenCalled();
  });
  it('loads messages for PRO', () => { state.plan = 'PRO'; render(<ChatsPage />); expect(state.mounted).toHaveBeenCalledOnce(); });
  it('keeps admin access for supporting students', () => { state.admin = true; render(<ChatsPage />); expect(state.mounted).toHaveBeenCalledOnce(); });
  it('does not request messages before membership resolves', () => { state.loading = true; render(<ChatsPage />); expect(state.mounted).not.toHaveBeenCalled(); });
});