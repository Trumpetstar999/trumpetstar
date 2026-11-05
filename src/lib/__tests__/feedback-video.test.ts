import { describe, expect, it } from 'vitest';
import { feedbackVideoError, feedbackVideoPath } from '../feedbackVideo';
describe('feedback video attachments', () => {
  it.each(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'])('accepts %s videos', type => {
    expect(feedbackVideoError({ type, size: 1024 })).toBeNull();
  });
  it('rejects non-video files', () => { expect(feedbackVideoError({ type: 'text/html', size: 1024 })).toBe('format'); });
  it('bounds video size to 50 MiB', () => {
    expect(feedbackVideoError({ type: 'video/mp4', size: 52428800 })).toBeNull();
    expect(feedbackVideoError({ type: 'video/mp4', size: 52428801 })).toBe('size');
    expect(feedbackVideoError({ type: 'video/mp4', size: 0 })).toBe('size');
  });
  it('binds opaque paths to the exact conversation and uploader', () => {
    const path = feedbackVideoPath('chat-id', 'user-id', { type: 'video/mp4' });
    expect(path).toMatch(/^feedback\/chat-id\/user-id\/[0-9a-f-]{36}\.mp4$/);
    expect(feedbackVideoPath('chat-id', 'user-id', { type: 'video/mp4' })).not.toBe(path);
  });
});