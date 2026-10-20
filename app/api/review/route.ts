import { db } from "@/lib/data";

// Submit a review for a destination. Public inserts allowed (no auth required).
export async function POST(req: Request) {
  let b: {
    placeId?: string; rating?: number; author?: string;
    email?: string; country?: string; comment?: string;
  };
  try { b = await req.json(); } catch { return new Response(null, { status: 400 }); }

  const placeId = String(b.placeId ?? "");
  const rating = Number(b.rating);
  const author = String(b.author ?? "").trim();
  const email = String(b.email ?? "").trim();
  const country = String(b.country ?? "").trim();
  const comment = String(b.comment ?? "").trim();

  if (!placeId || !author || rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ error: "Missing place, name, or invalid rating." }), { status: 400 });
  }

  const { error } = await db().from("destination_reviews").insert({
    place_id: placeId, rating, author,
    email: email || null, country: country || null,
    comment: comment || null,
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
}
