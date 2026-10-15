"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authClient } from "@/lib/supabase/server";
import { cleanMedia } from "@/lib/media";

const STATUSES = ["new", "contacted", "quoted", "booked", "lost"];

export async function updateStatus(fd: FormData) {
  const status = String(fd.get("status"));
  if (!STATUSES.includes(status)) return;
  const sb = await authClient(); // RLS: only admins can update
  await sb.from("enquiries").update({
    status, lost_reason: status === "lost" ? String(fd.get("lost_reason") || "") || null : null,
  }).eq("id", String(fd.get("id")));
  revalidatePath("/admin");
}

export async function signOut() {
  const sb = await authClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}

// ---- Partners, referrals, content (all writes are enforced by admin-only RLS) ----
const t = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim() || null;
const num = (fd: FormData, k: string) => { const v = parseFloat(String(fd.get(k))); return isNaN(v) ? null : v; };

export async function addPartner(fd: FormData) {
  const sb = await authClient();
  await sb.from("partners").insert({
    name: t(fd, "name")!, type: String(fd.get("type")), contact: t(fd, "contact"),
    commission_rate: num(fd, "rate"), commission_flat: num(fd, "flat"),
    agreement_status: String(fd.get("agreement")), payment_terms: t(fd, "terms"), notes: t(fd, "notes"),
  });
  revalidatePath("/admin/partners");
}

export async function togglePartner(fd: FormData) {
  const sb = await authClient();
  await sb.from("partners").update({ active: fd.get("active") === "true" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/partners");
}

export async function addReferral(fd: FormData) {
  const sb = await authClient();
  const value = num(fd, "value");
  const { data: p } = await sb.from("partners").select("commission_rate,commission_flat,currency").eq("id", String(fd.get("partner"))).single();
  const due = p ? (p.commission_rate != null && value != null ? (value * p.commission_rate) / 100 : p.commission_flat) : null;
  await sb.from("referrals").insert({
    enquiry_id: String(fd.get("enquiry")), partner_id: String(fd.get("partner")),
    booking_value: value, currency: p?.currency ?? "USD", commission_due: due, trip_date: t(fd, "trip"),
  });
  revalidatePath("/admin/referrals");
}

export async function setCommissionStatus(fd: FormData) {
  const status = String(fd.get("status"));
  if (!["pending", "invoiced", "paid"].includes(status)) return;
  const sb = await authClient();
  await sb.from("referrals").update({ commission_status: status, paid_date: status === "paid" ? new Date().toISOString().slice(0, 10) : null }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/referrals");
}

export async function createDestination(fd: FormData) {
  const sb = await authClient();
  const name = String(fd.get("name") ?? "").trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data: c } = await sb.from("places").select("id").eq("type", "country").eq("slug", String(fd.get("country"))).single();
  if (!name || !slug || !c) redirect("/admin/content?error=1");
  const { data: pl } = await sb.from("places").insert({ name, slug, type: "destination", parent_id: c.id }).select("id").single();
  if (!pl) redirect("/admin/content?error=1");
  const { data: ct } = await sb.from("destination_content").insert({ place_id: pl.id, title: name, language: "en" }).select("id").single();
  redirect(ct ? `/admin/content/${ct.id}` : "/admin/content?error=1");
}

export async function uploadMedia(fd: FormData) {
  const sb = await authClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Sign in to upload files." };
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return { error: "Admins only." };
  const file = fd.get("file") as File | null;
  const type = String(fd.get("type") ?? "image");
  if (!file) return { error: "No file selected." };
  if (file.size > 10 * 1024 * 1024) return { error: "File too large (max 10 MB)." };
  const ext = file.name.slice(file.name.lastIndexOf(".") + 1).replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const base = file.name.replace(/[^a-z0-9.\-_]/gi, "_").toLowerCase().slice(0, 60);
  const path = `${type === "video" ? "videos" : "images"}/${user.id}/${crypto.randomUUID()}-${base}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, file, {
    contentType: file.type || undefined,
    cacheControl: "3600",
  });
  if (error) return { error: error.message };
  const { data } = sb.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function saveContent(fd: FormData) {
  const sb = await authClient();
  const status = fd.get("status") === "published" ? "published" : "draft";
  const { data: row } = await sb.from("destination_content").select("place_id").eq("id", String(fd.get("id"))).maybeSingle();
  const placeId = row?.place_id;
  if (!placeId) redirect("/admin/content?error=1");
  await sb.from("destination_content").update({
    title: t(fd, "title") ?? "Untitled", hook: t(fd, "hook"), story: t(fd, "story"),
    region: t(fd, "region"), best_months: t(fd, "best_months"), best_time: t(fd, "best_time"),
    budget_range: t(fd, "budget_range"), ideal_days: num(fd, "days"),
    tags: String(fd.get("tags") ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean),
    getting_there: t(fd, "getting_there"), local_tip: t(fd, "local_tip"), tip_author: t(fd, "tip_author"),
    plan_around: t(fd, "plan_around"),
    last_checked: t(fd, "checked"), status,
  }).eq("id", String(fd.get("id")));
  await syncActivities(sb, placeId, fd.get("activities_json"));
  await syncStays(sb, placeId, fd.get("lodges_json"));
  revalidatePath("/", "layout"); // public pages update immediately
  redirect("/admin/content");
}

type Item = { id?: string; name?: string; description?: string; cost_low?: number | null; cost_high?: number | null; duration?: string; tier?: string; contact?: string; media?: unknown };

const arr = (v: FormDataEntryValue | null): Item[] => {
  try { const parsed = JSON.parse(String(v ?? "[]")); return Array.isArray(parsed) ? parsed : []; }
  catch { return []; }
};

// "Things to do": add, edit and remove activities (and their photos/videos) with the page.
async function syncActivities(sb: Awaited<ReturnType<typeof authClient>>, placeId: string, raw: FormDataEntryValue | null) {
  const keep = new Set<string>();
  for (const a of arr(raw)) {
    const name = (a.name ?? "").trim();
    if (!name) continue;
    const payload = {
      place_id: placeId, name, description: a.description?.trim() || null,
      cost_low: a.cost_low ?? null, cost_high: a.cost_high ?? null, currency: "USD",
      duration: a.duration?.trim() || null, media: cleanMedia(a.media), status: "published" as const,
    };
    if (a.id) { const { error } = await sb.from("activities").update(payload).eq("id", a.id); if (!error) keep.add(a.id); }
    else { const { data } = await sb.from("activities").insert(payload).select("id").single(); if (data) keep.add(data.id); }
  }
  const { data: old } = await sb.from("activities").select("id").eq("place_id", placeId);
  const gone = (old ?? []).map(r => r.id).filter(id => !keep.has(id));
  if (gone.length) await sb.from("activities").delete().in("id", gone);
}

// "Where to stay": lodges are partners of type 'lodge'. Removals only unlink the
// lodge from this destination, so referrals and commission history stay intact.
async function syncStays(sb: Awaited<ReturnType<typeof authClient>>, placeId: string, raw: FormDataEntryValue | null) {
  const keep = new Set<string>();
  for (const l of arr(raw)) {
    const name = (l.name ?? "").trim();
    if (!name) continue;
    const tier = ["budget", "mid", "comfort"].includes(l.tier ?? "") ? l.tier! : null;
    const payload = {
      name, tier, description: l.description?.trim() || null, contact: l.contact?.trim() || null,
      media: cleanMedia(l.media),
    };
    if (l.id) {
      const { data: p } = await sb.from("partners").select("place_ids").eq("id", l.id).maybeSingle();
      await sb.from("partners").update({
        ...payload, type: "lodge",
        place_ids: Array.from(new Set([...(p?.place_ids ?? []), placeId])),
      }).eq("id", l.id);
      keep.add(l.id);
    } else {
      const { data } = await sb.from("partners").insert({ ...payload, type: "lodge" as const, place_ids: [placeId] }).select("id").single();
      if (data) keep.add(data.id);
    }
  }
  const { data: linked } = await sb.from("partners").select("id,place_ids").eq("type", "lodge").contains("place_ids", [placeId]);
  for (const p of linked ?? []) {
    if (keep.has(p.id)) continue;
    await sb.from("partners").update({ place_ids: (p.place_ids as string[]).filter(x => x !== placeId) }).eq("id", p.id);
  }
}
