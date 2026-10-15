import type { Metadata } from "next";
import { authClient } from "@/lib/supabase/server";
import { updateStatus, signOut } from "./actions";

export const metadata: Metadata = { title: "Enquiries", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "quoted", "booked", "lost"];

export default async function Admin() {
  const sb = await authClient();
  const { data: admin } = await sb.from("admins").select("user_id").maybeSingle();
  if (!admin) return (
    <div className="wrap page"><h1>No access</h1>
      <p>This account isn&apos;t an admin. Add its user id to the admins table.</p>
      <form action={signOut}><button className="go">Sign out</button></form></div>
  );
  const { data } = await sb.from("enquiries").select("*, places(name)").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const waiting = rows.filter(r => r.status === "new").length;
  return (
    <div className="wrap page" style={{ maxWidth: 900 }}>
      <h1>Enquiries</h1>
      <p className="hook">{waiting ? `${waiting} waiting for a first reply` : "No new enquiries."}</p>
      <form action={signOut}><button className="chip">Sign out</button></form>
      {rows.map(r => {
        const link = r.contact_method === "whatsapp" ? `https://wa.me/${String(r.contact).replace(/\D/g, "")}` : `mailto:${r.contact}`;
        return (
          <div className="form" key={r.id}>
            <h3>{r.name} <span className="meta">· {r.places?.name ?? "General"}</span></h3>
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
