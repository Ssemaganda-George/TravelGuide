import { createHash } from "crypto";
import { db } from "@/lib/data";
import { authClient } from "@/lib/supabase/server";

const BOT = /bot|crawl|spider|slurp|preview|headless|monitor|lighthouse|curl|wget|facebookexternalhit/i;

const VALID_TYPES = ["whatsapp_click", "chat_open", "chat_handoff", "engaged", "plan_click"];

// Track anonymous button clicks and chat interactions without storing IP or cookies.
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });

  let b: { type?: string; label?: string; path?: string; channel?: string; internal?: boolean };
  try {
    b = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const type = String(b.type ?? "");
  const label = String(b.label ?? "").slice(0, 80);
  const path = String(b.path ?? "").slice(0, 200);
  const channel = String(b.channel ?? "").slice(0, 80) || "direct";
  const internal = b.internal === true;

  // Validate path
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new Response(null, { status: 204 });
  // Validate label
  if (!/^[a-z0-9_:-]+$/.test(label)) return new Response(null, { status: 400 });
  // Validate type
  if (!VALID_TYPES.includes(type)) return new Response(null, { status: 400 });

  // Daily-rotating visitor hash (same scheme as /api/view)
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256")
    .update(`${process.env.ANALYTICS_SALT ?? "dev"}|${day}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 16);

  const { error } = await db().from("events").insert({ type, label, path, channel, internal, visitor });
  if (error) {
    console.error("Event insert error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(null, { status: 204 });
}
