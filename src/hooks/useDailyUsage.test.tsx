import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ user: { id: 'free-user' } as { id: string } | null, plan: 'FREE', loading: false, videos: 0, games: 0, rpc: vi.fn() }));
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('./useMembership', () => ({ useMembership: () => ({ planKey: state.plan, isLoading: state.loading }) }));
vi.mock('./useLanguage', () => ({ useLanguage: () => ({ language: 'de' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: state.rpc,
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { videos_started: state.videos, games_started: state.games }, error: null }) }) }) }) }),
} }));
import { useDailyUsage } from './useDailyUsage';

beforeEach(() => {
  state.user = { id: 'free-user' }; state.plan = 'FREE'; state.loading = false; state.videos = 0; state.games = 0;
  state.rpc.mockReset().mockImplementation(async (_name, args) => ({ data: args.p_type === 'video' ? ++state.videos : ++state.games, error: null }));
});

describe('signed-in free daily allowances', () => {
  it('allows exactly 3 videos and refuses the fourth start', async () => {
    const { result } = renderHook(useDailyUsage);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    for (let n = 1; n <= 3; n++) await act(async () => { expect(await result.current.recordVideoStart()).toBe(true); });
    expect(result.current.videosUsed).toBe(3);
    expect(result.current.canStartVideo()).toBe(false);
    await act(async () => { expect(await result.current.recordVideoStart()).toBe(false); });
  });
  it('allows exactly 3 games, independently from the 3 videos', async () => {
    const { result } = renderHook(useDailyUsage);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    for (let n = 1; n <= 3; n++) await act(async () => {
      expect(await result.current.recordVideoStart()).toBe(true);
      expect(await result.current.recordGameStart()).toBe(true);
    });
    expect(result.current.gamesUsed).toBe(3);
    expect(result.current.canStartGame()).toBe(false);
    await act(async () => { expect(await result.current.recordGameStart()).toBe(false); });
  });
  it('does not apply free quotas to BASIC or PRO', async () => {
    for (const plan of ['BASIC', 'PRO']) {
      state.plan = plan;
      const { result, unmount } = renderHook(useDailyUsage);
      for (let n = 0; n < 4; n++) await act(async () => {
        expect(await result.current.recordVideoStart()).toBe(true);
        expect(await result.current.recordGameStart()).toBe(true);
      });
      unmount();
    }
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it('refuses starts while membership is unknown or signed out', async () => {
    state.loading = true;
    const { result, rerender } = renderHook(useDailyUsage);
    await act(async () => { expect(await result.current.recordVideoStart()).toBe(false); });
    state.loading = false; state.user = null; rerender();
    await act(async () => { expect(await result.current.recordGameStart()).toBe(false); });
    expect(state.rpc).not.toHaveBeenCalled();
  });
});