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
  const { data: c } = await sb.from("places").select("id").eq("type", "country").eq("slug", String(fd.get("country"))).single();
  if (!name || !slug || !c) redirect("/admin/content?error=1");
  const { data: pl } = await sb.from("places").insert({ name, slug, type: "destination", parent_id: c.id }).select("id").single();
  if (!pl) redirect("/admin/content?error=1");
  const { data: ct } = await sb.from("destination_content").insert({ place_id: pl.id, title: name, language: "en" }).select("id").single();
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
        {error && <p className="msg" role="alert">Could not create it. The name may already exist.</p>}
        <button className="go">Create and edit</button>
      </form>
    </div>
  );
}
