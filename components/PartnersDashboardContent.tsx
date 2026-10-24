"use client";

import { useState } from "react";
import { DateFilter } from "@/components/DateFilter";
import { BillingModal } from "@/components/BillingModal";
import { addPartnerAction, togglePartnerAction, updatePartnerBillingAction } from "@/app/actions/partners";

interface Partner {
  id: string;
  name: string;
  type: string;
  contact: string;
  email: string | null;
  website: string | null;
  commission_rate: number | null;
  commission_flat: number | null;
  currency: string;
  agreement_status: string;
  payment_terms: string | null;
  notes: string | null;
  active: boolean;
  place_ids: string[];
  subscription_price: number;
  trial_ends_at: string | null;
  subscription_status: string;
  last_payment_at: string | null;
  payment_method: string | null;
  featured: boolean;
  created_at: string;
}

interface AggregatedMetrics {
  page_views: number;
  inquiry_clicks: number;
  whatsapp_clicks: number;
  email_clicks: number;
  countries: Map<string, number>;
  daily: Map<string, { page_views: number; inquiry_clicks: number; whatsapp_clicks: number; email_clicks: number }>;
}

interface PartnersDashboardProps {
  preset: string;
  start: string;
  end: string;
  partners: Partner[];
  aggregated: Map<string, AggregatedMetrics>;
  totalPageViews: number;
  totalInquiries: number;
  totalWhatsApp: number;
  totalEmails: number;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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

export function PartnersDashboardContent({
  preset,
  start,
  end,
  partners,
  aggregated,
  totalPageViews,
  totalInquiries,
  totalWhatsApp,
  totalEmails,
}: PartnersDashboardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handleBillingClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setModalOpen(true);
  };

  const handleBillingSubmit = async (formData: FormData) => {
    await updatePartnerBillingAction(formData);
    setModalOpen(false);
    setSelectedPartner(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPartner(null);
  };

  const handleTogglePartner = async (id: string, active: boolean) => {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("active", String(active));
    await togglePartnerAction(fd);
    window.location.reload();
  };

  const handleAddPartner = async (formData: FormData) => {
    await addPartnerAction(formData);
    window.location.reload();
  };

  const activePartners = partners?.filter(p => p.subscription_status === "active").length ?? 0;
  const trialPartners = partners?.filter(p => p.subscription_status === "trial").length ?? 0;

  const presetOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "Last 30 days" },
    { value: "quarter", label: "Last 90 days" },
    { value: "year", label: "Last 365 days" },
  ];

  return (
    <div className="wrap page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <h1>Partner Dashboard</h1>
        <DateFilter preset={preset} start={start} end={end} />
      </div>

      <p className="hook" style={{ marginBottom: 24 }}>
        Showing data from <strong>{formatDate(start)}</strong> to <strong>{formatDate(end)}</strong>
      </p>

      {/* Platform Overview Stats */}
      <div className="cardstats" style={{ marginBottom: 24 }}>
        <div className="stat"><strong>{totalPageViews.toLocaleString()}</strong> Page Views</div>
        <div className="stat"><strong>{totalInquiries.toLocaleString()}</strong> Inquiries</div>
        <div className="stat"><strong>{totalWhatsApp.toLocaleString()}</strong> WhatsApp Clicks</div>
        <div className="stat"><strong>{totalEmails.toLocaleString()}</strong> Email Clicks</div>
        <div className="stat"><strong>{activePartners}</strong> Active Partners</div>
        <div className="stat"><strong>{trialPartners}</strong> On Trial</div>
      </div>

      {/* Country Breakdown */}
      <section style={{ marginBottom: 32 }}>
        <h2>Visitor Countries</h2>
        <div className="tbl"><table>
          <thead><tr><th>Country</th><th>Visits</th><th>% of Total</th></tr></thead>
          <tbody>
            {(() => {
              const countryTotals = new Map<string, number>();
              for (const a of aggregated.values()) {
                for (const [country, count] of a.countries) {
                  countryTotals.set(country, (countryTotals.get(country) ?? 0) + count);
                }
              }
              return Array.from(countryTotals.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => (
                  <tr key={country}>
                    <td>{country}</td>
                    <td>{count.toLocaleString()}</td>
                    <td>{((count / (totalPageViews || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                ));
            })()}
          </tbody>
        </table></div>
      </section>

      {/* Partner Performance Table */}
      <section style={{ marginBottom: 32 }}>
        <h2>Partner Performance</h2>
        <div className="tbl"><table>
          <thead>
            <tr>
              <th>Partner</th>
              <th>Type</th>
              <th>Page Views</th>
              <th>Inquiries</th>
              <th>WhatsApp</th>
              <th>Emails</th>
              <th>Status</th>
              <th>Subscription</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(partners ?? []).map(p => {
              const a = aggregated.get(p.id) ?? { 
                page_views: 0, inquiry_clicks: 0, whatsapp_clicks: 0, email_clicks: 0, 
                countries: new Map(), daily: new Map() 
              };
              const trialStatus = getTrialStatus(p.trial_ends_at, p.subscription_status);
              return (
                <tr key={p.id} className={p.active ? "" : "off"}>
                  <td>
                    <strong>{p.name}</strong>
                    <br /><span className="meta">{p.type}</span>
                  </td>
                  <td>{p.type}</td>
                  <td>{a.page_views.toLocaleString()}</td>
                  <td>{a.inquiry_clicks.toLocaleString()}</td>
                  <td>{a.whatsapp_clicks.toLocaleString()}</td>
                  <td>{a.email_clicks.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${p.active ? "badge-active" : "badge-off"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className={`badge ${trialStatus.class}`}>{trialStatus.label}</span>
                      {p.subscription_price > 0 && (
                        <span className="meta" style={{ fontSize: "0.75rem" }}>
                          ${p.subscription_price}/month
                        </span>
                      )}
                      {p.trial_ends_at && (
                        <span className="meta" style={{ fontSize: "0.75rem" }}>
                          Trial ends: {formatDate(p.trial_ends_at)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <form onSubmit={(e) => { e.preventDefault(); updatePartnerBillingAction(new FormData(e.currentTarget)); }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="subscription_status" value={p.subscription_status} />
                      <input type="hidden" name="subscription_price" value={p.subscription_price} />
                      <input type="hidden" name="trial_ends_at" value={p.trial_ends_at ?? ""} />
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          name="featured"
                          checked={p.featured}
                          onChange={(e) => e.currentTarget.form?.requestSubmit?.()}
                        />
                        <span className="meta" style={{ fontSize: "0.85rem" }}>Featured</span>
                      </label>
                    </form>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="chip" onClick={() => handleTogglePartner(p.id, !p.active)}>
                        {p.active ? "Deactivate" : "Activate"}
                      </button>
                      <button 
                        className={`go ${p.subscription_status === "active" ? "" : "outline"}`}
                        onClick={() => handleBillingClick(p)}
                      >
                        {p.subscription_status === "active" ? "Manage Billing" : "Upgrade / Renew"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </section>

      {/* Daily Trend (for all partners combined) */}
      <section style={{ marginBottom: 32 }}>
        <h2>Daily Trend (All Partners)</h2>
        <div className="tbl"><table>
          <thead><tr><th>Date</th><th>Page Views</th><th>Inquiries</th><th>WhatsApp</th><th>Emails</th></tr></thead>
          <tbody>
            {(() => {
              const dailyTotals = new Map<string, { page_views: number; inquiry_clicks: number; whatsapp_clicks: number; email_clicks: number }>();
              for (const a of aggregated.values()) {
                for (const [date, dayData] of a.daily) {
                  const existing = dailyTotals.get(date) ?? { page_views: 0, inquiry_clicks: 0, whatsapp_clicks: 0, email_clicks: 0 };
                  existing.page_views += dayData.page_views;
                  existing.inquiry_clicks += dayData.inquiry_clicks;
                  existing.whatsapp_clicks += dayData.whatsapp_clicks;
                  existing.email_clicks += dayData.email_clicks;
                  dailyTotals.set(date, existing);
                }
              }
              return Array.from(dailyTotals.entries())
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([date, data]) => (
                  <tr key={date}>
                    <td>{formatDate(date)}</td>
                    <td>{data.page_views.toLocaleString()}</td>
                    <td>{data.inquiry_clicks.toLocaleString()}</td>
                    <td>{data.whatsapp_clicks.toLocaleString()}</td>
                    <td>{data.email_clicks.toLocaleString()}</td>
                  </tr>
                ));
            })()}
          </tbody>
        </table></div>
      </section>

      {/* Billing Modal */}
      {selectedPartner && (
        <BillingModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSubmit={handleBillingSubmit}
          initialData={{
            id: selectedPartner.id,
            subscription_status: selectedPartner.subscription_status,
            subscription_price: selectedPartner.subscription_price,
            trial_ends_at: selectedPartner.trial_ends_at,
            featured: selectedPartner.featured,
          }}
        />
      )}

      <form onSubmit={(e) => { e.preventDefault(); addPartnerAction(new FormData(e.currentTarget)); }} className="form">
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
          <div><label htmlFor="sub-price">Subscription Price (USD/month)</label><input id="sub-price" name="sub_price" type="number" step="0.01" min="0" placeholder="0.00" /></div>
          <div><label htmlFor="trial-ends">Trial Ends At</label><input id="trial-ends" name="trial_ends_at" type="date" /></div>
        </div>
        <label htmlFor="po">Notes</label><textarea id="po" name="notes" rows={2} />
        <button className="go" type="submit">Add partner</button>
      </form>
    </div>
  );
}