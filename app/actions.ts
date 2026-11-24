"use server";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { db } from "@/lib/data";

export type FormState = { ok: boolean; msg: string } | null;

export async function submitEnquiry(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, msg: "Enquiry sent." }; // honeypot: bots fill this
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const name = s("name"), contact = s("contact");
  if (!name || contact.length < 3) return { ok: false, msg: "Add your name and a way to reach you." };

  const h = await headers();
  const { error } = await db().from("enquiries").insert({
    name, contact, contact_method: s("method") || "whatsapp",
    place_id: s("placeId") || null, travel_dates: s("dates") || null,
    group_size: parseInt(s("group")) || null, days: s("days") || null, budget: s("budget") || null,
    interests: fd.getAll("interests").map(String), message: s("message") || null,
    source_page: s("page"), source_channel: h.get("referer") || "direct",
  });

  if (error) return { ok: false, msg: "Couldn't send your enquiry. Check your details and try again." };

  // Track the form submission as a lead event (chat_handoff) so it appears in Insights button stats
  try {
    const ua = h.get("user-agent") ?? "";
    const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim();
    const day = new Date().toISOString().slice(0, 10);
    const visitor = createHash("sha256")
      .update(`${process.env.ANALYTICS_SALT ?? "dev"}|${day}|${ip}|${ua}`)
      .digest("hex")
      .slice(0, 16);
    const path = s("page") || "/";
    const channel = h.get("referer") ? (() => {
      try { return new URL(h.get("referer")!).hostname.replace(/^www\./, "") || "direct"; } catch { return "direct"; }
    })() : "direct";

    await db().from("events").insert({
      type: "chat_handoff",
      label: "form",
      path,
      channel,
      is_internal: false,
      visitor,
    });
  } catch {
    // event tracking must not break the enquiry flow
  }

  return { ok: true, msg: `Thanks, ${name}. Our team will reply within 24 hours.` };
}
