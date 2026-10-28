// Run explicitly with TEST_AUTH_URL, TEST_ANON_KEY and TEST_ADMIN_TOKEN.
// Credentials must come from the environment, never fixtures or output.
import { describe, expect, it } from 'vitest';

const base = process.env.TEST_AUTH_URL;
const key = process.env.TEST_ANON_KEY;
const token = process.env.TEST_ADMIN_TOKEN;
describe.skipIf(!base || !key || !token)('deployed read access', () => {
  it.each(['audio_files', 'audio_levels', 'audio_level_items', 'review_settings', 'email_templates', 'vimeo_sync_log'])('%s blocks anonymous reads and preserves admin reads', async (table) => {
    if (!base || !key || !token) throw new Error('Missing integration test credentials');
    const url = `${base}/rest/v1/${table}?select=id&limit=1`;
    const anonymous = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    expect([401, 403]).toContain(anonymous.status);
    const admin = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    expect(admin.status).toBe(200);
  });
  it('allows an admin to read a known course PDF but rejects an anonymous download', async () => {
    if (!base || !key || !token) throw new Error('Missing integration test credentials');
    const documents = await fetch(`${base}/rest/v1/pdf_documents?select=pdf_file_url&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    expect(documents.status).toBe(200);
    const rows = await documents.json();
    expect(rows.length).toBe(1);
    const path = new URL(rows[0].pdf_file_url).pathname.replace('/object/public/', '/object/authenticated/');
    const anonymous = await fetch(`${base}${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    expect(anonymous.ok).toBe(false);
    const admin = await fetch(`${base}${path}`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    expect(admin.status).toBe(200);
    expect(admin.headers.get('content-type')).toContain('pdf');
  });
});