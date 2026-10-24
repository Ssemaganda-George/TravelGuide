"use server";

import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function t(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim() || null;
}

function num(fd: FormData, k: string) {
  const v = parseFloat(String(fd.get(k)));
  return isNaN(v) ? null : v;
}

export async function addPartnerAction(fd: FormData) {
  const sb = await authClient();
  await sb.from("partners").insert({
    name: t(fd, "name")!, type: String(fd.get("type")), contact: t(fd, "contact"),
    email: t(fd, "email"), website: t(fd, "website"),
    commission_rate: num(fd, "rate"), commission_flat: num(fd, "flat"),
    agreement_status: String(fd.get("agreement")), payment_terms: t(fd, "terms"), notes: t(fd, "notes"),
    subscription_price: num(fd, "sub_price"),
    trial_ends_at: t(fd, "trial_ends_at"),
  });
  revalidatePath("/admin/partners");
}

export async function togglePartnerAction(fd: FormData) {
  const sb = await authClient();
  await sb.from("partners").update({ active: fd.get("active") === "true" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/partners");
}

export async function updatePartnerBillingAction(fd: FormData) {
  const sb = await authClient();
  const id = String(fd.get("id"));
  const subscription_status = String(fd.get("subscription_status"));
  const subscription_price = parseFloat(String(fd.get("subscription_price") ?? "0")) || 0;
  const trial_ends_at = String(fd.get("trial_ends_at") ?? "") || null;
  const featured = fd.get("featured") === "true";
  
  const updateData: Record<string, unknown> = { subscription_status, subscription_price, featured };
  if (trial_ends_at) updateData.trial_ends_at = trial_ends_at;
  if (subscription_status === "active") updateData.last_payment_at = new Date().toISOString();
  
  await sb.from("partners").update(updateData).eq("id", id);
  revalidatePath("/admin/partners");
}

export async function bypassPaymentAction(fd: FormData) {
  const sb = await authClient();
  const id = String(fd.get("id"));
  const days = parseInt(String(fd.get("bypass_days") ?? "30")) || 30;
  const activate = fd.get("bypass_activate") === "true";
  
  const trial_ends_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  
  await sb.from("partners").update({
    subscription_status: activate ? "active" : "trial",
    trial_ends_at,
    last_payment_at: activate ? new Date().toISOString() : null,
    payment_method: activate ? "demo_bypass" : null,
  }).eq("id", id);
  
  revalidatePath("/admin/partners");
}

export async function incrementPartnerMetricAction(fd: FormData) {
  const sb = await authClient();
  const partner_id = String(fd.get("partner_id"));
  const metric = String(fd.get("metric")); // 'page_views' | 'inquiry_clicks' | 'whatsapp_clicks' | 'email_clicks'
  const country = String(fd.get("country") ?? "unknown");
  
  await sb.rpc("increment_partner_metric", { 
    p_partner_id: partner_id, 
    p_metric: metric,
    p_country: country
  });
  
  revalidatePath("/admin/partners");
}

export async function submitInquiryAction(fd: FormData) {
  const sb = await authClient();
  
  // Get partner info to get their contact email
  const partnerId = String(fd.get("partner_id"));
  const { data: partner } = await sb
    .from("partners")
    .select("id, name, email, contact")
    .eq("id", partnerId)
    .single();
  
  // Insert the inquiry
  await sb.from("enquiries").insert({
    name: String(fd.get("name")),
    contact: String(fd.get("contact")),
    message: String(fd.get("message")),
    travel_dates: String(fd.get("travel_dates")) || null,
    group_size: parseInt(String(fd.get("group_size"))) || null,
    budget: String(fd.get("budget")) || null,
    interests: [],
    source_page: String(fd.get("source_page")),
    source_channel: String(fd.get("source_channel")),
    status: "new",
    place_id: null, // Could link to a place if needed
  });
  
  // Also create a referral record linking to the partner
  // (This will be used for commission tracking)
  const { data: enquiry } = await sb
    .from("enquiries")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  if (enquiry) {
    await sb.from("referrals").insert({
      enquiry_id: enquiry.id,
      partner_id: partnerId,
      commission_due: 0,
      commission_status: "pending",
      currency: "USD",
    });
  }
  
  revalidatePath("/admin/partners");
}