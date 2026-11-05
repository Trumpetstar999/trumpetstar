import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rpc: vi.fn(), upload: vi.fn(), download: vi.fn(), remove: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'uploader' } }) }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: () => ({ language: 'de' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: state.rpc,
  storage: { from: () => ({ upload: state.upload, download: state.download, remove: state.remove }) },
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }), removeChannel: vi.fn(),
} }));
import { FeedbackMessaging } from './FeedbackMessaging';
const thread = { chatId: 'chat', messages: [] };
beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  state.rpc.mockImplementation(async (name: string) => ({ data: name === 'feedback_inbox' ? { teacher: false, contacts: [{ studentId: 'student', teacherId: 'teacher', name: 'Teacher', unread: 0 }] } : thread, error: null }));
  state.upload.mockResolvedValue({ error: null });
  state.remove.mockResolvedValue({ error: null });
});
afterEach(cleanup);
async function mount() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><FeedbackMessaging /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Video hinzufügen' })).not.toBeDisabled());
}
describe('teacher video messaging flow', () => {
  it('uploads a video and persists its path without requiring text', async () => {
    await mount();
    const file = new File(['video'], 'lesson.mp4', { type: 'video/mp4' });
    fireEvent.change(screen.getByLabelText('Video hinzufügen', { selector: 'input' }), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('feedback_send_video', expect.objectContaining({ p_student: 'student', p_path: expect.stringMatching(/^feedback\/chat\/uploader\/.+\.mp4$/), p_content: undefined })));
    expect(state.upload).toHaveBeenCalledWith(expect.any(String), file, { contentType: 'video/mp4', upsert: false });
  });
  it('retries the same uploaded path after a failed message response', async () => {
    await mount();
    state.rpc.mockImplementation(async (name: string) => name === 'feedback_send_video' ? { error: new Error('temporary') } : { data: thread, error: null });
    fireEvent.change(screen.getByLabelText('Video hinzufügen', { selector: 'input' }), { target: { files: [new File(['video'], 'lesson.mp4', { type: 'video/mp4' })] } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My lesson' } });
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const first = state.rpc.mock.calls.find(call => call[0] === 'feedback_send_video')?.[1];
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    await waitFor(() => expect(state.rpc.mock.calls.filter(call => call[0] === 'feedback_send_video')).toHaveLength(2));
    expect(state.upload).toHaveBeenCalledTimes(1);
    expect(state.rpc.mock.calls.filter(call => call[0] === 'feedback_send_video')[1][1]).toEqual(first);
    expect(first.p_content).toBe('My lesson');
  });
  it('does not upload when a selected attachment is removed', async () => {
    await mount();
    fireEvent.change(screen.getByLabelText('Video hinzufügen', { selector: 'input' }), { target: { files: [new File(['video'], 'lesson.mp4', { type: 'video/mp4' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Video entfernen' }));
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
    expect(state.upload).not.toHaveBeenCalled();
  });
  it('loads received video bytes only after playback is requested', async () => {
    state.rpc.mockImplementation(async (name: string) => ({ data: name === 'feedback_inbox' ? { teacher: false, contacts: [{ studentId: 'student', name: 'Teacher' }] } : { ...thread, messages: [{ id: 'video-message', sender_user_id: 'teacher', created_at: new Date().toISOString(), message_type: 'video', video_storage_path: 'feedback/chat/teacher/video.mp4' }] }, error: null }));
    state.download.mockResolvedValue({ data: new Blob(['video'], { type: 'video/mp4' }), error: null });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-video');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    await mount();
    expect(state.download).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Video abspielen' }));
    await waitFor(() => expect(document.querySelector('video')?.getAttribute('src')).toBe('blob:test-video'));
    expect(state.download).toHaveBeenCalledWith('feedback/chat/teacher/video.mp4');
    cleanup();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-video');
  });
});