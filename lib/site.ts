/**
 * Site configuration - single source of truth for brand identity
 * All hardcoded site names and URLs should be replaced with these constants
 */

export const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME ?? "Trip Insights").trim();

/** Strip trailing spaces/slashes — a trailing space in env poisons sitemap, canonicals, OG, and JSON-LD. */
function normalizeSiteUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production" ? "https://trip-insights.com" : "http://localhost:3000")
);

export const SITE_DOMAIN = new URL(SITE_URL).hostname;

export const SITE_TAGLINE =
  "Uganda travel guides for diaspora and global travellers — real costs, best times, and local tips from a Kampala-based guide.";

export const SITE_HOME_TITLE =
  "Uganda Travel Guides for Diaspora & Global Travellers | Trip Insights";

export const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim();

/** Absolute URL for a site path (path should start with /). */
export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p === "/" ? SITE_URL : `${SITE_URL}${p}`;
}

// Derived constants for backwards compatibility
export const SITE = SITE_URL;
