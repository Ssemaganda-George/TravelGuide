/**
 * Site configuration - single source of truth for brand identity
 * All hardcoded site names and URLs should be replaced with these constants
 */

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Trip Insights";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 
  (process.env.NODE_ENV === "production" ? "https://trip-insights.com" : "http://localhost:3000");

export const SITE_DOMAIN = new URL(SITE_URL).hostname;

export const SITE_TAGLINE = "Best travel times, rough costs and local tips for every destination.";

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

// Derived constants for backwards compatibility
export const SITE = SITE_URL;
