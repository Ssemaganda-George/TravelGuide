import { createHash } from "crypto";
import { db } from "@/lib/data";
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

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256").update(`${process.env.ANALYTICS_SALT ?? "dev"}|${day}|${ip}|${ua}`).digest("hex").slice(0, 16);

  // Detect visitor country from CDN/proxy headers
  const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country") ?? req.headers.get("x-appengine-country") ?? null;

  let channel = String(b.utm ?? "").slice(0, 60);
  if (!channel && b.referrer) {
    try {
      const host = new URL(b.referrer).hostname.replace(/^www\./, "");
      if (host !== new URL(req.url).hostname) channel = host;
    } catch {}
  }
  
  console.log("View API: Inserting view for path:", path, "channel:", channel);
  console.log("View API: Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET");
  
  const { error } = await db().from("page_views").insert({ path, channel: channel || "direct", visitor, country });
  if (error) {
    console.error("View insert error:", error);
    return new Response(JSON.stringify({ error: error.message, code: error.code }), { status: 500 });
  }
  console.log("View API: Successfully inserted view for:", path);
  return new Response(null, { status: 204 });
}
