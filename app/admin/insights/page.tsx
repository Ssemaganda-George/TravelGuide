import type { Metadata } from "next";
import { admin } from "@/lib/admin";
import { DateFilter } from "@/components/DateFilter";
import TrendChart from "@/components/TrendChart";

export const metadata: Metadata = { title: "Insights", robots: { index: false } };
export const dynamic = "force-dynamic";

function getPresetRange(preset: string) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      start.setDate(end.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "quarter":
      start.setMonth(end.getMonth() - 3);
      start.setDate(end.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      start.setDate(end.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / 864e5) || 1;
}

type Page = { path: string; views: number; visitors: number; enquiries: number };
type Source = { channel: string; views: number; visitors: number };

const top = (rows: Record<string, unknown>[], key: string, n = 6): [string, number][] => {
  const c: Record<string, number> = {};
  rows.forEach(r => { const k = String(r[key] ?? "").trim() || "(none)"; c[k] = (c[k] ?? 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n);
};
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");

export default async function Insights({ searchParams }: { searchParams: Promise<{ preset?: string; start?: string; end?: string }> }) {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;

  const params = await searchParams;
  const preset = params.preset ?? "month";
  const customStart = params.start;
  const customEnd = params.end;

  const { start, end } = customStart && customEnd
    ? { start: customStart, end: customEnd }
    : getPresetRange(preset);

  const pDays = daysBetween(start, end);

  const endInclusive = end + "T23:59:59.999Z";
  const [{ data: pg }, { data: src }, { data: enq }, { data: pv }] = await Promise.all([
    sb.rpc("page_stats", { p_days: pDays }),
    sb.rpc("source_stats", { p_days: pDays }),
    sb.from("enquiries").select("created_at,status").limit(5000),
    sb.from("page_views").select("created_at,visitor").gte("created_at", start).lte("created_at", endInclusive),
  ]);
  const pages = (pg ?? []) as Page[], sources = (src ?? []) as Source[], rows = enq ?? [], pageViews = pv ?? [];

  const dailyMap = new Map<string, { views: number; visitors: number; enquiries: number }>();
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  e.setDate(e.getDate() + 1);
  for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    dailyMap.set(d.toISOString().split("T")[0], { views: 0, visitors: 0, enquiries: 0 });
  }
  const visitorsByDay = new Map<string, Set<string>>();
  for (const v of pageViews) {
    const day = new Date(v.created_at).toISOString().split("T")[0];
    const cur = dailyMap.get(day) ?? { views: 0, visitors: 0, enquiries: 0 };
    cur.views += 1;
    if (!visitorsByDay.has(day)) visitorsByDay.set(day, new Set());
    visitorsByDay.get(day)!.add(v.visitor);
    dailyMap.set(day, cur);
  }
  for (const [day, set] of visitorsByDay) {
    const cur = dailyMap.get(day);
    if (cur) cur.visitors = set.size;
  }
  for (const r of rows) {
    const day = new Date(r.created_at).toISOString().split("T")[0];
    const cur = dailyMap.get(day);
    if (cur) cur.enquiries += 1;
    else dailyMap.set(day, { views: 0, visitors: 0, enquiries: 1 });
  }
  const trendData = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const views = sources.reduce((a, s) => a + s.views, 0), visitors = sources.reduce((a, s) => a + s.visitors, 0);
  const recent = rows.filter(r => Date.now() - new Date(r.created_at).getTime() < pDays * 864e5);
  const booked = rows.filter(r => r.status === "booked").length;
  const lost = top(rows.filter(r => r.status === "lost"), "lost_reason");

  return (
    <div className="wrap page" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <h1>Insights</h1>
        <DateFilter preset={preset} start={start} end={end} path="/admin/insights" />
      </div>

      <p className="hook" style={{ marginBottom: 24 }}>
        Showing data from <strong>{formatDate(start)}</strong> to <strong>{formatDate(end)}</strong>: {views} views · {visitors} visitors · {recent.length} enquiries ({pct(recent.length, visitors)} of visitors)
      </p>

      {trendData.length > 0 && <TrendChart data={trendData} start={start} end={end} />}

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
