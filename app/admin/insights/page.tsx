import type { Metadata } from "next";
import { admin } from "@/lib/admin";
import { countryDisplayName } from "@/lib/geo";
import { getSearchConsoleStats } from "@/lib/gsc";
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

const gscPageLabel = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname || "/";
  } catch {
    return url;
  }
};

const fmtCtr = (ctr: number) => `${(ctr * 100).toFixed(1)}%`;
const fmtPos = (position: number) => (position > 0 ? position.toFixed(1) : "—");

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
  const [{ data: pg }, { data: src }, { data: enq }, gsc] = await Promise.all([
    sb.rpc("page_stats", { p_days: pDays }),
    sb.rpc("source_stats", { p_days: pDays }),
    sb.from("enquiries").select("created_at,status").limit(5000),
    getSearchConsoleStats({ start, end }),
  ]);
  const pages = (pg ?? []) as Page[], sources = (src ?? []) as Source[], rows = enq ?? [];

  // Exclude admin-touched paths from page stats (case-insensitive)
  const nonAdminPages = pages.filter(p => !p.path.toLowerCase().includes("/admin"));

  // Fetch page_views — only rows with a real country (unknowns are purged and no longer recorded)
  const isKnownCountry = (code: string | null | undefined) => {
    const c = (code ?? "").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1";
  };
  let pageViews: { path: string; created_at: string; visitor: string; country?: string | null }[] = [];
  try {
    const { data } = await sb.from("page_views").select("path,created_at,visitor,country").gte("created_at", start).lte("created_at", endInclusive);
    pageViews = (data ?? []).filter(v => !v.path.toLowerCase().includes("/admin") && isKnownCountry(v.country));
  } catch {
    pageViews = [];
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

  // Visitor countries — only real ISO codes (no Unknown / null / XX)
  const countryTotals = new Map<string, { views: number; visitors: Set<string> }>();
  for (const v of pageViews) {
    const c = (v.country ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(c) || c === "XX" || c === "T1") continue;
    const existing = countryTotals.get(c) ?? { views: 0, visitors: new Set() };
    existing.views += 1;
    existing.visitors.add(v.visitor);
    countryTotals.set(c, existing);
  }
  const countryRows = Array.from(countryTotals.entries())
    .sort((a, b) => b[1].views - a[1].views)
    .map(([country, v]) => ({ country, views: v.views, visitors: v.visitors.size }));
  const knownViews = countryRows.reduce((s, r) => s + r.views, 0);

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

      <Card><CardHeader><CardTitle>Visitor countries</CardTitle><CardDescription>On-site page views by country (CDN geo, with IP lookup fallback). Localhost is not counted.</CardDescription></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Page views</TableHead><TableHead>Visitors</TableHead><TableHead>Pages per visitor</TableHead><TableHead>% of total</TableHead></TableRow></TableHeader>
          <TableBody>
            {countryRows.length > 0 ? countryRows.map(({ country, views: cViews, visitors: cVisitors }) => (
              <TableRow key={country}>
                <TableCell className="font-medium">{countryDisplayName(country)}</TableCell>
                <TableCell>{cViews.toLocaleString()}</TableCell>
                <TableCell>{cVisitors.toLocaleString()}</TableCell>
                <TableCell>{cVisitors > 0 ? (cViews / cVisitors).toFixed(1) : 0}</TableCell>
                <TableCell>{((cViews / (knownViews || 1)) * 100).toFixed(1)}%</TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={5} className="text-muted-foreground">No visitor country data yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Console</CardTitle>
          <CardDescription>
            Google Search clicks and impressions for this date range (data often lags ~2 days)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!gsc.configured ? (
            <p className="text-sm text-muted-foreground">
              Search Console not connected. Add <code className="text-xs">GSC_CLIENT_EMAIL</code>,{" "}
              <code className="text-xs">GSC_PRIVATE_KEY</code>, and <code className="text-xs">GSC_SITE_URL</code> to the server env, then grant that service account access in Search Console.
            </p>
          ) : gsc.error ? (
            <p className="text-sm text-muted-foreground">Could not load Search Console: {gsc.error}</p>
          ) : (
            <>
              <section aria-label="Search Console totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Clicks</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{(gsc.totals?.clicks ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Impressions</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{(gsc.totals?.impressions ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Click rate</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{fmtCtr(gsc.totals?.ctr ?? 0)}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Average Google rank</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{fmtPos(gsc.totals?.position ?? 0)}</p>
                </div>
              </section>

              <div className="space-y-8">
                <section className="min-w-0">
                  <h3 className="mb-2 text-sm font-semibold">Top pages</h3>
                  {(gsc.pages?.length ?? 0) > 0 ? (
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Page</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Times shown</TableHead>
                          <TableHead>Click rate</TableHead>
                          <TableHead>Avg. rank</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gsc.pages!.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell className="max-w-96 whitespace-normal break-all font-medium" title={row.key}>{gscPageLabel(row.key)}</TableCell>
                            <TableCell>{row.clicks}</TableCell>
                            <TableCell>{row.impressions}</TableCell>
                            <TableCell>{fmtCtr(row.ctr)}</TableCell>
                            <TableCell>{fmtPos(row.position)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No page impressions in this range.</p>
                  )}
                </section>

                <section className="min-w-0 border-t pt-6">
                  <h3 className="mb-2 text-sm font-semibold">Search countries</h3>
                  {(gsc.countries?.length ?? 0) > 0 ? (
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Times shown</TableHead>
                          <TableHead>Click rate</TableHead>
                          <TableHead>Avg. rank</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gsc.countries!.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell className="font-medium">{countryDisplayName(row.key)}</TableCell>
                            <TableCell>{row.clicks}</TableCell>
                            <TableCell>{row.impressions}</TableCell>
                            <TableCell>{fmtCtr(row.ctr)}</TableCell>
                            <TableCell>{fmtPos(row.position)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No country breakdown yet.</p>
                  )}
                </section>
              </div>

              <section className="min-w-0 border-t pt-6">
                <h3 className="mb-2 text-sm font-semibold">Top queries</h3>
                {(gsc.queries?.length ?? 0) > 0 ? (
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Search term</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Times shown</TableHead>
                        <TableHead>Click rate</TableHead>
                        <TableHead>Avg. rank</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gsc.queries!.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">{row.key}</TableCell>
                          <TableCell>{row.clicks}</TableCell>
                          <TableCell>{row.impressions}</TableCell>
                          <TableCell>{fmtCtr(row.ctr)}</TableCell>
                          <TableCell>{fmtPos(row.position)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No queries disclosed yet (common at low volume).</p>
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>Enquiries</CardTitle><CardDescription>{rows.length} total · {booked} booked ({pct(booked, rows.length)})</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">{top(rows, "status").map(([k, v]) => <Badge variant="secondary" key={k}>{k}: {v}</Badge>)}</div>
        <div><h3 className="text-sm font-semibold">Why enquiries were lost</h3>
          {lost.length ? <Table><TableBody>{lost.map(([k, v]) => <TableRow key={k}><TableCell>{k}</TableCell><TableCell className="text-right">{v}</TableCell></TableRow>)}</TableBody></Table> : <p className="mt-2 text-sm text-muted-foreground">No lost enquiries recorded.</p>}
        </div>
      </CardContent></Card>

      <p className="text-sm leading-6 text-muted-foreground">
        On-site visitors are counted per day from your database. Search Console shows Google Search performance only and usually lags a couple of days behind.
      </p>
    </div>
  );
}
