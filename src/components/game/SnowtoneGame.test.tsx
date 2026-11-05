import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnowtoneGame } from './SnowtoneGame';

const usage = vi.hoisted(() => ({ recordGameStart: vi.fn() }));
vi.mock('@/hooks/useDailyUsage', () => ({ useDailyUsage: () => usage }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ language: 'de' }) }));
vi.mock('@/components/premium/DailyLimitOverlay', () => ({ DailyLimitOverlay: () => null }));
const fakeWindow = { postMessage: vi.fn() };
beforeEach(() => { vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue(fakeWindow as unknown as Window); });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });

describe('Snowtone shared game allowance', () => {
  it('checks each of three free starts and denies the fourth', async () => {
    usage.recordGameStart.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { container } = render(<SnowtoneGame />);
    const frame = container.querySelector('iframe');
    if (!frame?.contentWindow) throw new Error('Missing game frame');
    const target = frame.contentWindow;
    const post = vi.spyOn(target, 'postMessage');
    for (let i = 1; i <= 4; i++) {
      await act(async () => window.dispatchEvent(new MessageEvent('message', {
        origin: window.location.origin, source: target, data: { type: 'snowtone-start', id: String(i) },
      })));
      await waitFor(() => expect(post).toHaveBeenCalledWith({ type: 'snowtone-start-result', id: String(i), allowed: i <= 3 }, window.location.origin));
    }
    expect(usage.recordGameStart).toHaveBeenCalledTimes(4);
  });

  it('rejects start messages from another origin or another window', async () => {
    const { container } = render(<SnowtoneGame />);
    const target = container.querySelector('iframe')?.contentWindow;
    if (!target) throw new Error('Missing game frame');
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', { origin: 'https://other.invalid', source: target, data: { type: 'snowtone-start', id: '1' } }));
      window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: window, data: { type: 'snowtone-start', id: '2' } }));
    });
    expect(usage.recordGameStart).not.toHaveBeenCalled();
  });
});