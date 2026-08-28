import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** True when the request comes from another edge function using the service role key. */
export function isInternalCall(req: Request): boolean {
  const secret = req.headers.get('x-internal-secret');
  return !!secret && !!SERVICE_ROLE_KEY && secret === SERVICE_ROLE_KEY;
}

/** Verifies the caller is an authenticated admin. Returns null when unauthorized. */
export async function requireAdmin(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token === SERVICE_ROLE_KEY) return null;

  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  return role ? { userId: data.user.id } : null;
}
