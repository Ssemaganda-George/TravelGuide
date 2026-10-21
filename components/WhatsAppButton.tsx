"use client";

export function WhatsAppButton() {
  const phoneNumber = "256759918649";
  const message = "Hello! I'd like to inquire about a trip to Uganda.";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
        <path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3.5 8.5 8.5 12 0.5 0.1 0.5 0.2 0.5 0.3l-0.5 2c-0.2 0.8-1.3 0.8-1.7 0-0.3-0.2-5.5-5.3-5.5-5.3-0.8-1.3-1.2-2.8-1.2-4.3 0-4.5 4-8 8.5-8 4.5 0 8.5 3.5 8.5 8 0 1.7-1.3 3.2-3.2 4.3-0.2 0.2-0.3 0.4-0.3 0.7l0.5 2c0.2 0.8 1.3 0.8 1.7 0 0.3-0.2 5.5-5.3 5.5-5.3 0.8-1.3 1.2-2.8 1.2-4.3 0-4.5-4-8.5-8.5-8.5z"/>
      </svg>
    </a>
  );
}
