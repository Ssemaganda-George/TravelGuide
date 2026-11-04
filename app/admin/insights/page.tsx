import type { Metadata } from "next";
import { admin } from "@/lib/admin";
import { DateFilter } from "@/components/DateFilter";
import TrendChart from "@/components/TrendChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  // Exclude admin-touched paths from page stats (case-insensitive)
  const nonAdminPages = pages.filter(p => !p.path.toLowerCase().includes("/admin"));

  // Fetch page_views with country column (may not exist if migration 023 not applied yet)
  let pageViews: { path: string; created_at: string; visitor: string; country?: string | null }[] = [];
  try {
    const { data } = await sb.from("page_views").select("path,created_at,visitor,country").gte("created_at", start).lte("created_at", endInclusive);
    pageViews = data?.filter(v => !v.path.toLowerCase().includes("/admin")) ?? [];
  } catch {
    const { data } = await sb.from("page_views").select("path,created_at,visitor").gte("created_at", start).lte("created_at", endInclusive);
    pageViews = data?.filter(v => !v.path.toLowerCase().includes("/admin")) ?? [];
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
    <div className="mx-auto w-full max-w-7xl space-y-8 py-2 text-foreground">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight">Insights</h1><p className="mt-2 text-sm text-muted-foreground">{formatDate(start)} to {formatDate(end)}</p></div>
        <DateFilter preset={preset} start={start} end={end} path="/admin/insights" />
      </div>

      <section aria-label="Visitor activity" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">Page views</p><p className="mt-2 text-3xl font-semibold tabular-nums">{views.toLocaleString()}</p></div>
        <div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">Unique visitors</p><p className="mt-2 text-3xl font-semibold tabular-nums">{visitors.toLocaleString()}</p></div>
        <div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">Pages per visitor</p><p className="mt-2 text-3xl font-semibold tabular-nums">{visitors > 0 ? (views / visitors).toFixed(1) : 0}</p></div>
        <div className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">Enquiries</p><p className="mt-2 text-3xl font-semibold tabular-nums">{recent.length}</p><p className="mt-1 text-xs text-muted-foreground">{pct(recent.length, visitors)} of visitors</p></div>
      </section>

      {trendData.length > 0 && <TrendChart data={trendData} start={start} end={end} />}

      <Card><CardHeader><CardTitle>Pages</CardTitle><CardDescription>Views and enquiries by page</CardDescription></CardHeader><CardContent className="space-y-4">
        {nonAdminPages.length ? <Table><TableHeader><TableRow><TableHead>Page</TableHead><TableHead>Views</TableHead><TableHead>Visitors</TableHead><TableHead>Enquiries</TableHead><TableHead>Enquiry rate</TableHead></TableRow></TableHeader>
          <TableBody>{nonAdminPages.map(p => <TableRow key={p.path}><TableCell className="max-w-72 truncate font-medium" title={p.path}>{p.path}</TableCell><TableCell>{p.views}</TableCell><TableCell>{p.visitors}</TableCell><TableCell>{p.enquiries}</TableCell><TableCell>{pct(p.enquiries, p.visitors)}</TableCell></TableRow>)}</TableBody>
        </Table> : <p className="text-sm text-muted-foreground">No views recorded yet. They appear once visitors open your pages.</p>}
        <p className="text-sm text-muted-foreground">Pages with many visitors but no enquiries may need a clearer call to action.</p>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Traffic sources</CardTitle><CardDescription>Where visitors come from</CardDescription></CardHeader><CardContent className="space-y-4">
        {sources.length ? <Table><TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Views</TableHead><TableHead>Visitors</TableHead></TableRow></TableHeader>
          <TableBody>{sources.slice(0, 12).map(s => <TableRow key={s.channel}><TableCell>{s.channel}</TableCell><TableCell>{s.views}</TableCell><TableCell>{s.visitors}</TableCell></TableRow>)}</TableBody></Table> : <p className="text-sm text-muted-foreground">No traffic sources yet.</p>}
        <p className="text-sm text-muted-foreground">Add a source parameter to shared links so each channel appears by name.</p>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Visitor countries</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Page views</TableHead><TableHead>Visitors</TableHead><TableHead>Pages per visitor</TableHead><TableHead>% of total</TableHead></TableRow></TableHeader>
          <TableBody>
            {countryRows.length > 0 ? countryRows.map(({ country, views: cViews, visitors: cVisitors }) => (
              <TableRow key={country}>
                <TableCell className="font-medium">{countryName(country)}</TableCell>
                <TableCell>{cViews.toLocaleString()}</TableCell>
                <TableCell>{cVisitors.toLocaleString()}</TableCell>
                <TableCell>{cVisitors > 0 ? (cViews / cVisitors).toFixed(1) : 0}</TableCell>
                <TableCell>{((cViews / (views || 1)) * 100).toFixed(1)}%</TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={5} className="text-muted-foreground">No visitor country data yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Enquiries</CardTitle><CardDescription>{rows.length} total · {booked} booked ({pct(booked, rows.length)})</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">{top(rows, "status").map(([k, v]) => <Badge variant="secondary" key={k}>{k}: {v}</Badge>)}</div>
        <div><h3 className="text-sm font-semibold">Why enquiries were lost</h3>
          {lost.length ? <Table><TableBody>{lost.map(([k, v]) => <TableRow key={k}><TableCell>{k}</TableCell><TableCell className="text-right">{v}</TableCell></TableRow>)}</TableBody></Table> : <p className="mt-2 text-sm text-muted-foreground">No lost enquiries recorded.</p>}
        </div>
      </CardContent></Card>

      <p className="text-sm leading-6 text-muted-foreground">Visitors are counted per day, so someone returning on another day counts again. Search rankings and queries come from Google Search Console.</p>
    </div>
  );
}
