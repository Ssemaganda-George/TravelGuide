import { createClient } from "@supabase/supabase-js";
import { STAY_TIERS } from "./tiers";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Anon key + Row Level Security: public can only read published content and insert enquiries.
export const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

export type Media = { type: "image" | "video"; url: string; caption?: string | null };

export type Dest = {
  id: string; place_id: string; title: string; hook: string | null; story: string | null;
  region: string | null; best_months: string | null; best_time: string | null;
  budget_range: string | null; ideal_days: number | null;
  tags: string[]; getting_there: string | null; local_tip: string | null; tip_author: string | null;
  plan_around: string | null; last_checked: string | null; places: { name: string; slug: string };
};

export type Activity = {
  id: string; name: string; description: string | null; cost_low: number | null;
  cost_high: number | null; currency: string | null; duration: string | null;
  media: Media[] | null;
};

export type Stay = {
  id: string; name: string; description: string | null; tier: string | null;
  contact: string | null; media: Media[] | null;
};

export { STAY_TIERS };

export async function getCountries() {
  const { data } = await db().from("places").select("id,name,slug").eq("type", "country");
  return data ?? [];
}

export async function getCountry(slug: string) {
  const { data } = await db().from("places").select("id,name,slug").eq("type", "country").eq("slug", slug).maybeSingle();
  return data;
}

// MVP assumption: destinations are direct children of a country. Regions can be added later.
export async function getDestinations(countryId: string): Promise<Dest[]> {
  const { data } = await db()
    .from("destination_content")
    .select("*, places!inner(name,slug,parent_id)")
    .eq("status", "published")
    .eq("language", "en")
    .eq("places.parent_id", countryId)
    .order("title");
  return (data as Dest[]) ?? [];
}

// Published activities for one destination, e.g. rafting, boat trips, market walks.
export async function getActivities(placeId: string): Promise<Activity[]> {
  const { data } = await db()
    .from("activities")
    .select("id,name,description,cost_low,cost_high,currency,duration,media")
    .eq("status", "published")
    .eq("place_id", placeId)
    .order("name");
  return (data as Activity[]) ?? [];
}

// Published activities for many destinations at once, grouped by place_id.
export async function getActivitiesForPlaces(placeIds: string[]): Promise<Record<string, Activity[]>> {
  if (!placeIds.length) return {};
  const { data } = await db()
    .from("activities")
    .select("id,name,description,cost_low,cost_high,currency,duration,media,place_id")
    .eq("status", "published")
    .in("place_id", placeIds)
    .order("place_id,name");
  const byPlace: Record<string, Activity[]> = {};
  for (const a of (data as Activity[]) ?? []) {
    const pid = (a as unknown as { place_id?: string }).place_id;
    if (!pid) continue;
    if (!byPlace[pid]) byPlace[pid] = [];
    byPlace[pid].push(a);
  }
  return byPlace;
}

// Lodges serving a destination, cheapest tier first.
export async function getStays(placeId: string): Promise<Stay[]> {
  const { data } = await db()
    .from("partners")
    .select("id,name,description,tier,contact,media")
    .eq("type", "lodge")
    .eq("active", true)
    .contains("place_ids", [placeId]);
  const order = ["budget", "mid", "comfort"];
  return ((data as Stay[]) ?? []).sort((a, b) => order.indexOf(a.tier ?? "") - order.indexOf(b.tier ?? ""));
}
