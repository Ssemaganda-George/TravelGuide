# Action Plan — trip-insights.com

## Phase 1: Critical (Week 1)

**Done in code:** SITE_URL trim, path-relative canonical/OG, sitemap/robots via `absoluteUrl()`, schema path + breadcrumb fixes, homepage/about meta, listing alts, logo alt.

**Still needs hosting owner** (see `HOSTING-HANDOFF.md`):

1. Set Vercel `NEXT_PUBLIC_SITE_URL=https://trip-insights.com` (no space/slash) and redeploy.
2. Confirm robots/sitemap/canonical/og:image are clean on live.
3. GSC: verify property, submit sitemap, request index for `/` and `/uganda/bwindi-buhoma`.

**Leading indicator:** GSC “Discovered / Indexed” leaves zero; canonical errors drop.

**Failure check:** If sitemap still shows spaces after redeploy, env var was not updated.

## Phase 2: High impact (Weeks 2–3)

1. ~~Homepage title/meta~~ (done in code — verify live after deploy).
2. ~~JSON-LD / breadcrumbs / AggregateRating nesting~~ (done in code).
3. ~~Listing + logo alts~~ (done in code).
4. Publish diaspora hub + link from About, homepage, and gorilla destinations.

## Phase 3: Authority (Month 2)

1. Content cluster: permits by passport type, Entebbe arrival, 7/10/14-day diaspora itineraries.
2. Earn brand mentions (LinkedIn, YouTube shorts, diaspora groups) — needed for AI citations too.
3. Differentiate from `trip-insight.com` (Japan) with consistent “Trip Insights Uganda” entity language.

## Phase 4: Monitor

1. GSC queries/impressions weekly.
2. Re-audit CWV via PageSpeed after image/alt pass.
3. Optional PDF: regenerate when Phase 1 is done.
