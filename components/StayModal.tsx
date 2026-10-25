"use client";

import { useActionState, useState } from "react";
import { submitEnquiry, type FormState } from "@/app/actions";

interface StayModalProps {
  open: boolean;
  onClose: () => void;
  stay: {
    id: string;
    name: string;
    description?: string | null;
    contact?: string | null;
    email?: string | null;
    website?: string | null;
    media?: string[];
    tier?: string | null;
  };
}

export default function StayModal({ open, onClose, stay }: StayModalProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, null);
  const [sent, setSent] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const images = stay.media?.filter(Boolean) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    fd.append("source_page", typeof window !== "undefined" ? window.location.href : "");
    fd.append("source_channel", "stay_map_card");
    await action(fd);
    if (state?.ok) setSent(true);
  };

  if (!open) return null;

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
        maxWidth: 480,
        maxHeight: "90vh",
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
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--ink)" }}>{stay.name}</h3>
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
            aria-label="Close stay details"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "20px" }}>
          {images.length && (
            <div style={{ width: "100%", height: 200, borderRadius: 12, overflow: "hidden", background: "var(--mist)", marginBottom: 16, position: "relative" }}>
              <img
                src={images[imageIndex]}
                alt={stay.name}
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
          {stay.description && (
            <p style={{ margin: "0 0 16px 0", color: "var(--ink)", lineHeight: 1.6, fontSize: "0.95rem" }}>
              {stay.description}
            </p>
          )}
          {stay.tier && (
            <span style={{
              display: "inline-block",
              padding: "4px 10px",
              background: "var(--mist)",
              color: "var(--lake)",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: 16,
            }}>
              {stay.tier.charAt(0).toUpperCase() + stay.tier.slice(1)}
            </span>
          )}

          <form onSubmit={handleSubmit} className="form" action={action} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: 8, color: "var(--ink)" }}>
              Get in touch with {stay.name}
            </label>
            <input type="hidden" name="placeId" value={stay.id} />
            <input type="hidden" name="name" value="Guest" />
            <input type="hidden" name="contact" value="" />
            <input type="hidden" name="method" value="whatsapp" />
            <input type="hidden" name="dates" value="" />
            <input type="hidden" name="group" value={2} />
            <input type="hidden" name="budget" value="" />
            <input type="hidden" name="interests" value="" />
            <input type="hidden" name="message" value={`Hi, I'm interested in staying at ${stay.name}. Could you tell me more?`} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {stay.contact && (
                <a
                  href={`https://wa.me/${stay.contact.replace(/\D/g, "")}?text=Hello! I'd like to inquire about ${encodeURIComponent(stay.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 16px",
                    background: "#25D366",
                    color: "white",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.466-2.39-1.475-.883-.788-1.48-1.761-1.653-1.997-.173-.236-.173-.273-.355-.372-.18-.099-.36-.099-.54.099-.18.198-.673.812-.828 1.146-.166.35-.347.673-.51 1.002-.164.327-.48.626-.48.78 0 .075 0 .203-.001.3-.003.075-.003.15-.006.224-.032.098-.472.472-1.38 1.478-1.796 1.016-.41.972-.626 2.068-.829 3.27-.18.198-.163.45-.149.701.001.116.2.148.4.148h.5c.149 0 .184-.018.36-.072.235-.09.332-.196.644-.486.18-.18.374-.45.404-.918.018-.314-.004-.594-.212-.872-.324-.354-.67-1.024-.94-1.77-.297-.76-1.135-2.43-2.35-4.47-.827-1.36-1.5-3.07-1.645-3.53-.078-.247-.195-.34-.312-.46-.117-.117-.24-.234-.374-.249-.118-.015-.198-.012-.279 0-.08.015-.302.075-.526.224-.35.234-.756.597-1.168 1.02-.247.248-.38.562-.48.85-.12.288-.216.612-.303.872-.108.31-.234.55-.312.78-.078.198-.163.356-.303.48-.132.12-.24.216-.402.3-.222.083-.402.149-.642.149-.36 0-.555-.06-.756-.21-.399-.3-.843-.852-1.248-1.68-.402-.828-.663-1.734-.78-2.238-.099-.387-.078-.562.057-.738.149-.2.36-.374.738-.582.18-.099.36-.198.54-.279.288-.099.463-.198.612-.285.149-.087.264-.198.42-.297.24-.104.312-.198.45-.36.132-.164.198-.3-.24-.672-.273-.24-.438-.45-.756-.927-.474-.705-1.217-2.037-1.217-3.437 0-1.686.702-3.195 2.13-4.668 1.125-1.188 2.843-2.55 3.789-3.138.089-.058.184-.099.285-.099.083 0 .167-.009.25-.021.224-.033.41-.104.46-.172.048-.067.078-.165.087-.267.01-.099 0-.212-.006-.312-.015-.224-.04-.38-.12-.52-.21-.098-.06-.173-.14-.3-.27-.172-.173-.297-.373-.396-.597-.099-.224-.198-.48-.198-.73 0-.387.447-.73 1.41-1.23.72-.373 1.56-.758 2.208-1.14.48-.288.84-.552 1.09-.862.083-.104.15-.228.22-.372.258-.462.573-.862.885-1.166.35-.35.724-.672 1.05-.93.32-.26.644-.508.97-.768.325-.26.626-.51.912-.777.36-.327.64-.636.86-.9.216-.264.45-.516.67-.788.216-.262.402-.532.572-.813.18-.276.372-.555.55-.832.18-.28..." /></svg>
                  WhatsApp
                </a>
              )}
              {stay.email && (
                <a
                  href={`mailto:${stay.email}?subject=Inquiry about ${encodeURIComponent(stay.name)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 16px",
                    background: "#EA4335",
                    color: "white",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  Email
                </a>
              )}
              {!stay.contact && !stay.email && (
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
                  {pending ? "Sending..." : "Inquire"}
                </button>
              )}
              {stay.website && (
                <a
                  href={stay.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 16px",
                    background: "#333",
                    color: "white",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93c-3.95-.49-7-3.85-7-7.93 0-3.26 2.66-5.92 5.92-5.92s5.92 2.66 5.92 5.92c0 3.16-2.31 5.78-5.37 7.92z"/></svg>
                  Visit Website
                </a>
              )}
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
              Your enquiry has been sent to {stay.name}. They will contact you soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
