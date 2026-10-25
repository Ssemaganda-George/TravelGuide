import { createClient } from "@supabase/supabase-js";
import { STAY_TIERS } from "./tiers";
import { SITE, SITE_NAME, SITE_URL, SITE_DOMAIN, SITE_TAGLINE, CONTACT_EMAIL } from "./site";

export { SITE, SITE_NAME, SITE_URL, SITE_DOMAIN, SITE_TAGLINE, CONTACT_EMAIL };

// Country reference points (capitals/major cities) for routing
export const COUNTRY_REFERENCE_POINTS: Record<string, { name: string; position: [number, number] }> = {
  uganda: { name: "Kampala", position: [0.3476, 32.5825] },
  kenya: { name: "Nairobi", position: [-1.2921, 36.8219] },
  tanzania: { name: "Dodoma", position: [-6.1659, 35.7516] },
  rwanda: { name: "Kigali", position: [-1.9441, 30.0619] },
};

// Compute travel time from distance: 1 min/km + terrain & traffic multipliers
function getTravelTimeMultiplier(tags: string[], country: string): number {
  const allTags = tags.map(t => t.toLowerCase()).join(' ');
  let multiplier = 1.0;

  if (allTags.includes('mountain') || allTags.includes('rwenzori') || allTags.includes('elgon') ||
      allTags.includes('volcano') || allTags.includes('hiking') || allTags.includes('trekking')) {
    multiplier = 1.5;
  } else if (allTags.includes('park') || allTags.includes('wildlife') || allTags.includes('reserve') ||
             allTags.includes('forest') || allTags.includes('gorilla') || allTags.includes('chimpanzee')) {
    multiplier = 1.3;
  } else if (allTags.includes('remote') || allTags.includes('kidepo') || allTags.includes('far')) {
    multiplier = 1.25;
  }

  if (country === 'uganda') {
    multiplier *= 1.15;
  }

  return multiplier;
}

async function computeRouteFromCapital(country: string, lat: number | null, lng: number | null, tags: string[]): Promise<{ distance_km: number | null; duration_min: number | null }> {
  if (lat == null || lng == null) return { distance_km: null, duration_min: null };
  const ref = COUNTRY_REFERENCE_POINTS[country];
  if (!ref) return { distance_km: null, duration_min: null };
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${ref.position[1]},${ref.position[0]};${lng},${lat}?overview=false&annotations=duration,distance&approaches=curb;curb&alternatives=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.[0]) {
      const route = data.routes[0];
      const distance_km = Math.round(route.distance / 1000 * 10) / 10;
      const multiplier = getTravelTimeMultiplier(tags, country);
      const duration_min = Math.round(distance_km * multiplier);
      return { distance_km, duration_min };
    }
  } catch {
    // leave null
  }
  return { distance_km: null, duration_min: null };
}

// Anon key + Row Level Security: public can only read published content and insert enquiries.
export const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

export type Media = { type: "image" | "video"; url: string; caption?: string | null };

export type Dest = {
  id: string; place_id: string; title: string; hook: string | null; story: string | null;
  region: string | null; best_months: string | null; best_time: string | null;
  budget_range: string | null; ideal_days: number | null; travel_time: string | null;
  tags: string[]; getting_there: string | null; local_tip: string | null; tip_author: string | null;
  plan_around: string | null; last_checked: string | null; updated_at: string | null;
  places: { name: string; slug: string };
  meta_title: string | null; meta_description: string | null;
  faq: { q: string; a: string }[] | null;
  latitude: number | null; longitude: number | null;
  distance_km: number | null; duration_min: number | null;
  media?: Media[] | null;
};

export type Activity = {
  id: string; name: string; description: string | null; cost_low: number | null;
  cost_high: number | null; currency: string | null; duration: string | null;
  media: Media[] | null; providers: { id: string; name: string; contact: string | null; email: string | null; website: string | null }[]; place_id?: string;
  latitude: number | null; longitude: number | null;
};

export type Stay = {
  id: string; name: string; description: string | null; tier: string | null;
  contact: string | null; email: string | null; website: string | null;
  media: Media[] | null;
  latitude: number | null; longitude: number | null;
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
export async function getDestinations(countryId: string, countrySlug?: string): Promise<Dest[]> {
  const { data } = await db()
    .from("destination_content")
    .select("*, places!inner(name,slug,parent_id,latitude,longitude)")
    .eq("status", "published")
    .eq("language", "en")
    .eq("places.parent_id", countryId)
    .order("title");
  const results = (data as (Dest & { places: { name: string; slug: string; parent_id: string; latitude: number | null; longitude: number | null } })[]) ?? [];
  // Compute distance + travel time from capital when not stored in DB
  const enriched = await Promise.all(results.map(async d => {
    let distance_km = d.distance_km;
    let duration_min = d.duration_min;
    if ((!distance_km || !duration_min) && d.places?.latitude != null && d.places?.longitude != null) {
      const route = await computeRouteFromCapital(countrySlug || countryId, d.places.latitude, d.places.longitude, d.tags ?? []);
      if (route.distance_km) distance_km = route.distance_km;
      if (route.duration_min) duration_min = route.duration_min;
    }
    return {
      ...d,
      latitude: d.places?.latitude ?? null,
      longitude: d.places?.longitude ?? null,
      distance_km,
      duration_min,
    };
  }));
  return enriched;
}

// Get all published destinations across all countries
export async function getAllDestinations(): Promise<Dest[]> {
  const { data } = await db()
    .from("destination_content")
    .select("*, places!inner(name,slug,parent_id,latitude,longitude)")
    .eq("status", "published")
    .eq("language", "en")
    .order("title");
  const results = (data as (Dest & { places: { latitude: number | null; longitude: number | null } })[]) ?? [];
  return results.map(d => ({
    ...d,
    latitude: d.places?.latitude ?? null,
    longitude: d.places?.longitude ?? null,
  }));
}

// Get destinations that share tags with the given destination (excluding itself)
export async function getRelatedDestinations(currentPlaceId: string, tags: string[], limit = 4): Promise<(Dest & { country?: string; engagement?: Engagement })[]> {
  if (!tags.length) return [];
  const { data } = await db()
    .from("destination_content")
    .select("*, places!inner(name,slug,parent_id,latitude,longitude)")
    .eq("status", "published")
    .eq("language", "en")
    .neq("place_id", currentPlaceId)
    .overlaps("tags", tags)
    .limit(limit * 2); // Fetch more to account for dedup
  let destinations = (data as (Dest & { places: { name: string; slug: string; parent_id: string; latitude: number | null; longitude: number | null } } & { engagement?: Engagement; country?: string })[]) ?? [];
  
  // Flatten lat/lon from places to top level
  destinations = destinations.map(d => ({
    ...d,
    latitude: d.places?.latitude ?? null,
    longitude: d.places?.longitude ?? null,
  }));

  // Deduplicate by place_id
  const seen = new Set<string>();
  destinations = destinations.filter(d => {
    if (seen.has(d.place_id)) return false;
    seen.add(d.place_id);
    return true;
  }).slice(0, limit);
  
  // Fetch country names and engagement for each destination
  const countryIds = [...new Set(destinations.map(d => d.places?.parent_id).filter(Boolean))];
  const countryNames = new Map<string, string>();
  if (countryIds.length) {
    const { data: countries } = await db()
      .from("places")
      .select("id,name")
      .in("id", countryIds);
    for (const c of countries ?? []) countryNames.set(c.id, c.name);
  }
  
  // Fetch first activity media and engagement for each destination
  for (const d of destinations) {
    const [activities, engagement] = await Promise.all([
      getActivities(d.place_id),
      getEngagementForPlaces([d.place_id]),
    ]);
    if (activities.length > 0 && activities[0].media?.length) {
      d.media = activities[0].media;
    }
    d.engagement = engagement[d.place_id] ?? { likes: 0, reviews: 0, avgRating: 0 };
    d.country = d.places?.parent_id ? countryNames.get(d.places.parent_id) ?? "" : "";
  }
  
  return destinations;
}

// Published activities for one destination, e.g. rafting, boat trips, market walks.
export async function getActivities(placeId: string): Promise<Activity[]> {
  const { data } = await db()
    .from("activities")
    .select("id,name,description,cost_low,cost_high,currency,duration,media")
    .eq("status", "published")
    .eq("place_id", placeId)
    .order("name");
  const acts = (data as Activity[]) ?? [];
  if (!acts.length) return acts;

  // Fetch all providers for all activities in one query (avoids N+1)
  const { data: links } = await db()
    .from("activity_providers")
    .select("activity_id, partner_id")
    .in("activity_id", acts.map(a => a.id));
  const byActivity: Record<string, string[]> = {};
  for (const l of (links ?? [])) {
    if (!byActivity[l.activity_id]) byActivity[l.activity_id] = [];
    byActivity[l.activity_id].push(l.partner_id);
  }

  const allPids = Array.from(new Set(Object.values(byActivity).flat()));
  let partners: Record<string, { id: string; name: string; contact: string | null; email: string | null; website: string | null }> = {};
  if (allPids.length) {
    const { data: ps } = await db()
      .from("partners")
      .select("id,name,contact,email,website")
      .in("id", allPids);
    for (const p of (ps ?? [])) partners[p.id] = { id: p.id, name: p.name, contact: p.contact, email: p.email, website: p.website };
  }

  for (const a of acts) {
    const pids = byActivity[a.id] ?? [];
    a.providers = pids.map(pid => partners[pid]).filter(Boolean);
  }
  return acts;
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
  const acts = (data as unknown as Activity[]) ?? [];
  if (!acts.length) return {};

  // Fetch all providers for all activities in one query (avoids N+1)
  const { data: links } = await db()
    .from("activity_providers")
    .select("activity_id, partner_id")
    .in("activity_id", acts.map(a => a.id));
  const byActivity: Record<string, string[]> = {};
  for (const l of (links ?? [])) {
    if (!byActivity[l.activity_id]) byActivity[l.activity_id] = [];
    byActivity[l.activity_id].push(l.partner_id);
  }

  const allPids = Array.from(new Set(Object.values(byActivity).flat()));
  let partners: Record<string, { id: string; name: string; contact: string | null; email: string | null; website: string | null }> = {};
  if (allPids.length) {
    const { data: ps } = await db()
      .from("partners")
      .select("id,name,contact,email,website")
      .in("id", allPids);
    for (const p of (ps ?? [])) partners[p.id] = { id: p.id, name: p.name, contact: p.contact, email: p.email, website: p.website };
  }

  for (const a of acts) {
    const pids = byActivity[a.id] ?? [];
    a.providers = pids.map(pid => partners[pid]).filter(Boolean);
  }

  const byPlace: Record<string, Activity[]> = {};
  for (const a of acts) {
    const pid = a.place_id;
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
    .select("id,name,description,tier,contact,email,website,media,latitude,longitude")
    .eq("type", "lodge")
    .eq("active", true)
    .contains("place_ids", [placeId]);
  const order = ["budget", "mid", "comfort"];
  return ((data as Stay[]) ?? []).sort((a, b) => order.indexOf(a.tier ?? "") - order.indexOf(b.tier ?? ""));
}

// All partners that can act as activity providers (any partner type).
export async function getActivityProviders(): Promise<{ id: string; name: string; type: string; contact: string | null }[]> {
  const { data } = await db()
    .from("partners")
    .select("id,name,type,contact")
    .eq("active", true)
    .order("type,name");
  return (data ?? []).map(p => ({ id: p.id, name: p.name, type: p.type, contact: p.contact }));
}

// Public engagement metrics for destination cards.
export async function getViewCounts(paths: string[]): Promise<Record<string, number>> {
  if (!paths.length) return {};
  const { data } = await db().from("page_views").select("path").in("path", paths);
  const counts: Record<string, number> = {};
  for (const p of (data as { path: string }[]) ?? []) counts[p.path] = (counts[p.path] ?? 0) + 1;
  return counts;
}

export type Engagement = { likes: number; reviews: number; avgRating: number };

export async function getEngagementForPlaces(placeIds: string[]): Promise<Record<string, Engagement>> {
  if (!placeIds.length) return {};
  const [{ data: likes }, { data: reviews }] = await Promise.all([
    db().from("destination_likes").select("place_id").in("place_id", placeIds),
    db().from("destination_reviews").select("place_id, rating").in("place_id", placeIds),
  ]);
  const out: Record<string, Engagement> = {};
  for (const pid of placeIds) {
    const l = (likes as { place_id: string }[] ?? []).filter(x => x.place_id === pid).length;
    const r = (reviews as { place_id: string; rating: number }[] ?? []).filter(x => x.place_id === pid);
    const avg = r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0;
    out[pid] = { likes: l, reviews: r.length, avgRating: Math.round(avg * 10) / 10 };
  }
  return out;
}

// Stays count for destination cards.
export async function getStaysCounts(placeIds: string[]): Promise<Record<string, number>> {
  if (!placeIds.length) return {};
  const { data } = await db()
    .from("partners")
    .select("id, place_ids")
    .eq("type", "lodge")
    .eq("active", true);
  const counts: Record<string, number> = {};
  for (const pid of placeIds) {
    counts[pid] = (data ?? []).filter(p => p.place_ids?.includes(pid)).length;
  }
  return counts;
}
