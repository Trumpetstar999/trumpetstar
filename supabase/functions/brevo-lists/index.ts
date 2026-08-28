import { brevoFetch, corsHeaders, json } from '../_shared/brevo.ts';
import { requireAdmin } from '../_shared/brevo-auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req);
    if (!admin) return json({ error: 'Unauthorized: Admin access required' }, 401);

    if (req.method === 'GET') {
      const account = await brevoFetch('/account');
      const lists = await brevoFetch('/contacts/lists?limit=50&offset=0');
      if (!lists.ok) {
        return json({ error: 'Brevo request failed', status: lists.status, details: lists.text }, lists.status);
      }
      return json({
        account: account.ok ? account.data : null,
        accountError: account.ok ? null : account.text,
        lists: (lists.data as { lists?: unknown[] })?.lists ?? [],
      });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => null) as { name?: string; folderId?: number } | null;
      const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 100) : '';
      if (!name) return json({ error: 'name is required' }, 400);

      let folderId = typeof body?.folderId === 'number' ? body.folderId : null;
      if (!folderId) {
        const folders = await brevoFetch('/contacts/folders?limit=10&offset=0');
        const first = (folders.data as { folders?: { id: number }[] })?.folders?.[0];
        if (first) {
          folderId = first.id;
        } else {
          const created = await brevoFetch('/contacts/folders', {
            method: 'POST',
            body: { name: 'Trumpetstar' },
          });
          if (!created.ok) {
            return json({ error: 'Could not create folder', status: created.status, details: created.text }, created.status);
          }
          folderId = (created.data as { id: number }).id;
        }
      }

      const created = await brevoFetch('/contacts/lists', {
        method: 'POST',
        body: { name, folderId },
      });
      if (!created.ok) {
        return json({ error: 'Brevo request failed', status: created.status, details: created.text }, created.status);
      }
      return json({ list: created.data });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e) {
    console.error('[brevo-lists] error', e);
    return json({ error: String(e) }, 500);
  }
});
