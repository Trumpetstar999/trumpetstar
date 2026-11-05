import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ loadTrack: vi.fn(), searches: [] as string[] }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ language: 'de', t: (key: string) => key }) }));
vi.mock('@/hooks/useAudioPlayer', () => ({ useAudioPlayer: () => ({ currentTrack: null, loop: { enabled: false, start: 0, end: 0 }, duration: 0, currentTime: 0, tempo: 100, stop: vi.fn(), loadTrack: state.loadTrack }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const builder = {
    select: () => builder, order: () => builder,
    eq: () => builder,
    ilike: (_field: string, query: string) => { state.searches.push(query); return builder; },
    range: async () => ({ data: Array.from({ length: 61 }, (_, i) => ({ id: `other-${i}`, display_name: `Other level song ${i}`, storage_url: 'audio-url' })) }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'audio_levels' ? [{ id: 'level-1', name: 'Level 1' }] : [{ position: 1, audio_files: { id: 'first', display_name: 'First level song', storage_url: 'first-url' } }] }).then(resolve),
  }; return builder;
} } }));
import { AudioPlayer } from './AudioPlayer';
afterEach(cleanup);
describe('global audio title search', () => {
  it('finds tracks outside the selected level, including more than 50 matches, and restores the level when cleared', async () => {
    render(<AudioPlayer />);
    await screen.findByRole('button', { name: /First level song/ });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Other' } });
    await screen.findByRole('button', { name: /Other level song 60/ });
    expect(screen.getAllByRole('button', { name: /Other level song/ })).toHaveLength(61);
    expect(state.searches).toContain('%Other%');
    fireEvent.click(screen.getByRole('button', { name: /Other level song 60/ }));
    expect(state.loadTrack).toHaveBeenCalledWith(expect.objectContaining({ id: 'other-60' }));
    fireEvent.click(screen.getByRole('button', { name: 'Suche löschen' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /First level song/ })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Other level song 60/ })).not.toBeInTheDocument();
  });
});