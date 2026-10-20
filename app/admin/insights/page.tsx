import type { Metadata } from "next";
import { admin } from "@/lib/admin";

export const metadata: Metadata = { title: "Insights", robots: { index: false } };
export const dynamic = "force-dynamic";

const DAYS = 30;
type Page = { path: string; views: number; visitors: number; enquiries: number };
type Source = { channel: string; views: number; visitors: number };

const top = (rows: Record<string, unknown>[], key: string, n = 6): [string, number][] => {
  const c: Record<string, number> = {};
  rows.forEach(r => { const k = String(r[key] ?? "").trim() || "(none)"; c[k] = (c[k] ?? 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n);
};
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");

export default async function Insights() {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;
  const [{ data: pg }, { data: src }, { data: enq }] = await Promise.all([
    sb.rpc("page_stats", { p_days: DAYS }),
    sb.rpc("source_stats", { p_days: DAYS }),
    sb.from("enquiries").select("status,lost_reason,created_at").limit(2000),
  ]);
  const pages = (pg ?? []) as Page[], sources = (src ?? []) as Source[], rows = enq ?? [];
  const views = sources.reduce((a, s) => a + s.views, 0), visitors = sources.reduce((a, s) => a + s.visitors, 0);
  const recent = rows.filter(r => Date.now() - new Date(r.created_at).getTime() < DAYS * 864e5);
  const booked = rows.filter(r => r.status === "booked").length;
  const lost = top(rows.filter(r => r.status === "lost"), "lost_reason");
  return (
    <div className="wrap page">
      <h1>Insights</h1>
      <p className="hook">Last {DAYS} days: {views} views · {visitors} visitors · {recent.length} enquiries ({pct(recent.length, visitors)} of visitors)</p>

      <div className="form"><h3>Pages: views and enquiries</h3>
        {pages.length ? <div className="tbl"><table>
          <thead><tr><th>Page</th><th>Views</th><th>Visitors</th><th>Enquiries</th><th>Enquiry rate</th></tr></thead>
          <tbody>{pages.map(p => <tr key={p.path}><td>{p.path}</td><td>{p.views}</td><td>{p.visitors}</td><td>{p.enquiries}</td><td>{pct(p.enquiries, p.visitors)}</td></tr>)}</tbody>
        </table></div> : <p className="meta">No views recorded yet. They appear once visitors open your pages.</p>}
        <p className="meta">Pages with many visitors but no enquiries need a clearer call to action. Pages with few visitors but good enquiry rates deserve more promotion.</p>
      </div>

      <div className="form"><h3>Where visitors come from</h3>
        {sources.length ? <div className="tbl"><table>
          <thead><tr><th>Source</th><th>Views</th><th>Visitors</th></tr></thead>
          <tbody>{sources.slice(0, 12).map(s => <tr key={s.channel}><td>{s.channel}</td><td>{s.views}</td><td>{s.visitors}</td></tr>)}</tbody>
        </table></div> : <p className="meta">Nothing yet.</p>}
        <p className="meta">Add ?utm_source=tiktok (or instagram, whatsapp) to links you share, so each channel shows up by name.</p>
      </div>

      <div className="form"><h3>Enquiries</h3>
        <p>{rows.length} total · {booked} booked ({pct(booked, rows.length)})</p>
        {top(rows, "status").map(([k, v]) => <span className="chip" key={k} style={{ marginRight: 8 }}>{k}: {v}</span>)}
        <h3 style={{ marginTop: 20 }}>Why enquiries were lost</h3>
        {lost.length ? <div className="tbl"><table><tbody>{lost.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table></div> : <p className="meta">Nothing yet.</p>}
      </div>

      <p className="meta">Visitors are counted per day, so someone returning on another day counts again. Search rankings and queries come from Google Search Console.</p>
    </div>
  );
}
