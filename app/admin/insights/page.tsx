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

const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AD: "Andorra", AO: "Angola",
  AR: "Argentina", AM: "Armenia", AU: "Australia", AT: "Austria", AZ: "Azerbaijan",
  BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh", BB: "Barbados", BY: "Belarus",
  BE: "Belgium", BZ: "Belize", BJ: "Benin", BM: "Bermuda", BT: "Bhutan",
  BO: "Bolivia", BA: "Bosnia and Herzegovina", BW: "Botswana", BR: "Brazil",
  BN: "Brunei", BG: "Bulgaria", BF: "Burkina Faso", BI: "Burundi", CV: "Cabo Verde",
  KH: "Cambodia", CM: "Cameroon", CA: "Canada", CF: "Central African Republic",
  TD: "Chad", CL: "Chile", CN: "China", CO: "Colombia", KM: "Comoros",
  CG: "Congo", CD: "Congo (Democratic Republic)", CR: "Costa Rica", CI: "Côte d'Ivoire",
  HR: "Croatia", CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark",
  DJ: "Djibouti", DM: "Dominica", DO: "Dominican Republic", EC: "Ecuador",
  EG: "Egypt", SV: "El Salvador", GQ: "Equatorial Guinea", ER: "Eritrea",
  EE: "Estonia", SZ: "Eswatini", ET: "Ethiopia", FJ: "Fiji", FI: "Finland",
  FR: "France", GA: "Gabon", GM: "Gambia", GE: "Georgia", DE: "Germany",
  GH: "Ghana", GR: "Greece", GT: "Guatemala", GN: "Guinea", GW: "Guinea-Bissau",
  GY: "Guyana", HT: "Haiti", HN: "Honduras", HU: "Hungary", IS: "Iceland",
  IN: "India", ID: "Indonesia", IR: "Iran", IQ: "Iraq", IE: "Ireland",
  IL: "Israel", IT: "Italy", JM: "Jamaica", JP: "Japan", JO: "Jordan",
  KZ: "Kazakhstan", KE: "Kenya", KI: "Kiribati", KP: "Korea (North)",
  KR: "Korea (South)", KW: "Kuwait", KG: "Kyrgyzstan", LA: "Laos",
  LV: "Latvia", LB: "Lebanon", LS: "Lesotho", LR: "Liberia", LY: "Libya",
  LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg", MG: "Madagascar",
  MW: "Malawi", MY: "Malaysia", MV: "Maldives", ML: "Mali", MT: "Malta",
  MH: "Marshall Islands", MR: "Mauritania", MU: "Mauritius", MX: "Mexico",
  FM: "Micronesia", MD: "Moldova", MC: "Monaco", MN: "Mongolia", ME: "Montenegro",
  MA: "Morocco", MZ: "Mozambique", MM: "Myanmar", NA: "Namibia", NR: "Nauru",
  NP: "Nepal", NL: "Netherlands", NZ: "New Zealand", NI: "Nicaragua",
  NE: "Niger", NG: "Nigeria", MK: "North Norway", NO: "Norway", OM: "Oman",
  PK: "Pakistan", PW: "Palau", PA: "Panama", PG: "Papua New Guinea",
  PY: "Paraguay", PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal",
  QA: "Qatar", RO: "Romania", RU: "Russia", RW: "Rwanda", KN: "Saint Kitts and Nevis",
  LC: "Saint Lucia", VC: "Saint Vincent and the Grenadines", WS: "Samoa",
  SM: "San Marino", ST: "Sao Tome and Principe", SA: "Saudi Arabia", SN: "Senegal",
  RS: "Serbia", SC: "Seychelles", SL: "Sierra Leone", SG: "Singapore",
  SK: "Slovakia", SI: "Slovenia", SB: "Solomon Islands", SO: "Somalia",
  ZA: "South Africa", SS: "South Sudan", ES: "Spain", LK: "Sri Lanka",
  SD: "Sudan", SR: "Suriname", SE: "Sweden", CH: "Switzerland", SY: "Syria",
  TW: "Taiwan", TJ: "Tajikistan", TZ: "Tanzania", TH: "Thailand", TL: "Timor-Leste",
  TG: "Togo", TO: "Tonga", TT: "Trinidad and Tobago", TN: "Tunisia", TR: "Türkiye",
  TM: "Turkmenistan", TV: "Tuvalu", UG: "Uganda", UA: "Ukraine", AE: "United Arab Emirates",
  GB: "United Kingdom", US: "United States", UY: "Uruguay", UZ: "Uzbekistan",
  VU: "Vanuatu", VA: "Vatican City", VE: "Venezuela", VN: "Vietnam",
  YE: "Yemen", ZM: "Zambia", ZW: "Zimbabwe",
};

const countryName = (code: string | null | undefined) => {
  if (!code) return "Unknown";
  return COUNTRY_NAMES[code.toUpperCase()] || code;
};

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
  const [{ data: pg }, { data: src }, { data: enq }] = await Promise.all([
    sb.rpc("page_stats", { p_days: pDays }),
    sb.rpc("source_stats", { p_days: pDays }),
    sb.from("enquiries").select("created_at,status").limit(5000),
  ]);
  const pages = (pg ?? []) as Page[], sources = (src ?? []) as Source[], rows = enq ?? [];

  // Exclude admin-touched paths from page stats
  const nonAdminPages = pages.filter(p => !p.path.includes("/admin"));

  // Fetch page_views with country column (may not exist if migration 023 not applied yet)
  let pageViews: { path: string; created_at: string; visitor: string; country?: string | null }[] = [];
  try {
    const { data } = await sb.from("page_views").select("path,created_at,visitor,country").gte("created_at", start).lte("created_at", endInclusive);
    pageViews = data?.filter(v => !v.path.includes("/admin")) ?? [];
  } catch {
    const { data } = await sb.from("page_views").select("path,created_at,visitor").gte("created_at", start).lte("created_at", endInclusive);
    pageViews = data?.filter(v => !v.path.includes("/admin")) ?? [];
  }

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

  const views = pageViews.length;
  const visitorHashes = new Set(pageViews.map(v => v.visitor));
  const visitors = visitorHashes.size;

  // Visitor countries from page_views
  const countryTotals = new Map<string, { views: number; visitors: Set<string> }>();
  for (const v of pageViews) {
    const c = v.country ?? "Unknown";
    const existing = countryTotals.get(c) ?? { views: 0, visitors: new Set() };
    existing.views += 1;
    existing.visitors.add(v.visitor);
    countryTotals.set(c, existing);
  }
  const countryRows = Array.from(countryTotals.entries())
    .sort((a, b) => b[1].views - a[1].views)
    .map(([country, v]) => ({ country: country as string, views: v.views, visitors: v.visitors.size }));

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

      <section style={{ marginBottom: 24 }}>
        <h2>Visitor Activity</h2>
        <div className="cardstats">
          <div className="stat"><strong>{views.toLocaleString()}</strong> Page Views</div>
          <div className="stat"><strong>{visitors.toLocaleString()}</strong> Unique Visitors</div>
          <div className="stat"><strong>{visitors > 0 ? (views / visitors).toFixed(1) : 0}</strong> Pages per Visitor</div>
        </div>
      </section>

      {trendData.length > 0 && <TrendChart data={trendData} start={start} end={end} />}

      <div className="form"><h3>Pages: views and enquiries</h3>
        {nonAdminPages.length ? <div className="tbl"><table>
          <thead><tr><th>Page</th><th>Views</th><th>Visitors</th><th>Enquiries</th><th>Enquiry rate</th></tr></thead>
          <tbody>{nonAdminPages.map(p => <tr key={p.path}><td>{p.path}</td><td>{p.views}</td><td>{p.visitors}</td><td>{p.enquiries}</td><td>{pct(p.enquiries, p.visitors)}</td></tr>)}</tbody>
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

      <section style={{ marginBottom: 32 }}>
        <h2>Visitor Countries</h2>
        <div className="tbl"><table>
          <thead><tr><th>Country</th><th>Page Views</th><th>Visitors</th><th>Pages per Visitor</th><th>% of Total</th></tr></thead>
          <tbody>
            {countryRows.length > 0 ? countryRows.map(({ country, views: cViews, visitors: cVisitors }) => (
              <tr key={country}>
                <td>{countryName(country)}</td>
                <td>{cViews.toLocaleString()}</td>
                <td>{cVisitors.toLocaleString()}</td>
                <td>{cVisitors > 0 ? (cViews / cVisitors).toFixed(1) : 0}</td>
                <td>{((cViews / (views || 1)) * 100).toFixed(1)}%</td>
              </tr>
            )) : <tr><td colSpan={5} className="meta">No visitor country data yet.</td></tr>}
          </tbody>
        </table></div>
      </section>

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
