"use client";

import { Phone } from "lucide-react";
import { trackEvent, currentChannel, isInternalDevice } from "@/lib/track";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsAppButton() {
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP;
  if (!phoneNumber) return null;
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) return null;

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const channel = currentChannel();
  const internal = isInternalDevice();
  const url = whatsappUrl({ title: document.title, path: pathname });
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
      onClick={() => trackEvent({ type: "whatsapp_click", label: "whatsapp_float", path: pathname, channel, internal })}
    >
      <Phone size={18} color="white" />
      <span className="whatsapp-label">WhatsApp</span>
    </a>
  );
}
