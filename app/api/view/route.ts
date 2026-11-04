import { createHash } from "crypto";
import { db } from "@/lib/data";
import { resolveVisitorCountry } from "@/lib/geo";
import { authClient } from "@/lib/supabase/server";

const BOT = /bot|crawl|spider|slurp|preview|headless|monitor|lighthouse|curl|wget|facebookexternalhit/i;

// Counts a page view without cookies. The IP is used only to build a daily-rotating hash and is never stored.
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
  let b: { path?: string; referrer?: string; utm?: string };
  try { b = await req.json(); } catch { return new Response(null, { status: 400 }); }
  const path = String(b.path ?? "").slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new Response(null, { status: 204 });

  // Never track views from logged-in admin users
  try {
    const sb = await authClient();
    const { data: adminRow } = await sb.from("admins").select("user_id").maybeSingle();
    if (adminRow) return new Response(null, { status: 204 });
  } catch {}

  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256").update(`${process.env.ANALYTICS_SALT ?? "dev"}|${day}|${ip}|${ua}`).digest("hex").slice(0, 16);

  // Edge headers (Vercel/CF/…) first; public-IP lookup if headers missing. Country may be null;
  // the view is still recorded — country is optional.
  const country = await resolveVisitorCountry(req, ip);

  let channel = String(b.utm ?? "").slice(0, 60);
  if (!channel && b.referrer) {
    try {
      const host = new URL(b.referrer).hostname.replace(/^www\./, "");
      if (host !== new URL(req.url).hostname) channel = host;
    } catch {}
  }

  const { error } = await db().from("page_views").insert({ path, channel: channel || "direct", visitor, country });
  if (error) {
    console.error("View insert error:", error);
    return new Response(JSON.stringify({ error: error.message, code: error.code }), { status: 500 });
  }
  return new Response(null, { status: 204 });
}
