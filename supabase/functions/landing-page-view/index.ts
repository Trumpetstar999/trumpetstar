import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Only anonymous numeric aggregates are persisted. Connection data is not copied.
Deno.serve(async (req) => {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  const origin = req.headers.get('origin') || '';
  if (!/^https:\/\/(www\.trumpetstar\.app|trumpetstar\.lovable\.app|id-preview--6a4e4c62-7848-47bc-98c2-e0368f02cdb9\.lovable\.app)$/.test(origin) && origin !== 'http://localhost:8080') return reply(403, { error: 'Invalid origin' });
  try {
    const raw = await req.text();
    if (raw.length > 100) return reply(400, { error: 'Invalid request' });
    const body = JSON.parse(raw);
    if (!body || body.path !== '/trompete-lernen-app' || Object.keys(body).some(key => key !== 'path')) return reply(400, { error: 'Invalid request' });
    if (/bot|crawler|spider|headless/i.test(req.headers.get('user-agent') || '')) return reply(200, { counted: false });
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return reply(503, { error: 'Capture unavailable' });
    const { error } = await createClient(url, key).rpc('capture_landing_view');
    if (error) return reply(503, { error: 'Capture unavailable' });
    return reply(200, { counted: true });
  } catch {
    return reply(400, { error: 'Invalid request' });
  }
});