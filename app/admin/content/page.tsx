import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { admin } from "@/lib/admin";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    <div className="mx-auto w-full max-w-6xl space-y-8 py-2">
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Content library</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Destinations</h1>
        <p className="text-muted-foreground mt-2 text-sm">Review published content and add a destination.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Destination content</CardTitle><CardDescription>{data?.length ?? 0} destinations</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Language</TableHead><TableHead>Status</TableHead><TableHead>Last checked</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>{(data ?? []).map(d => (
              <TableRow key={d.id}><TableCell className="font-medium">{d.title}</TableCell><TableCell>{d.language}</TableCell><TableCell><Badge variant="secondary">{d.status ?? "Draft"}</Badge></TableCell><TableCell className="text-muted-foreground">{d.last_checked ?? "Never"}</TableCell><TableCell className="text-right"><Button asChild variant="ghost" size="sm"><Link href={`/admin/content/${d.id}`}>Edit</Link></Button></TableCell></TableRow>
            ))}{!data?.length && <TableRow><TableCell colSpan={5} className="text-muted-foreground h-24 text-center">No destinations yet. Add the first one below.</TableCell></TableRow>}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>New destination</CardTitle><CardDescription>Add the location first, then edit its content.</CardDescription></CardHeader>
        <CardContent>
          <form action={createDestination} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="dn">Name</Label><Input id="dn" name="name" required /></div>
              <div className="space-y-2"><Label htmlFor="dc">Country</Label><select id="dc" name="country" className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm">{(countries ?? []).map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="lat">Latitude</Label><Input id="lat" name="latitude" type="number" step="any" placeholder="-0.123456" /></div>
              <div className="space-y-2"><Label htmlFor="lng">Longitude</Label><Input id="lng" name="longitude" type="number" step="any" placeholder="32.123456" /></div>
            </div>
            <p className="text-muted-foreground text-sm">Coordinates let us estimate travel time from the capital.</p>
            {error && <p className="text-destructive text-sm" role="alert">Could not create this destination. The name may already exist.</p>}
            <Button type="submit">Create destination</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
