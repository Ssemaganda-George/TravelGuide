"use client";

const PENDING = new Map<string, number>(); // key -> timestamp

function debounceKey(type: string, label: string, path: string): string {
  return `${type}|${label}|${path}`;
}

export function trackEvent(event: {
  type: string;
  label: string;
  path: string;
  channel: string;
  internal: boolean;
}) {
  const { type, label, path, channel, internal } = event;

  // Validate path
  if (!path.startsWith("/") || path.length > 200 || path === "/admin" || path.startsWith("/api")) return;
  // Validate label
  if (!/^[a-z0-9_:-]+$/.test(label) || label.length > 80) return;

  // Debounce same type+label+path for 30 seconds
  const key = debounceKey(type, label, path);
  const now = Date.now();
  const last = PENDING.get(key);
  if (last && now - last < 30000) return;
  PENDING.set(key, now);

  // Clean old entries
  for (const [k, t] of PENDING.entries()) {
    if (now - t > 30000) PENDING.delete(k);
  }

  const payload = JSON.stringify({ type, label, path, channel, internal });
  const blob = new Blob([payload], { type: "application/json" });

  // sendBeacon first, fallback to fetch with keepalive
  const sent = navigator.sendBeacon("/api/event", blob);
  if (!sent) {
    fetch("/api/event", {
      method: "POST",
      body: blob,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
}

export function currentChannel(): string {
  try {
    const utm = new URLSearchParams(typeof location !== "undefined" ? location.search : "").get("utm_source");
    if (utm) return utm.toLowerCase().trim();
    const ref = typeof document !== "undefined" ? document.referrer : "";
    if (ref) {
      const host = new URL(ref).hostname.replace(/^www\./, "");
      const curHost = typeof location !== "undefined" ? new URL(location.href).hostname : "";
      if (host && host !== curHost) return host;
    }
  } catch {}
  return "direct";
}

export function isInternalDevice(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("ti_internal") === "true";
}
