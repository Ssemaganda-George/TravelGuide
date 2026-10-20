import { db } from "@/lib/data";
import { authClient } from "@/lib/supabase/server";

// Submit a review for a destination. Inserts as 'pending' for moderation.
export async function POST(req: Request) {
  const sb = await authClient();
  const { data: { user } } = await sb.auth.getUser();

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

  if (!placeId || rating < 1 || rating > 5) {
    return new Response(JSON.stringify({ error: "Missing place or invalid rating." }), { status: 400 });
  }

  // Auto-fill from logged-in user account
  let finalAuthor = author;
  let finalEmail = email;
  let finalCountry = country;
  if (user) {
    finalAuthor = author || (user.user_metadata?.full_name ?? user.email ?? "A traveller");
    finalEmail = (email || user.email) ?? "";
    finalCountry = (country || user.user_metadata?.country) ?? "";
  }
  if (!finalAuthor) {
    return new Response(JSON.stringify({ error: "Name is required." }), { status: 400 });
  }

  const { error } = await db().from("destination_reviews").insert({
    place_id: placeId, rating, author: finalAuthor,
    email: finalEmail || null, country: finalCountry || null,
    comment: comment || null, status: "pending",
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
}
