// Explicit live checks: TEST_AUTH_URL and TEST_ANON_KEY contain only public configuration.
import { describe, expect, it } from 'vitest';

const base = process.env.TEST_AUTH_URL;
const key = process.env.TEST_ANON_KEY;
const headers = () => {
  if (!key) throw new Error('Missing public test configuration');
  return { apikey: key, Authorization: `Bearer ${key}` };
};

describe.skipIf(!base || !key)('public audio library', () => {
  it.each(['audio_levels', 'audio_files', 'audio_level_items'])('guests can read every %s row', async (table) => {
    const response = await fetch(`${base}/rest/v1/${table}?select=id`, {
      headers: { ...headers(), Prefer: 'count=exact', Range: '0-999' },
    });
    expect(response.status).toBe(200);
    const rows = await response.json();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBe(Number(response.headers.get('content-range')?.split('/')[1]));
  });

  it('guests can fetch original audio bytes', async () => {
    const response = await fetch(`${base}/rest/v1/audio_files?select=storage_url&limit=1`, { headers: headers() });
    expect(response.status).toBe(200);
    const rows = await response.json();
    expect(rows.length).toBe(1);
    const audio = await fetch(rows[0].storage_url, { headers: { Range: 'bytes=0-4095' } });
    expect(audio.ok).toBe(true);
    expect(audio.headers.get('content-type')).toMatch(/audio|octet-stream/);
    expect((await audio.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it.each(['audio_levels', 'audio_files', 'audio_level_items'])('guests cannot edit %s', async (table) => {
    // No matching row: test privilege enforcement without changing any data.
    const response = await fetch(`${base}/rest/v1/${table}?id=eq.00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
    });
    expect([401, 403]).toContain(response.status);
  });
});