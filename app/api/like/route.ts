import { db } from "@/lib/data";

// Registers a like for a destination. Public inserts allowed (no auth required).
export async function POST(req: Request) {
  let b: { placeId?: string };
  try { b = await req.json(); } catch { return new Response(null, { status: 400 }); }
  const placeId = String(b.placeId ?? "");
  if (!placeId) return new Response(null, { status: 400 });
  const { error } = await db().from("destination_likes").insert({ place_id: placeId });
  if (error) {
    console.error("Like insert error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(null, { status: 204 });
}
