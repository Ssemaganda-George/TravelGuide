import type { Metadata } from "next";
import { admin } from "@/lib/admin";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PartnersDashboardContent } from "@/components/PartnersDashboardContent";

export const metadata: Metadata = { title: "Partner Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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

function getTrialStatus(trialEndsAt: string | null, status: string) {
  if (status === "active") return { label: "Active Partner", class: "badge-active" };
  if (status === "expired") return { label: "Expired", class: "badge-expired" };
  if (status === "cancelled") return { label: "Cancelled", class: "badge-cancelled" };
  if (!trialEndsAt) return { label: "No trial set", class: "badge-trial" };
  const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { label: "Trial expired", class: "badge-expired" };
  return { label: `${daysLeft} days left of trial`, class: "badge-trial" };
}

export default async function Partners({ searchParams }: { searchParams: Promise<{ preset?: string; start?: string; end?: string }> }) {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;
  
  const params = await searchParams;
  const preset = params.preset ?? "month";
  const customStart = params.start;
  const customEnd = params.end;
  
  const { start, end } = customStart && customEnd 
    ? { start: customStart, end: customEnd }
    : getPresetRange(preset);
  
  const { data: partners } = await sb.from("partners").select("*").order("name");
  
  // Fetch metrics for date range
  const { data: metrics } = await sb
    .from("partner_metrics")
    .select("partner_id, date, page_views, inquiry_clicks, whatsapp_clicks, email_clicks, country")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });
    
  // Aggregate metrics per partner
  const aggregated = new Map<string, {
    page_views: number;
    inquiry_clicks: number;
    whatsapp_clicks: number;
    email_clicks: number;
    countries: Map<string, number>;
    daily: Map<string, { page_views: number; inquiry_clicks: number; whatsapp_clicks: number; email_clicks: number }>;
  }>();
  
  for (const m of metrics ?? []) {
    const existing = aggregated.get(m.partner_id) ?? {
      page_views: 0, inquiry_clicks: 0, whatsapp_clicks: 0, email_clicks: 0,
      countries: new Map(), daily: new Map()
    };
    existing.page_views += m.page_views ?? 0;
    existing.inquiry_clicks += m.inquiry_clicks ?? 0;
    existing.whatsapp_clicks += m.whatsapp_clicks ?? 0;
    existing.email_clicks += m.email_clicks ?? 0;
    if (m.country) {
      existing.countries.set(m.country, (existing.countries.get(m.country) ?? 0) + 1);
    }
    const dayKey = m.date;
    const dayExisting = existing.daily.get(dayKey) ?? { page_views: 0, inquiry_clicks: 0, whatsapp_clicks: 0, email_clicks: 0 };
    dayExisting.page_views += m.page_views ?? 0;
    dayExisting.inquiry_clicks += m.inquiry_clicks ?? 0;
    dayExisting.whatsapp_clicks += m.whatsapp_clicks ?? 0;
    dayExisting.email_clicks += m.email_clicks ?? 0;
    existing.daily.set(dayKey, dayExisting);
    aggregated.set(m.partner_id, existing);
  }
  
  // Calculate totals
  const totalPageViews = Array.from(aggregated.values()).reduce((sum, a) => sum + a.page_views, 0);
  const totalInquiries = Array.from(aggregated.values()).reduce((sum, a) => sum + a.inquiry_clicks, 0);
  const totalWhatsApp = Array.from(aggregated.values()).reduce((sum, a) => sum + a.whatsapp_clicks, 0);
  const totalEmails = Array.from(aggregated.values()).reduce((sum, a) => sum + a.email_clicks, 0);

  return (
    <PartnersDashboardContent
      preset={preset}
      start={start}
      end={end}
      partners={partners ?? []}
      aggregated={aggregated}
      totalPageViews={totalPageViews}
      totalInquiries={totalInquiries}
      totalWhatsApp={totalWhatsApp}
      totalEmails={totalEmails}
    />
  );
}