import { db } from "@/lib/data";
import { authClient } from "@/lib/supabase/server";

// Get reviews for a destination. Public sees only approved; admins see all.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) return new Response(JSON.stringify([]), { status: 400 });

  const sb = await authClient();
  const { data: { user } } = await sb.auth.getUser();
  const isAdmin = user ? !!(await sb.rpc("is_admin")) : false;

  let query = sb.from("destination_reviews").select("id, rating, author, country, email, comment, created_at, status").eq("place_id", placeId);
  if (!isAdmin) query = query.eq("status", "approved");

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data ?? []), { status: 200 });
}
