import { createHash } from "crypto";
import { db } from "@/lib/data";

const BOT = /bot|crawl|spider|slurp|preview|headless|monitor|lighthouse|curl|wget|facebookexternalhit/i;

// Counts a page view without cookies. The IP is used only to build a daily-rotating hash and is never stored.
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
  let b: { path?: string; referrer?: string; utm?: string };
  try { b = await req.json(); } catch { return new Response(null, { status: 400 }); }
  const path = String(b.path ?? "").slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new Response(null, { status: 204 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const visitor = createHash("sha256").update(`${process.env.ANALYTICS_SALT ?? "dev"}|${day}|${ip}|${ua}`).digest("hex").slice(0, 16);

  let channel = String(b.utm ?? "").slice(0, 60);
  if (!channel && b.referrer) {
    try {
      const host = new URL(b.referrer).hostname.replace(/^www\./, "");
      if (host !== new URL(req.url).hostname) channel = host;
    } catch {}
  }
  const { error } = await db().from("page_views").insert({ path, channel: channel || "direct", visitor });
  if (error) {
    console.error("View insert error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(null, { status: 204 });
}
