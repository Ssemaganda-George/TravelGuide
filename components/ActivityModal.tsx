"use client";

import { useState } from "react";
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

  const images = activity.media?.filter(m => m && m.url) ?? [];
  const providers = activity.providers?.filter(p => p) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    fd.append("placeId", placeId);
    fd.append("source_page", typeof window !== "undefined" ? window.location.href : "");
    fd.append("source_channel", "activity_modal");
    await action(fd);
    if (state?.ok) setSent(true);
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
      padding: "24px",
    }}>
      <div className="map-stay-modal" onClick={(e) => e.stopPropagation()} style={{
        width: "100%",
        maxWidth: 560,
        maxHeight: "92vh",
        background: "white",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--ink)" }}>{activity.name}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "2rem",
              cursor: "pointer",
              color: "var(--muted)",
              lineHeight: 1,
              padding: "4px 8px",
            }}
            aria-label="Close activity details"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "20px" }}>
          {images.length && (
            <div style={{ width: "100%", height: 220, borderRadius: 12, overflow: "hidden", background: "var(--mist)", marginBottom: 16, position: "relative" }}>
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
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
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
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
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
                    background: "rgba(0,0,0,0.5)",
                    color: "white",
                    padding: "2px 8px",
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
            <p style={{ margin: "0 0 16px 0", color: "var(--ink)", lineHeight: 1.6, fontSize: "0.95rem" }}>
              {activity.description}
            </p>
          )}

          <div className="activity-meta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            {costText && (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "var(--mist)",
                color: "var(--lake)",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}>
                <span style={{ fontSize: "1rem" }}>💰</span> {costText}
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
                fontSize: "0.85rem",
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
                          <a href={`https://wa.me/${p.contact.replace(/\D/g, "")}?text=Hi, I&rsquo;d like to inquire about ${encodeURIComponent(activity.name)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Phone size={14} strokeWidth={2} /> WhatsApp
                          </a>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}?subject=Inquiry about ${encodeURIComponent(activity.name)}`} style={{ color: "#EA4335", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Mail size={14} strokeWidth={2} /> Email
                          </a>
                        )}
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: "#333", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Globe size={14} strokeWidth={2} /> Website
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
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                background: "var(--lake)",
                color: "white",
                borderRadius: 8,
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: pending ? "not-allowed" : "pointer",
                border: "none",
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
