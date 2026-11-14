import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

const url = () => Deno.env.get("SUPABASE_URL")!;
const serviceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

/** True when the caller presents this project's service-role key (server-to-server). */
export function isServiceCaller(req: Request): boolean {
  const t = bearer(req);
  return !!t && t === serviceKey();
}

/** Returns the verified user for the request, or null. */
export async function getCaller(req: Request): Promise<User | null> {
  const t = bearer(req);
  if (!t) return null;
  const admin = createClient(url(), serviceKey());
  const { data, error } = await admin.auth.getUser(t);
  return error ? null : data.user ?? null;
}

/** Returns the verified user only if they hold the admin role. */
export async function getAdmin(req: Request): Promise<User | null> {
  const user = await getCaller(req);
  if (!user) return null;
  const admin = createClient(url(), serviceKey());
  const { data } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return data ? user : null;
}
