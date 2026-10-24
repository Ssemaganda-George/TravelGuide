"use client";

import { useEffect, useState } from "react";
import MediaGallery from "@/components/MediaGallery";
import { incrementPartnerMetricAction, submitInquiryAction } from "@/app/actions/partners";
import type { Media } from "@/lib/data";

interface PartnerCardProps {
  partner: {
    id: string;
    name: string;
    type?: string;
    description?: string | null;
    contact?: string | null;
    email?: string | null;
    website?: string | null;
    media?: { url: string }[] | null;
    tier?: string | null;
  };
  country?: string;
  category: "stay" | "activity" | "provider";
}

// Convert partner media to Media type
function toMedia(media?: { url: string }[] | null): Media[] {
  return (media ?? []).map(m => ({ type: "image" as const, url: m.url }));
}

export function PartnerCard({ partner, country = "UG", category }: PartnerCardProps) {
  const [viewTracked, setViewTracked] = useState(false);
  const [inquireOpen, setInquireOpen] = useState(false);
  const [inquireForm, setInquireForm] = useState({
    name: "",
    contact: "",
    message: "",
    travel_dates: "",
    group_size: "",
    budget: "",
  });
  const [inquireSubmitting, setInquireSubmitting] = useState(false);
  const media = toMedia(partner.media);

  // Track page view on mount
  useEffect(() => {
    if (!viewTracked) {
      const fd = new FormData();
      fd.append("partner_id", partner.id);
      fd.append("metric", "page_views");
      fd.append("country", country);
      incrementPartnerMetricAction(fd);
      setViewTracked(true);
    }
  }, [partner.id, country, viewTracked]);

  const trackClick = (metric: "whatsapp_clicks" | "email_clicks" | "inquiry_clicks") => {
    const fd = new FormData();
    fd.append("partner_id", partner.id);
    fd.append("metric", metric);
    fd.append("country", country);
    incrementPartnerMetricAction(fd);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    if (partner.contact) {
      trackClick("whatsapp_clicks");
    }
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    if (partner.email) {
      trackClick("email_clicks");
    }
  };

  const handleInquireClick = () => {
    trackClick("inquiry_clicks");
    setInquireOpen(true);
  };

  const handleInquireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquireSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("partner_id", partner.id);
      fd.append("name", inquireForm.name);
      fd.append("contact", inquireForm.contact);
      fd.append("message", inquireForm.message);
      fd.append("travel_dates", inquireForm.travel_dates);
      fd.append("group_size", inquireForm.group_size);
      fd.append("budget", inquireForm.budget);
      fd.append("source_page", typeof window !== "undefined" ? window.location.href : "");
      fd.append("source_channel", "partner_card");
      await submitInquiryAction(fd);
      setInquireOpen(false);
      setInquireForm({ name: "", contact: "", message: "", travel_dates: "", group_size: "", budget: "" });
      alert("Your inquiry has been sent to " + partner.name + ". They will contact you soon.");
    } catch (error) {
      console.error("Inquiry failed:", error);
      alert("Failed to send inquiry. Please try again.");
    } finally {
      setInquireSubmitting(false);
    }
  };

  // Convert partner media to Media type
  function toMedia(media?: { url: string }[] | null) {
    return (media ?? []).map(m => ({ type: "image" as const, url: m.url }));
  }

  return (
    <div className="cell" data-partner-id={partner.id}>
      <MediaGallery items={media} />
      <div className="cellbody">
        <h4>{partner.name}</h4>
        {partner.description && <p>{partner.description}</p>}
        
        {/* Contact Buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          {partner.contact && (
            <a 
              href={`https://wa.me/${partner.contact.replace(/\D/g, "")}?text=Hello! I'd like to inquire about ${encodeURIComponent(partner.name)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-whatsapp"
              onClick={handleWhatsAppClick}
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: 6, 
                padding: "8px 12px", 
                background: "#25D366", 
                color: "white", 
                borderRadius: 6, 
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 500
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.466-2.39-1.475-.883-.788-1.48-1.761-1.653-1.997-.173-.236-.173-.273-.355-.372-.18-.099-.36-.099-.54.099-.18.198-.673.812-.828 1.146-.166.35-.347.673-.51 1.002-.164.327-.48.626-.48.78 0 .075 0 .203-.001.3-.003.075-.003.15-.006.224-.032.098-.472.472-1.38 1.478-1.796 1.016-.41.972-.626 2.068-.829 3.27-.18.198-.163.45-.149.701.001.116.2.148.4.148h.5c.149 0 .184-.018.36-.072.235-.09.332-.196.644-.486.18-.18.374-.45.404-.918.018-.314-.004-.594-.212-.872-.324-.354-.67-1.024-.94-1.77-.297-.76-1.135-2.43-2.35-4.47-.827-1.36-1.5-3.07-1.645-3.53-.078-.247-.195-.34-.312-.46-.117-.117-.24-.234-.374-.249-.118-.015-.198-.012-.279 0-.08.015-.302.075-.526.224-.35.234-.756.597-1.168 1.02-.247.248-.38.562-.48.85-.12.288-.216.612-.303.872-.108.31-.234.55-.312.78-.078.198-.163.356-.303.48-.132.12-.24.216-.402.3-.222.083-.402.149-.642.149-.36 0-.555-.06-.756-.21-.399-.3-.843-.852-1.248-1.68-.402-.828-.663-1.734-.78-2.238-.099-.387-.078-.562.057-.738.149-.2.36-.374.738-.582.18-.099.36-.198.54-.279.288-.099.463-.198.612-.285.149-.087.264-.198.42-.297.24-.104.312-.198.45-.36.132-.164.198-.3-.24-.672-.273-.24-.438-.45-.756-.927-.474-.705-1.217-2.037-1.217-3.437 0-1.686.702-3.195 2.13-4.668 1.125-1.188 2.843-2.55 3.789-3.138.089-.058.184-.099.285-.099.083 0 .167-.009.25-.021.224-.033.41-.104.46-.172.048-.067.078-.165.087-.267.01-.099 0-.212-.006-.312-.015-.224-.04-.38-.12-.52-.21-.098-.06-.173-.14-.3-.27-.172-.173-.297-.373-.396-.597-.099-.224-.198-.48-.198-.73 0-.387.447-.73 1.41-1.23.72-.373 1.56-.758 2.208-1.14.48-.288.84-.552 1.09-.862.083-.104.15-.228.22-.372.258-.462.573-.862.885-1.166.35-.35.724-.672 1.05-.93.32-.26.644-.508.97-.768.325-.26.626-.51.912-.777.36-.327.64-.636.86-.9.216-.264.45-.516.67-.788.216-.262.402-.532.572-.813.18-.276.372-.555.55-.832.18-.28.356-.56.516-.82.164-.26.316-.514.45-.76.13-.24.25-.478.35-.71.099-.24.18-.48.26-.72.078-.24.14-.478.2-.718.06-.24.108-.47.16-.71.048-.232.09-.462.13-.692.04-.228.078-.45.12-.67.03-.22.05-.44.06-.66.01-.214 0-.424-.008-.634-.015-.21-.007-.42-.015-.63-.015-.208 0-.415.007-.622.015-.21.007-.415.015-.625.015-.196 0-.39.007-.585.024-.303.024-.594.06-.87.12-.408.09-.75.18-1.08.3-.328.117-.64.234-.944.342-.428.15-.826.285-1.2.396-.45.12-.874.234-1.272.348-.398.117-.762.225-1.134.324-.252.072-.487.141-.72.2-.33.09-.588.18-.84.27-.35.125-.68.24-.99.35-.312.108-.61.204-.89.288-.278.084-.548.165-.81.23-.264.065-.512.12-.75.165-.24.045-.47.08-.69.115-.22.035-.43.055-.63.075-.20.02-.39.03-.57.03-.19 0-.37-.008-.55-.015-.18-.008-.36-.015-.53-.023-.17-.008-.33-.015-.49-.023-.16-.008-.31-.015-.47-.023-.15-.008-.29-.015-.47-.023-.15-.008-.29-.015-.47-.023-.15-.008-.29-.015-.47-.023"/></svg>
              WhatsApp
            </a>
          )}
          {partner.email && (
            <a 
              href={`mailto:${partner.email}?subject=Inquiry about ${encodeURIComponent(partner.name)}`}
              className="btn-email"
              onClick={handleEmailClick}
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: 6, 
                padding: "8px 12px", 
                background: "#EA4335", 
                color: "white", 
                borderRadius: 6, 
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 500
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              Email
            </a>
          )}
          <button 
            className="btn-inquire"
            onClick={handleInquireClick}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6, 
              padding: "8px 12px", 
              background: "var(--lake)", 
              color: "white", 
              borderRadius: 6, 
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            Inquire
          </button>
        </div>

        {partner.website && (
          <a 
            href={partner.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-website"
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6, 
              padding: "8px 12px", 
              background: "#333", 
              color: "white", 
              borderRadius: 6, 
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93c-3.95-.49-7-3.85-7-7.93 0-3.26 2.66-5.92 5.92-5.92s5.92 2.66 5.92 5.92c0 3.16-2.31 5.78-5.37 7.92z"/></svg>
            Visit Website
          </a>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        </div>

        {/* Inquiry Modal */}
        {inquireOpen && (
          <div className="modal" style={{ display: "flex" }} onClick={() => setInquireOpen(false)}>
            <div className="modal-content" style={{ maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
              <h2>Inquire about {partner.name}</h2>
              <form onSubmit={handleInquireSubmit} className="form">
                <div className="row2">
                  <div>
                    <label htmlFor="inq-name">Your Name *</label>
                    <input id="inq-name" name="name" required value={inquireForm.name} onChange={e => setInquireForm({...inquireForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="inq-contact">WhatsApp / Email *</label>
                    <input id="inq-contact" name="contact" required value={inquireForm.contact} onChange={e => setInquireForm({...inquireForm, contact: e.target.value})} placeholder="+256 7XX XXX XXX" />
                  </div>
                </div>
                <div className="row2">
                  <div>
                    <label htmlFor="inq-dates">Travel Dates</label>
                    <input id="inq-dates" name="travel_dates" value={inquireForm.travel_dates} onChange={e => setInquireForm({...inquireForm, travel_dates: e.target.value})} placeholder="e.g. 15-20 Dec 2024" />
                  </div>
                  <div>
                    <label htmlFor="inq-group">Group Size</label>
                    <input id="inq-group" name="group_size" type="number" min="1" value={inquireForm.group_size} onChange={e => setInquireForm({...inquireForm, group_size: e.target.value})} placeholder="2" />
                  </div>
                </div>
                <div>
                  <label htmlFor="inq-budget">Budget Range</label>
                  <input id="inq-budget" name="budget" value={inquireForm.budget} onChange={e => setInquireForm({...inquireForm, budget: e.target.value})} placeholder="e.g. $500-1000 per person" />
                </div>
                <div>
                  <label htmlFor="inq-message">Message *</label>
                  <textarea id="inq-message" name="message" required rows={4} value={inquireForm.message} onChange={e => setInquireForm({...inquireForm, message: e.target.value})} placeholder="Tell us about your trip plans..." />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
                  <button type="button" className="chip" onClick={() => setInquireOpen(false)}>Cancel</button>
                  <button type="submit" className="go" disabled={inquireSubmitting}>
                    {inquireSubmitting ? "Sending..." : "Send Inquiry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}