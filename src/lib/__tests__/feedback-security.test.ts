import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const session = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
const token = session ? JSON.parse(session).access_token as string : undefined;
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const db = createClient(url, key, { global: { headers: token ? { Authorization: `Bearer ${token}` } : {} }, auth: { persistSession: false, autoRefreshToken: false } });
const guest = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe('private feedback video guest restrictions', () => {
  it('denies anonymous video message persistence', async () => {
    const { error } = await guest.rpc('feedback_send_video', { p_student: '00000000-0000-0000-0000-000000000001', p_path: 'feedback/test.mp4' });
    expect(error?.code).toBe('42501');
  });
  it('denies anonymous access to the video read authorization helper', async () => {
    const { error } = await guest.rpc('feedback_video_read_allowed', { p_path: 'feedback/test.mp4' });
    expect(error?.code).toBe('42501');
  });
  it('denies anonymous video uploads', async () => {
    const { error } = await guest.storage.from('feedback-videos').upload(`feedback/guest/${crypto.randomUUID()}.mp4`, new Blob(['test'], { type: 'video/mp4' }), { contentType: 'video/mp4' });
    expect(error).not.toBeNull();
    expect(error?.message.toLowerCase()).toMatch(/row.level security|unauthorized|permission/);
  });
});

describe.skipIf(!token)('live teacher-only feedback permissions', () => {
  it('rejects an unassigned student conversation', async () => {
    const { error } = await db.rpc('feedback_thread', { p_student: '00000000-0000-0000-0000-000000000001' });
    expect(error?.message).toContain('Forbidden');
  });
  it('rejects messages longer than 5000 characters', async () => {
    const { data } = await db.rpc('feedback_inbox');
    const contacts = (data as unknown as { contacts: { studentId: string }[] }).contacts;
    expect(contacts.length).toBeGreaterThan(0);
    const { error } = await db.rpc('feedback_thread', { p_student: contacts[0].studentId, p_content: 'x'.repeat(5001) });
    expect(error?.message).toContain('Invalid message');
  });
  it('blocks direct message writes with a forged sender role', async () => {
    const { data } = await db.rpc('feedback_inbox');
    const contact = (data as unknown as { contacts: { studentId: string; chatId: string }[] }).contacts.find(c => c.chatId);
    expect(contact).toBeDefined();
    if (!contact || !session) throw new Error('No existing test conversation');
    const { error } = await db.from('video_chat_messages').insert({ chat_id: contact.chatId, sender_user_id: JSON.parse(session).user.id, sender_role: 'user', message_type: 'text', content: 'Rejected permission test' });
    expect(error?.code).toBe('42501');
  });
});