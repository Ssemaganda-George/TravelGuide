import type { Metadata } from "next";
import { admin } from "@/lib/admin";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Referrals", robots: { index: false } };
export const dynamic = "force-dynamic";

async function addReferral(fd: FormData) {
  "use server";
  const sb = await authClient();
  const t = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim() || null;
  const num = (fd: FormData, k: string) => { const v = parseFloat(String(fd.get(k))); return isNaN(v) ? null : v; };
  const value = num(fd, "value");
  const { data: p } = await sb.from("partners").select("commission_rate,commission_flat,currency").eq("id", String(fd.get("partner"))).single();
  const due = p ? (p.commission_rate != null && value != null ? (value * p.commission_rate) / 100 : p.commission_flat) : null;
  await sb.from("referrals").insert({
    enquiry_id: String(fd.get("enquiry")), partner_id: String(fd.get("partner")),
    booking_value: value, currency: p?.currency ?? "USD", commission_due: due, trip_date: t(fd, "trip"),
  });
  revalidatePath("/admin/referrals");
}

async function setCommissionStatus(fd: FormData) {
  "use server";
  const sb = await authClient();
  const status = String(fd.get("status"));
  if (!["pending", "invoiced", "paid"].includes(status)) return;
  await sb.from("referrals").update({ commission_status: status, paid_date: status === "paid" ? new Date().toISOString().slice(0, 10) : null }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/referrals");
}

export default async function Referrals() {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;
  const [{ data: refs }, { data: enqs }, { data: partners }] = await Promise.all([
    sb.from("referrals").select("*, enquiries(name), partners(name)").order("trip_date", { ascending: false, nullsFirst: true }),
    sb.from("enquiries").select("id,name,status,places(name)").order("created_at", { ascending: false }).limit(100),
    sb.from("partners").select("id,name").eq("active", true).order("name"),
  ]);
  const rows = refs ?? [];
  const totals: Record<string, number> = {};
  rows.forEach(r => { const k = `${r.commission_status} (${r.currency})`; totals[k] = (totals[k] ?? 0) + Number(r.commission_due ?? 0); });
  return (
    <div className="wrap page">
      <h1>Referrals and commissions</h1>
      <p className="hook">{Object.keys(totals).length ? Object.entries(totals).map(([k, v]) => `${k}: ${v.toFixed(2)}`).join(" · ") : "No referrals yet."}</p>
      <div className="tbl"><table>
        <thead><tr><th>Guest</th><th>Partner</th><th>Booking</th><th>Commission due</th><th>Trip</th><th>Status</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id}>
            <td>{r.enquiries?.name}</td><td>{r.partners?.name}</td>
            <td>{r.booking_value ?? "-"} {r.currency}</td><td>{r.commission_due != null ? Number(r.commission_due).toFixed(2) : "-"}</td>
            <td>{r.trip_date ?? "-"}</td>
            <td><form action={setCommissionStatus} className="inline"><input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.commission_status} aria-label="Commission status">{["pending", "invoiced", "paid"].map(s => <option key={s}>{s}</option>)}</select>
              <button className="chip">Save</button></form></td>
          </tr>))}</tbody>
      </table></div>
      <form className="form" action={addReferral}>
        <h2>Record a referral</h2>
        <div className="row2">
          <div><label htmlFor="re">Enquiry</label><select id="re" name="enquiry" required>{(enqs ?? []).map(e => <option key={e.id} value={e.id}>{e.name} · {(e.places as unknown as { name: string } | null)?.name ?? "General"} · {e.status}</option>)}</select></div>
          <div><label htmlFor="rp">Partner</label><select id="rp" name="partner" required>{(partners ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label htmlFor="rv">Booking value</label><input id="rv" name="value" type="number" step="0.01" min="0" /></div>
          <div><label htmlFor="rt">Trip date</label><input id="rt" name="trip" type="date" /></div>
        </div>
        <p className="meta">Commission is calculated from the partner rate or flat fee when you save.</p>
        <button className="go">Save referral</button>
      </form>
    </div>
  );
}
