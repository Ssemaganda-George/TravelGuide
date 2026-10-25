import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { admin } from "@/lib/admin";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Content", robots: { index: false } };
export const dynamic = "force-dynamic";

async function createDestination(fd: FormData) {
  "use server";
  const sb = await authClient();
  const name = String(fd.get("name") ?? "").trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const latitude = parseFloat(String(fd.get("latitude"))) || null;
  const longitude = parseFloat(String(fd.get("longitude"))) || null;
  const tags = String(fd.get("tags") ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  const region = String(fd.get("region") ?? "").trim() || null;
  const { data: c } = await sb.from("places").select("id, lat, lng").eq("type", "country").eq("slug", String(fd.get("country"))).single();
  if (!name || !slug || !c) redirect("/admin/content?error=1");
  
  function getTerrainMultiplier(tags: string[], region: string | null): number {
    const allTags = [...tags, ...(region?.toLowerCase().split(/\s+/) || [])];
    const tagStr = allTags.join(' ');
    
    if (tagStr.includes('mountain') || tagStr.includes('rwenzori') || tagStr.includes('elgon') || 
        tagStr.includes('volcano') || tagStr.includes('hiking') || tagStr.includes('trekking')) {
      return 1.5;
    }
    if (tagStr.includes('park') || tagStr.includes('wildlife') || tagStr.includes('reserve') ||
        tagStr.includes('forest') || tagStr.includes('gorilla') || tagStr.includes('chimpanzee')) {
      return 1.3;
    }
    if (tagStr.includes('remote') || tagStr.includes('kidepo') || tagStr.includes('far')) {
      return 1.25;
    }
    return 1.0;
  }
  
  // Calculate distance and duration from capital if coordinates provided
  let distance_km: number | null = null;
  let duration_min: number | null = null;
  
  if (latitude != null && longitude != null && c.lat != null && c.lng != null) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${c.lng},${c.lat};${longitude},${latitude}?overview=false`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        distance_km = Math.round(route.distance / 1000 * 10) / 10;
        const baseDurationMin = Math.round(route.duration / 60);
        const multiplier = getTerrainMultiplier(tags, region);
        duration_min = Math.round(baseDurationMin * multiplier);
      }
    } catch (e) {
      console.warn("Failed to calculate distance from capital:", e);
    }
  }
  
  const { data: pl } = await sb.from("places").insert({ name, slug, type: "destination", parent_id: c.id, latitude, longitude }).select("id").single();
  if (!pl) redirect("/admin/content?error=1");
  const { data: ct } = await sb.from("destination_content").insert({ place_id: pl.id, title: name, language: "en", distance_km, duration_min }).select("id").single();
  redirect(ct ? `/admin/content/${ct.id}` : "/admin/content?error=1");
}

export default async function Content({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;
  const { error } = await searchParams;
  const [{ data }, { data: countries }] = await Promise.all([
    sb.from("destination_content").select("id,title,status,last_checked,language").order("title"),
    sb.from("places").select("name,slug").eq("type", "country"),
  ]);
  return (
    <div className="wrap page">
      <h1>Destination content</h1>
      <div className="tbl"><table>
        <thead><tr><th>Title</th><th>Language</th><th>Status</th><th>Last checked</th><th></th></tr></thead>
        <tbody>{(data ?? []).map(d => (
          <tr key={d.id}><td><Link href={`/admin/content/${d.id}`}>{d.title}</Link></td><td>{d.language}</td><td>{d.status}</td><td>{d.last_checked ?? "never"}</td><td><Link href={`/admin/content/${d.id}`}>Edit</Link></td></tr>))}</tbody>
      </table></div>
      <form className="form" action={createDestination}>
        <h2>New destination</h2>
        <div className="row2">
          <div><label htmlFor="dn">Name</label><input id="dn" name="name" required /></div>
          <div><label htmlFor="dc">Country</label><select id="dc" name="country">{(countries ?? []).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
        </div>
        <div className="row2">
          <div><label htmlFor="lat">Latitude</label><input id="lat" name="latitude" type="number" step="any" placeholder="-0.123456" /></div>
          <div><label htmlFor="lng">Longitude</label><input id="lng" name="longitude" type="number" step="any" placeholder="32.123456" /></div>
        </div>
        <p className="hint">Enter coordinates first, then save. Travel time from capital will be auto-calculated.</p>
        {error && <p className="msg" role="alert">Could not create it. The name may already exist.</p>}
        <button className="go">Create and edit</button>
      </form>
    </div>
  );
}
