# Trip Insights SEO Audit — https://trip-insights.com/

**Date:** 2026-11-02  
**Audience focus:** Diaspora travellers + global tourism search  
**Business type:** Travel publisher / destination guide (Uganda) with enquiry CTA  
**SEO Health Score: 45 / 100**

## Executive summary

Destination content quality is a real strength — Bwindi-level guides show firsthand experience, local attribution, and practical planning detail. Technical SEO is currently blocking that content from ranking: a trailing space in production `NEXT_PUBLIC_SITE_URL` (`https://trip-insights.com `) corrupts sitemap locs, robots sitemap declaration, canonicals, Open Graph/Twitter URLs, and JSON-LD. Search engines show no meaningful `site:trip-insights.com` coverage. For diaspora intent specifically, the site does not yet publish pages that match how that audience searches (citizen rates, homecoming + safari, flying in from UK/US/UAE).

## Scorecard

| Category | Score | Weight |
|----------|------:|-------:|
| Technical SEO | 28 | 22% |
| Content Quality | 68 | 23% |
| On-Page SEO | 35 | 20% |
| Schema / Structured Data | 40 | 10% |
| Performance (CWV) | 55* | 10% |
| AI Search Readiness | 50 | 10% |
| Images | 25 | 5% |
| **Health** | **45** | 100% |

\*PageSpeed API quota exceeded; performance scored from infrastructure signals only.

## Top critical issues

1. **Trailing space in `SITE_URL`** — live evidence in robots.txt (`Sitemap: https://trip-insights.com /sitemap.xml`) and every sitemap `<loc>`.
2. **Broken canonical / og:url** — e.g. `https://trip-insights.com/https:/trip-insights.com%20/uganda/bwindi-buhoma`.
3. **Broken social image** — `og:image` double-host garbage path.
4. **No observable organic index coverage** for the domain at audit time.
5. **Diaspora SERP gap** — competitors own “Ugandan diaspora safari / citizen rates” style queries; Trip Insights does not.

## What is already working

- Deep destination guides with last-checked dates, FAQs, stays/activities, local tips.
- About page with named people (George, Winnie), contact email, WhatsApp — solid E-E-A-T Who/How/Why.
- AI crawlers allowed in robots.txt (including OAI-SearchBot for ChatGPT Search).
- HTTPS + HSTS; destination pages prerendered/CDN-cached on Vercel.
- Destination title/meta tags are specific and useful once URL integrity is fixed.

## Diaspora / global tourism SXO notes

| Persona need | Current fit | Gap |
|--------------|-------------|-----|
| Plan Uganda trip from abroad | Medium | Home title/meta do not say Uganda travel |
| Citizen / EAC pricing & passport proof | Weak | No dedicated guide; competitors rank |
| Homecoming + tourism combo | Weak | Guides are destination-first, not trip-shape-first |
| Trust a local Kampala guide | Strong | About + WhatsApp + first-person tips |
| Compare stays/activities | Strong | Tiered stays + activities on destination pages |

**Falsifiability:** After URL fix + GSC submit, homepage and `/uganda/bwindi-buhoma` should appear in `site:` within ~2–4 weeks if crawl/index was the blocker. If still zero, inspect robots/noindex/manual actions next.

## Priority action plan

See `ACTION-PLAN.md`.
