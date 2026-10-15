"use server";
import { headers } from "next/headers";
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
    group_size: parseInt(s("group")) || null, budget: s("budget") || null,
    interests: fd.getAll("interests").map(String), message: s("message") || null,
    source_page: s("page"), source_channel: h.get("referer") || "direct",
  });
  return error
    ? { ok: false, msg: "Couldn't send your enquiry. Check your details and try again." }
    : { ok: true, msg: `Thanks, ${name}. I'll reply within 24 hours.` };
}
