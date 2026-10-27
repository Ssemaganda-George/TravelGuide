import type { Metadata } from "next";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Enquiries", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "quoted", "booked", "lost"];

async function signOut(fd: FormData) {
  "use server";
  const sb = await authClient();
  await sb.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

async function updateStatus(fd: FormData) {
  "use server";
  const sb = await authClient();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  const lost_reason = String(fd.get("lost_reason")) || null;
  const { error } = await sb.from("enquiries").update({ status, lost_reason }).eq("id", id);
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));
  redirect("/admin?success=" + encodeURIComponent("Status updated successfully"));
}

export default async function Admin() {
  const sb = await authClient();
  const { data: admin } = await sb.from("admins").select("user_id").maybeSingle();
  if (!admin) redirect("/admin/login");
  const { data } = await sb.from("enquiries").select("*, places(name)").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const waiting = rows.filter(r => r.status === "new").length;
  return (
    <div className="wrap page" style={{ padding: "16px" }}>
      <h1>Enquiries</h1>
      <p className="hook">{waiting ? `${waiting} waiting for a first reply` : "No new enquiries."}</p>
      <form action={signOut} style={{ marginBottom: 16 }}><button className="chip">Sign out</button></form>
      {rows.map(r => {
        const link = r.contact_method === "whatsapp" ? `https://wa.me/${String(r.contact).replace(/\D/g, "")}` : `mailto:${r.contact}`;
        return (
          <div className="form" key={r.id} style={{ padding: "16px" }}>
            <h3>{r.name} <span className={`badge badge-${r.status}`}>{r.status}</span> <span className="meta">· {r.places?.name ?? "General"}</span></h3>
            <p className="meta">{new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Africa/Kampala" })} · from {r.source_channel || "direct"}</p>
            <p><a href={link}>{r.contact}</a> ({r.contact_method})<br />
              {[r.travel_dates, r.group_size && `${r.group_size} travellers`, r.budget, (r.interests ?? []).join(", ")].filter(Boolean).join(" · ")}</p>
            {r.message && <p>{r.message}</p>}
            <form action={updateStatus} className="row">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.status} aria-label="Status">{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
              <input name="lost_reason" placeholder="If lost: why?" defaultValue={r.lost_reason ?? ""} />
              <button className="go" style={{ marginTop: 0 }}>Save status</button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
