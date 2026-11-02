# Hosting / Search Console handoff

Code fixes for trailing-space URL safety, metadata, schema, and alts are in the repo. Production still needs these env/GSC steps from whoever owns the Vercel + Search Console project.

## Vercel env (required)

1. Set `NEXT_PUBLIC_SITE_URL` to exactly:
   ```
   https://trip-insights.com
   ```
   - No trailing space
   - No trailing slash
2. Redeploy after saving the env var (build-time `NEXT_PUBLIC_*` values).
3. After deploy, verify:
   - https://trip-insights.com/robots.txt → `Sitemap: https://trip-insights.com/sitemap.xml` (no space)
   - https://trip-insights.com/sitemap.xml → every `<loc>` has no space after the host
   - View source on `/` and `/uganda/bwindi-buhoma` → canonical and `og:image` are clean single-host URLs

## Google Search Console (required)

1. Verify property `sc-domain:trip-insights.com` or `https://trip-insights.com/`
2. Submit sitemap: `https://trip-insights.com/sitemap.xml`
3. URL Inspection → request indexing for `/` and `/uganda/bwindi-buhoma`
4. Optional: set `NEXT_PUBLIC_GSC_VERIFICATION` to the HTML-tag verification token if using meta verification

## Optional

- Share GSC access with the Google account used for Cursor GSCmate so audits can read live clicks/impressions
