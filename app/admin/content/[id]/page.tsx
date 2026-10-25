import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { admin } from "@/lib/admin";
import ActivitiesEditor from "@/components/admin/ActivitiesEditor";
import LodgesEditor from "@/components/admin/LodgesEditor";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getActivityProviders, type Activity } from "@/lib/data";
import { cleanMedia } from "@/lib/media";

function formatTravelTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `~${mins} min from capital`;
  if (mins === 0) return `~${hours} hr${hours > 1 ? 's' : ''} from capital`;
  return `~${hours} hr${hours > 1 ? 's' : ''} ${mins} min from capital`;
}

function getTerrainMultiplier(tags: string[], region: string | null): number {
  const allTags = [...tags, ...(region?.toLowerCase().split(/\s+/) || [])];
  const tagStr = allTags.join(' ');
  
  // Mountain/high altitude destinations - significantly slower
  if (tagStr.includes('mountain') || tagStr.includes('rwenzori') || tagStr.includes('elgon') || 
      tagStr.includes('volcano') || tagStr.includes('hiking') || tagStr.includes('trekking')) {
    return 1.5; // 50% slower
  }
  // Rough terrain / parks with bad roads
  if (tagStr.includes('park') || tagStr.includes('wildlife') || tagStr.includes('reserve') ||
      tagStr.includes('forest') || tagStr.includes('gorilla') || tagStr.includes('chimpanzee')) {
    return 1.3; // 30% slower
  }
  // Remote areas
  if (tagStr.includes('remote') || tagStr.includes('kidepo') || tagStr.includes('far')) {
    return 1.25; // 25% slower
  }
  return 1.0; // Normal roads
}

export const metadata: Metadata = { title: "Edit destination", robots: { index: false } };
export const dynamic = "force-dynamic";

async function saveContent(fd: FormData) {
  "use server";
  const sb = await authClient();
  const t = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim() || null;
  const num = (fd: FormData, k: string) => { const v = parseFloat(String(fd.get(k))); return isNaN(v) ? null : v; };
  const id = String(fd.get("id"));
  const place_id = String(fd.get("place_id"));
  const title = t(fd, "title") ?? "Untitled";
  const hook = t(fd, "hook");
  const story = t(fd, "story");
  const region = t(fd, "region");
  const best_months = t(fd, "best_months");
  const best_time = t(fd, "best_time");
  const budget_range = t(fd, "budget_range");
  const ideal_days = num(fd, "days");
  const travel_time = t(fd, "travel_time");
  const latitude = num(fd, "latitude");
  const longitude = num(fd, "longitude");
  const tags = String(fd.get("tags") ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  const getting_there = t(fd, "getting_there");
  const local_tip = t(fd, "local_tip");
  const tip_author = t(fd, "tip_author");
  const plan_around = t(fd, "plan_around");
  const status = String(fd.get("status"));
  const last_checked = new Date().toISOString().slice(0, 10);

  // Calculate distance and duration from capital if coordinates provided
  let distance_km: number | null = null;
  let duration_min: number | null = null;
  
  if (latitude != null && longitude != null) {
    try {
      // Get the country's capital coordinates
      const { data: dest } = await sb.from("destination_content").select("place_id").eq("id", id).single();
      if (dest) {
        const { data: place } = await sb.from("places").select("parent_id").eq("id", dest.place_id).single();
        if (place) {
          const { data: country } = await sb.from("places").select("lat,lng").eq("id", place.parent_id).single();
          if (country && country.lat != null && country.lng != null) {
            const url = `https://router.project-osrm.org/route/v1/driving/${country.lng},${country.lat};${longitude},${latitude}?overview=false`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              distance_km = Math.round(route.distance / 1000 * 10) / 10; // km with 1 decimal
              const baseDurationMin = Math.round(route.duration / 60); // minutes
              
              // Apply terrain multiplier based on tags and region
              const multiplier = getTerrainMultiplier(tags, region);
              duration_min = Math.round(baseDurationMin * multiplier);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to calculate distance from capital:", e);
    }
  }

  await sb.from("destination_content").update({
    title, hook, story, region, best_months, best_time, budget_range, ideal_days, travel_time,
    tags, getting_there, local_tip, tip_author, plan_around, last_checked, status,
    distance_km, duration_min,
  }).eq("id", id);

  // Update place coordinates
  await sb.from("places").update({ latitude, longitude }).eq("id", place_id);

  // Sync activities
  const activitiesJson = String(fd.get("activities_json") ?? "[]");
  const parsedActivities: Array<{ id?: string; name: string; description?: string; cost_low?: number | null; cost_high?: number | null; duration?: string; providerIds?: string[]; media?: unknown }> = JSON.parse(activitiesJson);
  const keep = new Set<string>();
  for (const a of parsedActivities) {
    const name = (a.name ?? "").trim();
    if (!name) continue;
    const payload = {
      place_id, name, description: a.description?.trim() || null,
      cost_low: a.cost_low ?? null, cost_high: a.cost_high ?? null, currency: "USD",
      duration: a.duration?.trim() || null, media: cleanMedia(a.media), status: "published" as const,
    };
    let actId: string | null = null;
    if (a.id) { keep.add(a.id); actId = a.id; await sb.from("activities").update(payload).eq("id", a.id); }
    else { const { data } = await sb.from("activities").insert(payload).select("id").single(); if (data) { keep.add(data.id); actId = data.id; } }
    if (actId) {
      await sb.from("activity_providers").delete().eq("activity_id", actId);
      const pids: string[] = Array.isArray(a.providerIds) ? a.providerIds : [];
      if (pids.length) await sb.from("activity_providers").insert(pids.map(pid => ({ activity_id: actId, partner_id: pid })));
    }
  }
  const { data: old } = await sb.from("activities").select("id").eq("place_id", place_id);
  const gone = (old ?? []).map(r => r.id).filter(id => !keep.has(id));
  if (gone.length) { await sb.from("activity_providers").delete().in("activity_id", gone); await sb.from("activities").delete().in("id", gone); }

  // Sync stays
  const staysJson = String(fd.get("lodges_json") ?? "[]");
  const parsedStays: Array<{ id?: string; name: string; tier: string; description: string; contact: string; email: string; website: string; latitude?: number | null; longitude?: number | null; media?: unknown }> = JSON.parse(staysJson);
  const keepStays = new Set<string>();
  for (const l of parsedStays) {
    const name = (l.name ?? "").trim();
    if (!name) continue;
    const tier = ["budget", "mid", "comfort"].includes(l.tier ?? "") ? l.tier : null;
    const payload = {
      name, tier, description: l.description?.trim() || null, contact: l.contact?.trim() || null,
      email: l.email?.trim() || null, website: l.website?.trim() || null,
      latitude: l.latitude ?? null, longitude: l.longitude ?? null,
      media: cleanMedia(l.media),
    };
    if (l.id) {
      const { data: p } = await sb.from("partners").select("place_ids").eq("id", l.id).maybeSingle();
      await sb.from("partners").update({ ...payload, type: "lodge", place_ids: Array.from(new Set([...(p?.place_ids ?? []), place_id])) }).eq("id", l.id);
      keepStays.add(l.id);
    } else {
      const { data } = await sb.from("partners").insert({ ...payload, type: "lodge", place_ids: [place_id] }).select("id").single();
      if (data) keepStays.add(data.id);
    }
  }
  const { data: linked } = await sb.from("partners").select("id,place_ids").eq("type", "lodge").contains("place_ids", [place_id]);
  for (const p of linked ?? []) { if (!keepStays.has(p.id)) { await sb.from("partners").update({ place_ids: (p.place_ids as string[]).filter(x => x !== place_id) }).eq("id", p.id); } }

  revalidatePath("/", "layout");
  redirect("/admin/content");
}

export default async function Edit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;
  const { error } = await searchParams;
  const { data: d } = await sb
    .from("destination_content")
    .select("*, places!inner(id, name, slug, latitude, longitude, parent_id)")
    .eq("id", (await params).id)
    .maybeSingle();
  if (!d) notFound();
  const providers = await getActivityProviders();
  const [{ data: activities }, { data: stays }] = await Promise.all([
    sb.from("activities").select("id,name,description,cost_low,cost_high,currency,duration,media").eq("place_id", d.places.id).order("name"),
    sb.from("partners").select("id,name,description,tier,contact,email,website,media,latitude,longitude").eq("type", "lodge").contains("place_ids", [d.places.id]),
  ]);
  const actsWithProviders = ((activities ?? []) as unknown as any[]).map((a: any) => ({ ...a, providers: [] })) as Activity[];
  return (
    <div className="wrap page">
      <Link className="back" href="/admin/content">Back to content</Link>
      <h1>Edit {d.title}</h1>
      {error && <p className="msg" role="alert">{error}</p>}
      <p className="hook">Everything on the public page comes from this form. Save once when you are done.</p>
      <form className="form" action={saveContent}>
        <input type="hidden" name="id" value={d.id} />
        <input type="hidden" name="place_id" value={d.places.id} />

        <section className="fsec">
          <h3>The basics</h3>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" defaultValue={d.title} required />
          <label htmlFor="hook">One-line hook</label>
          <input id="hook" name="hook" defaultValue={d.hook ?? ""} placeholder="Where the Nile begins its journey north, and where Uganda goes to play." />
          <div className="row2">
            <div><label htmlFor="st">Status</label>
              <select id="st" name="status" defaultValue={d.status}><option value="draft">draft</option><option value="published">published</option></select>
            </div>
            <div><label htmlFor="ck">Last checked</label>
              <input id="ck" name="checked" type="date" defaultValue={d.last_checked ?? ""} />
            </div>
          </div>
        </section>

        <section className="fsec">
          <h3>Quick facts</h3>
          <label htmlFor="rg">Region</label>
          <input id="rg" name="region" defaultValue={d.region ?? ""} placeholder="Eastern Uganda, on Lake Victoria and the Nile" />
          <div className="row2">
            <div><label htmlFor="bm">Best months</label><input id="bm" name="best_months" defaultValue={d.best_months ?? ""} placeholder="Dec-Feb, Jun-Aug" /></div>
            <div><label htmlFor="br">Budget range</label><input id="br" name="budget_range" defaultValue={d.budget_range ?? ""} placeholder="Backpacker to luxury" /></div>
            <div><label htmlFor="dy">Ideal stay (days)</label><input id="dy" name="days" type="number" min="1" defaultValue={d.ideal_days ?? ""} /></div>
            <div>
              <label htmlFor="tt">Travel time from capital</label>
              <input id="tt" name="travel_time" defaultValue={d.duration_min ? formatTravelTime(d.duration_min) : ""} readOnly style={{ background: "var(--mist)" }} />
              <p className="hint">Auto-calculated from coordinates. Fill latitude/longitude and save to update.</p>
            </div>
            <div><label htmlFor="lat">Latitude</label><input id="lat" name="latitude" type="number" step="any" defaultValue={d.places.latitude ?? ""} placeholder="-0.123456" /></div>
            <div><label htmlFor="lng">Longitude</label><input id="lng" name="longitude" type="number" step="any" defaultValue={d.places.longitude ?? ""} placeholder="32.123456" /></div>
            <div><label htmlFor="tg">Tags (comma separated)</label><input id="tg" name="tags" defaultValue={(d.tags ?? []).join(", ")} placeholder="adventure, relaxing, birds" /></div>
          </div>
        </section>

        <section className="fsec">
          <h3>The story</h3>
          <label htmlFor="story">Story (blank line between paragraphs)</label>
          <textarea id="story" name="story" rows={12} defaultValue={d.story ?? ""} placeholder={"Jinja doesn't announce itself...\n\nhttps://example.com/sunrise.jpg\n\nBy evening it slows right down."} />
          <p className="hint">To place a photo inside the story, put its URL on a line of its own, or write <code>![caption](https://...)</code> for a captioned photo.</p>
          <label htmlFor="bt">Best time to visit</label>
          <textarea id="bt" name="best_time" rows={4} defaultValue={d.best_time ?? ""} placeholder="Dry seasons mean easier roads. The river runs year-round, and midweek is quieter than weekends." />
        </section>

        <section className="fsec">
          <h3>Getting there</h3>
          <label htmlFor="gt">How to reach it</label>
          <textarea id="gt" name="getting_there" rows={4} defaultValue={d.getting_there ?? ""} placeholder="By road from Kampala via the Jinja highway. Avoid leaving during rush hours." />
        </section>

        <section className="fsec">
          <h3>Things to do</h3>
          <p className="hint">Add each activity with a short description and rough cost. Photos and videos show in a gallery on the public page. Select one or more partner providers for each activity.</p>
          <ActivitiesEditor initial={actsWithProviders} providers={providers ?? []} />
        </section>

        <section className="fsec">
          <h3>Where to stay</h3>
          <p className="hint">One line per lodge keeps the public page clean. Tier controls the budget / mid-range / comfortable grouping.</p>
          <LodgesEditor initial={stays ?? []} />
        </section>

        <section className="fsec">
          <h3>Local tip</h3>
          <label htmlFor="lt">The tip</label>
          <textarea id="lt" name="local_tip" rows={3} defaultValue={d.local_tip ?? ""} placeholder="Book rafting for the morning, when the water is calmer and the light is best for photos." />
          <label htmlFor="ta">Tip from</label>
          <input id="ta" name="tip_author" defaultValue={d.tip_author ?? ""} placeholder="George" />
        </section>

        <section className="fsec">
          <h3>Plan around it</h3>
          <label htmlFor="pa">What to pair it with</label>
          <textarea id="pa" name="plan_around" rows={3} defaultValue={d.plan_around ?? ""} placeholder="Pair Jinja with Sipi Falls, Mabira Forest, or a night in Kampala before your flight." />
        </section>

        <button className="go">Save changes</button>
      </form>
    </div>
  );
}
