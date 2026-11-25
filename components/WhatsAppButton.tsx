"use client";

import { Phone } from "lucide-react";
import { trackEvent, currentChannel, isInternalDevice } from "@/lib/track";

export function WhatsAppButton() {
  const phoneNumber = "256759918649";
  const message = "Hello! I'd like to inquire about a destination on Trip Insights.";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  const channel = currentChannel();
  const internal = isInternalDevice();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
      onClick={() => trackEvent({ type: "whatsapp_click", label: "whatsapp_float", path: typeof window !== "undefined" ? window.location.pathname : "", channel, internal })}
    >
      <Phone size={18} color="white" />
    </a>
  );
}
