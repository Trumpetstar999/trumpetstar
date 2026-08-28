// Shared Brevo gateway helpers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/brevo';

export type Lang = 'de' | 'en' | 'es' | 'sl';
export const LANGS: Lang[] = ['de', 'en', 'es', 'sl'];

export function normalizeLang(value: unknown): Lang {
  const v = typeof value === 'string' ? value.slice(0, 5).toLowerCase().split('-')[0] : '';
  return (LANGS as string[]).includes(v) ? (v as Lang) : 'de';
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Calls the Brevo API through the Lovable connector gateway. */
export async function brevoFetch(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
  if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY is not configured');

  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': BREVO_API_KEY,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    console.error(`[brevo] ${init.method ?? 'GET'} ${path} failed [${res.status}]: ${text}`);
  }
  return { ok: res.ok, status: res.status, data, text };
}
