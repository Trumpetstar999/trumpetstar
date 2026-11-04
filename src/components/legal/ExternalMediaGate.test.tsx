// @vitest-environment happy-dom
import { useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExternalMediaGate, setMediaPermission } from './ExternalMediaGate';

vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ language: 'de' }) }));
afterEach(() => { cleanup(); setMediaPermission(false); });

describe('external media permission', () => {
  it('does not initialize external media before an explicit grant', () => {
    const initialize = vi.fn();
    function Media() { useEffect(initialize, []); return <iframe title="external video" />; }
    render(<MemoryRouter><ExternalMediaGate><Media /></ExternalMediaGate></MemoryRouter>);
    expect(initialize).toHaveBeenCalledTimes(0);
    fireEvent.click(screen.getByRole('button'));
    expect(initialize).toHaveBeenCalledTimes(1);
  });
  it('unmounts external media immediately on withdrawal', () => {
    const stop = vi.fn();
    function Media() { useEffect(() => stop, []); return <iframe title="external video" />; }
    setMediaPermission(true);
    render(<MemoryRouter><ExternalMediaGate><Media /></ExternalMediaGate></MemoryRouter>);
    expect(stop).toHaveBeenCalledTimes(0);
    act(() => setMediaPermission(false));
    expect(stop).toHaveBeenCalledTimes(1);
  });
});