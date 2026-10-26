"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { submitEnquiry, type FormState } from "@/app/actions";
import { useActionState } from "react";
import { Map, Phone, Mail, Globe } from "lucide-react";

interface ActivityModalProps {
  open: boolean;
  onClose: () => void;
  activity: {
    id: string;
    name: string;
    description?: string | null;
    cost_low?: number | null;
    cost_high?: number | null;
    currency?: string | null;
    duration?: string | null;
    media?: Array<{ url: string; caption?: string | null; type?: string }> | null;
    providers?: Array<{ id: string; name: string; contact?: string | null; email?: string | null; website?: string | null }> | null;
  };
  placeId: string;
  destinationTitle: string;
  country: string;
}

export default function ActivityModal({ open, onClose, activity, placeId, destinationTitle, country }: ActivityModalProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, null);
  const [sent, setSent] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const images = activity.media?.filter(m => m && m.url) ?? [];
  const providers = activity.providers?.filter(p => p) ?? [];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    fd.append("placeId", placeId);
    fd.append("source_page", typeof window !== "undefined" ? window.location.href : "");
    fd.append("source_channel", "activity_modal");
    await action(fd);
    if (state?.ok) setSent(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.x - touchEnd;
    const diffY = Math.abs(touchStart.y - e.changedTouches[0].clientY);

    // Only trigger swipe if horizontal movement is significant and vertical is minimal
    if (Math.abs(diff) > 40 && Math.abs(diffY) < 100) {
      if (diff > 0) {
        // Swipe left -> next image
        setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
      } else {
        // Swipe right -> previous image
        setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
      }
    }
    setTouchStart(null);
  };

  if (!open) return null;

  const costText = activity.cost_low != null && activity.cost_high != null
    ? `${activity.currency ?? ""}${activity.cost_low} &ndash; ${activity.cost_high}`
    : activity.cost_low != null
      ? `from ${activity.currency ?? ""}${activity.cost_low}`
      : activity.cost_high != null
        ? `up to ${activity.currency ?? ""}${activity.cost_high}`
        : null;

  return (
    <div className="map-stay-modal-overlay" onClick={onClose} style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      touchAction: "pan-y",
    }}>
      <div className="map-stay-modal" onClick={(e) => e.stopPropagation()} style={{
        width: isMobile ? "100%" : "92vw",
        maxWidth: isMobile ? "100%" : 560,
        maxHeight: isMobile ? "95vh" : "92vh",
        background: "white",
        borderRadius: isMobile ? 0 : 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        margin: isMobile ? 0 : "16px",
      }}>
        <div style={{
          padding: isMobile ? "14px 16px" : "16px 20px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--ink)" }}>{activity.name}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "2rem",
              cursor: "pointer",
              color: "var(--muted)",
              lineHeight: 1,
              padding: "8px",
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close activity details"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: isMobile ? "12px 16px" : "20px" }}>
          {images.length && (
            <div style={{ width: "100%", height: isMobile ? 180 : 220, borderRadius: isMobile ? 8 : 12, overflow: "hidden", background: "var(--mist)", marginBottom: isMobile ? 12 : 16, position: "relative", touchAction: isMobile ? "pan-x" : "pan-y" }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={images[imageIndex].url}
                alt={activity.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading="lazy"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1)); }}
                    style={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 36,
                      height: 36,
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.55)",
                      color: "white",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "1rem",
                      lineHeight: 1,
                      zIndex: 10,
                      touchAction: "manipulation",
                    }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1)); }}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 36,
                      height: 36,
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.55)",
                      color: "white",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "1rem",
                      lineHeight: 1,
                      zIndex: 10,
                      touchAction: "manipulation",
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                  <div style={{
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    background: "rgba(0,0,0,0.55)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    zIndex: 10,
                  }}>
                    {imageIndex + 1} of {images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {activity.description && (
            <p style={{ margin: "0 0 12px 0", color: "var(--ink)", lineHeight: 1.6, fontSize: "0.95rem" }}>
              {activity.description}
            </p>
          )}

          <div className="activity-meta-row" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {costText && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "var(--mist)",
                color: "var(--lake)",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}>
                <span style={{ fontSize: "0.95rem" }}>💰</span> {costText}
              </span>
            )}
            {activity.duration && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "var(--mist)",
                color: "var(--lake)",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}>
                <Map size={16} strokeWidth={2} /> {activity.duration}
              </span>
            )}
          </div>

          {providers.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "var(--ink)" }}>Service Providers</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {providers.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "var(--mist)", borderRadius: 8, border: "1px solid var(--line)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)" }}>{p.name}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.85rem", color: "var(--muted)" }}>
                        {p.contact && (
                          <a href={`https://wa.me/${p.contact.replace(/\D/g, "")}?text=Hi, I&rsquo;d like to inquire about ${encodeURIComponent(activity.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44 }}>
                            <Phone size={16} strokeWidth={2} /> WhatsApp
                          </a>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}?subject=Inquiry about ${encodeURIComponent(activity.name)}`} style={{ color: "#EA4335", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44 }}>
                            <Mail size={16} strokeWidth={2} /> Email
                          </a>
                        )}
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: "#333", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, minHeight: 44 }}>
                            <Globe size={16} strokeWidth={2} /> Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!providers.length && activity.description && (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: 16 }}>
              No service providers listed for this activity yet.
            </p>
          )}

          <form onSubmit={handleSubmit} className="form" action={action} style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: 8, color: "var(--ink)" }}>
              Get in touch about {activity.name}
            </label>
            <input type="hidden" name="placeId" value={placeId} />
            <input type="hidden" name="name" value="Guest" />
            <input type="hidden" name="contact" value="" />
            <input type="hidden" name="method" value="whatsapp" />
            <input type="hidden" name="dates" value="" />
            <input type="hidden" name="group" value={2} />
            <input type="hidden" name="budget" value="" />
            <input type="hidden" name="interests" value="" />
            <input type="hidden" name="message" value={`Hi, I&rsquo;m interested in the activity "${activity.name}" at ${destinationTitle}. Could you tell me more?`} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button type="submit" className="go" disabled={pending} style={{
                display: "block",
                width: "100%",
                maxWidth: isMobile ? "100%" : 200,
                alignItems: "center",
                gap: 6,
                padding: "14px 20px",
                background: "var(--lake)",
                color: "white",
                borderRadius: 8,
                fontSize: "1rem",
                fontWeight: 600,
                cursor: pending ? "not-allowed" : "pointer",
                border: "none",
                minHeight: 48,
              }}>
                {pending ? "Sending..." : "Enquire"}
              </button>
            </div>
          </form>

          {sent && (
            <div style={{
              background: "var(--mist)",
              borderRadius: 8,
              padding: 12,
              color: "var(--ink)",
              fontSize: "0.9rem",
              marginBottom: 12,
            }}>
              Your enquiry about {activity.name} has been sent. They will contact you soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
