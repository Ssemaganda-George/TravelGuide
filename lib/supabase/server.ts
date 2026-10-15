import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware client for /admin. Public pages use lib/data.ts (anon, no session).
export async function authClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options?: Record<string, unknown> }[]) => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} },
    },
  });
}
