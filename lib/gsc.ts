import { google } from "googleapis";

export type GscRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscStats =
  | { configured: false }
  | {
      configured: true;
      error?: string;
      siteUrl?: string;
      start?: string;
      end?: string;
      totals?: { clicks: number; impressions: number; ctr: number; position: number };
      pages?: GscRow[];
      countries?: GscRow[];
      queries?: GscRow[];
    };

function gscConfig() {
  const clientEmail = process.env.GSC_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const siteUrl = (process.env.GSC_SITE_URL ?? "https://trip-insights.com/").trim();
  if (!clientEmail || !privateKey) return null;
  return { clientEmail, privateKey, siteUrl };
}

function mapRows(rows: { keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null }[] | undefined, limit = 10): GscRow[] {
  return (rows ?? [])
    .map((r) => ({
      key: String(r.keys?.[0] ?? ""),
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }))
    .filter((r) => r.key)
    .slice(0, limit);
}

export async function getSearchConsoleStats(range: { start: string; end: string }): Promise<GscStats> {
  const cfg = gscConfig();
  if (!cfg) return { configured: false };

  try {
    const auth = new google.auth.JWT({
      email: cfg.clientEmail,
      key: cfg.privateKey,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const searchconsole = google.searchconsole({ version: "v1", auth });

    const base = {
      siteUrl: cfg.siteUrl,
      requestBody: {
        startDate: range.start,
        endDate: range.end,
        rowLimit: 10,
      },
    };

    const [totalsRes, pagesRes, countriesRes, queriesRes] = await Promise.all([
      searchconsole.searchanalytics.query({
        siteUrl: cfg.siteUrl,
        requestBody: { startDate: range.start, endDate: range.end },
      }),
      searchconsole.searchanalytics.query({
        ...base,
        requestBody: { ...base.requestBody, dimensions: ["page"] },
      }),
      searchconsole.searchanalytics.query({
        ...base,
        requestBody: { ...base.requestBody, dimensions: ["country"] },
      }),
      searchconsole.searchanalytics.query({
        ...base,
        requestBody: { ...base.requestBody, dimensions: ["query"] },
      }),
    ]);

    const totalsRow = totalsRes.data.rows?.[0];
    return {
      configured: true,
      siteUrl: cfg.siteUrl,
      start: range.start,
      end: range.end,
      totals: {
        clicks: totalsRow?.clicks ?? 0,
        impressions: totalsRow?.impressions ?? 0,
        ctr: totalsRow?.ctr ?? 0,
        position: totalsRow?.position ?? 0,
      },
      pages: mapRows(pagesRes.data.rows),
      countries: mapRows(countriesRes.data.rows),
      queries: mapRows(queriesRes.data.rows),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search Console request failed";
    return { configured: true, error: message, siteUrl: cfg.siteUrl, start: range.start, end: range.end };
  }
}
