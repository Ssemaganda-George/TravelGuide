# Technical SEO

Score: 28/100

## Evidence
- robots.txt Sitemap line: `https://trip-insights.com /sitemap.xml`
- All sitemap locs contain a space after the host
- Canonical/og:url: `https://trip-insights.com/https:/trip-insights.com%20/uganda/bwindi-buhoma`
- HSTS present; destination pages `X-Nextjs-Prerender: 1` + Vercel HIT
- Homepage `Cache-Control: private, no-cache, no-store`

## Root cause
Production `NEXT_PUBLIC_SITE_URL` ends with a trailing space (consumed via `lib/site.ts` → sitemap/robots/metadata/JSON-LD).
