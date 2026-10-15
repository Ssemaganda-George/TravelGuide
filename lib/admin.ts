import { authClient } from "./supabase/server";
// Returns a session client only for users listed in the admins table; otherwise null.
export async function admin() {
  const sb = await authClient();
  const { data } = await sb.from("admins").select("user_id").maybeSingle();
  return data ? sb : null;
}
