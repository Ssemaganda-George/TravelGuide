"use client";

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
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M23.47 6.12c-1.73-3.79-5.52-5.62-9.36-5.62-5.15 0-9.32 4.08-9.32 9.12 0 .69.12 1.35.27 1.99L2 23l4.11-.56c.57.14 1.16.24 1.78.24 5.15 0 9.32-4.08 9.32-9.12 0-3.96-2.73-7.38-6.63-8.29zM8.79 18c-1.95 0-3.53-1.42-3.53-3.28 0-1.69 1.15-3.07 2.94-3.42 1.36-.28 2.72-.39 4.03-.23 1.25.14 2.27 1.23 2.27 2.43 0 1.87-1.58 3.26-3.53 3.28zM12.5 14c1.22 0 2.22-.95 2.22-2.19 0-.99-.7-1.78-1.58-1.98-.17-.04-.33-.08-.49-.08-.89 0-1.62.67-1.62 1.58 0 .99.81 1.79 1.58 2.04q.325.045.74-.05z"/>
      </svg>
    </a>
  );
}
