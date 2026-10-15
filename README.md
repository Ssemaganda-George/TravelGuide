# Uganda Guide (Next.js + Supabase)

## 1. Database
Run in the Supabase SQL Editor, in order: `001_init.sql`, `002_hardening.sql`, `seed.sql`.
Then Authentication -> Users -> add your user, and run the `insert into admins ...` line at the bottom of `001_init.sql`.

## 2. Run locally
`cp .env.example .env.local`, fill in the Supabase URL and anon key, then `npm install && npm run dev`.
Seeded pages are drafts: rewrite the Jinja text, set `status = 'published'`, and it appears at `/uganda/jinja` (refreshes within an hour).

## 3. Enquiry alerts
Set `NOTIFY_SECRET` (any long random string), `NOTIFY_TO` (your email), `NOTIFY_FROM` (a sender verified with your email provider) and `RESEND_API_KEY`.
In Supabase: Database -> Webhooks -> new webhook on table `enquiries`, event INSERT, HTTP POST to `https://YOUR-SITE/api/notify`, header `x-notify-secret: <NOTIFY_SECRET>`.
(Resend is one option; check its docs for current setup. Any email API works by editing `app/api/notify/route.ts`.)

## 4. Admin
Sign in at `/admin` to see enquiries and move them through new -> contacted -> quoted -> booked / lost.

## Deploy
Vercel, Cloudflare or Netlify: set the same env vars and `NEXT_PUBLIC_SITE_URL` to your real domain.

## Notes
- Destinations must be direct children of a country place (regions come later).
- The anon key is public by design; RLS protects data. Never expose a service_role key.
- Not built yet: partner/referral screens, in-app content editor (use the Supabase table editor), analytics, translations.
- Check current Next.js docs before upgrading: file conventions (e.g. middleware) change between versions.

## Admin screens
- `/admin` enquiries and status, `/admin/referrals` commissions (calculated from each partner's rate), `/admin/partners`,
  `/admin/content` (create, edit, publish destinations; public pages update straight away), `/admin/insights` (enquiry stats).
- Visit analytics are optional: set `NEXT_PUBLIC_ANALYTICS_SRC` and `NEXT_PUBLIC_ANALYTICS_DOMAIN` for a Plausible-compatible script. Also verify the site in Google Search Console.
- Translations: the database already stores one content row per language, and the public site reads English only. Adding a language needs translated content plus routing, which is a separate step.

## Analytics (built in)
1. Run `supabase/migrations/003_pageviews.sql`.
2. Set `ANALYTICS_SALT` to a long random string. Page views are then counted by `/api/view`: no cookies, no stored IPs, bots filtered, admin pages excluded.
3. `/admin/insights` shows views, visitors and enquiries per page, traffic sources, and enquiry rate. Use `?utm_source=...` on shared links.
4. Google Search Console: add your domain, choose the HTML tag method, put its content value in `NEXT_PUBLIC_GSC_VERIFICATION`, deploy, verify, then submit `/sitemap.xml`.
5. Optional: the external analytics script variables from earlier still work if you also want a dedicated tool.
6. Check Uganda's data protection rules and mention anonymous analytics in a privacy page before launch.
