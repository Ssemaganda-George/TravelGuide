import type { Metadata } from "next";
import { admin } from "@/lib/admin";
import { addPartner, togglePartner } from "../actions";

export const metadata: Metadata = { title: "Partners", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Partners() {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;
  const { data } = await sb.from("partners").select("*").order("name");
  return (
    <div className="wrap page">
      <h1>Partners</h1>
      <div className="tbl"><table>
        <thead><tr><th>Name</th><th>Type</th><th>Contact</th><th>Email</th><th>Website</th><th>Commission</th><th>Agreement</th><th>Payment terms</th><th></th></tr></thead>
        <tbody>{(data ?? []).map(p => (
          <tr key={p.id} className={p.active ? "" : "off"}>
            <td>{p.name}<br /><span className="meta">{p.contact}</span></td><td>{p.type}</td><td>{p.contact}</td>
            <td>{p.email ?? "-"}</td><td>{p.website ?? "-"}</td>
            <td>{p.commission_rate != null ? `${p.commission_rate}%` : p.commission_flat != null ? `${p.commission_flat} ${p.currency}` : "-"}</td>
            <td>{p.agreement_status}</td><td>{p.payment_terms}</td>
            <td><form action={togglePartner}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={String(!p.active)} />
              <button className="chip">{p.active ? "Deactivate" : "Activate"}</button></form></td>
          </tr>))}</tbody>
      </table></div>
      <form className="form" action={addPartner}>
        <h2>Add a partner</h2>
        <label htmlFor="pn">Name</label><input id="pn" name="name" required />
        <div className="row2">
          <div><label htmlFor="pt">Type</label><select id="pt" name="type">{["lodge", "operator", "driver", "guide", "activity"].map(x => <option key={x}>{x}</option>)}</select></div>
          <div><label htmlFor="pc">Contact (WhatsApp or email)</label><input id="pc" name="contact" /></div>
          <div><label htmlFor="pe">Email</label><input id="pe" name="email" placeholder="info@partner.com" /></div>
          <div><label htmlFor="pw">Website</label><input id="pw" name="website" placeholder="https://partner.com" /></div>
          <div><label htmlFor="pr">Commission %</label><input id="pr" name="rate" type="number" step="0.1" min="0" max="100" /></div>
          <div><label htmlFor="pf">or flat fee</label><input id="pf" name="flat" type="number" step="0.01" min="0" /></div>
          <div><label htmlFor="pa">Agreement</label><select id="pa" name="agreement"><option>none</option><option>agreed</option><option>signed</option></select></div>
          <div><label htmlFor="pp">Payment terms</label><input id="pp" name="terms" placeholder="e.g. 30 days after trip" /></div>
        </div>
        <label htmlFor="po">Notes</label><textarea id="po" name="notes" rows={2} />
        <button className="go">Add partner</button>
      </form>
    </div>
  );
}
