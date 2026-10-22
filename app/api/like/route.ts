import { db } from "@/lib/data";

// Registers a like for a destination. Public inserts allowed (no auth required).
export async function POST(req: Request) {
  let b: { placeId?: string };
  try { b = await req.json(); } catch { return new Response(null, { status: 400 }); }
  const placeId = String(b.placeId ?? "");
  if (!placeId) return new Response(null, { status: 400 });
  
  console.log("Like API: Inserting like for placeId:", placeId);
  console.log("Like API: Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET");
  
  const { error } = await db().from("destination_likes").insert({ place_id: placeId });
  if (error) {
    console.error("Like insert error:", error);
    return new Response(JSON.stringify({ error: error.message, code: error.code }), { status: 500 });
  }
  console.log("Like API: Successfully inserted like for:", placeId);
  return new Response(null, { status: 204 });
}
