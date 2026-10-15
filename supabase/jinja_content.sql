-- ============================================================================
-- Rich content for JINJA: story with inline photos, activities (things to do),
-- and lodges (where to stay). Idempotent - safe to run more than once.
--
-- BEFORE RUNNING:
--   1. Run supabase/migrations/004_rich_content.sql first (adds the columns).
--   2. Replace every https://example.com/... URL with a real image or video
--      link (images, YouTube/Vimeo links, or .mp4 files all work).
--   3. Prices are rough placeholders - verify them, and replace the lodge
--      names with real ones.
-- Set status to 'draft' in the first statement if you do not want it live yet.
-- ============================================================================

-- 1) Destination content ----------------------------------------------------
update destination_content dc set
  hook          = $hook$Where the Nile begins its 6,650 km journey north, and where Uganda goes to play.$hook$,
  story         = $story$Jinja doesn't announce itself. You leave Kampala's noise behind, the road slides past tea estates and sugarcane, and then the air changes. It's cooler and carries the smell of water.

![The Source of the Nile, where Lake Victoria starts its journey north](https://example.com/images/jinja/source-of-the-nile.jpg)

This is where Lake Victoria narrows and begins pushing north as the Nile, the longest river in Africa. Stand on the banks at sunrise and you can watch fishermen drift across water that will eventually reach the Mediterranean. Few places let you stand at the start of something that big.

By day, Jinja is Uganda's adventure capital. Rafting guides shout instructions over the rapids, kayakers paddle out in the calm stretches, and quad bikes churn up red dust along the riverbanks. By evening it slows down. People gather at riverside bars as the sun drops behind the trees, and the town goes quiet in a way you'll want to keep.

![Rafting the rapids just outside Jinja](https://example.com/images/jinja/rafting.jpg)$story$,
  region        = 'Eastern Uganda, on Lake Victoria and the Nile',
  best_months   = 'Dec-Feb, Jun-Aug',
  best_time     = $bt$The dry seasons mean easier roads and more reliable weather. But the river keeps flowing in the rains, and the green, lush landscape is worth the occasional shower. Weekends bring Kampala crowds, so midweek is quieter.$bt$,
  budget_range  = 'Backpacker-friendly up to luxury lodges',
  ideal_days    = 3,
  tags          = array['adventure', 'relaxing', 'birds', 'first-time'],
  getting_there = $gt$By road from Kampala via the Jinja highway, about 80 km. Avoid leaving during morning and evening rush hours, as the first stretch out of the city can double your travel time. Matatus and buses run regularly, and private drivers are easy to arrange.$gt$,
  local_tip     = 'Book rafting for the morning, when the water is calmer and the light is best for photos. Ask for lunch at the riverbank afterwards.',
  tip_author    = 'George',
  plan_around   = 'Pair Jinja with Sipi Falls, Mabira Forest, or a night in Kampala before your flight.',
  last_checked  = current_date,
  status        = 'published'   -- change to 'draft' to take the page offline
from places p
where p.id = dc.place_id and p.slug = 'jinja' and dc.language = 'en';

-- 2) Things to do (activities, each with photos/videos) ---------------------
-- media is a JSON array: {"type":"image"|"video","url":"...","caption":"optional"}
with
p as (select id from places where slug = 'jinja'),
v(name, description, low, high, duration, media) as (values
  ('White-water rafting',
   'The headline activity, with grades from gentle to heart-pounding. Typically a full day including lunch.',
   65, 140, 'Full day',
   '[{"type":"image","url":"https://example.com/images/jinja/rafting.jpg","caption":"Grade 5 rapids below the dam"},{"type":"video","url":"https://www.youtube.com/watch?v=REPLACE_ME","caption":null}]'),
  ('Source of the Nile boat trip',
   'A calm, scenic ride to the traditional spot where the lake becomes the river.',
   15, 30, 'About 2 hours',
   '[{"type":"image","url":"https://example.com/images/jinja/boat-trip.jpg","caption":null}]'),
  ('Kayaking or stand-up paddleboarding',
   'Slower and more peaceful than rafting, on the calm stretches above the rapids.',
   40, 70, 'Half day',
   '[{"type":"image","url":"https://example.com/images/jinja/kayak.jpg","caption":null}]'),
  ('Bird-watching and nature walks',
   'The river islands are rich in birdlife, with a guide to point out the residents.',
   25, 60, '2 to 4 hours',
   '[{"type":"image","url":"https://example.com/images/jinja/birds.jpg","caption":null}]'),
  ('Local markets and food',
   'Try fresh fish, roasted maize, and a Rolex (chapati rolled around an omelette) from a street stall.',
   5, 20, 'A morning',
   '[{"type":"image","url":"https://example.com/images/jinja/market.jpg","caption":null}]')
),
ins as (
  insert into activities (place_id, name, description, cost_low, cost_high, currency, duration, media, status)
  select p.id, v.name, v.description, v.low::numeric, v.high::numeric, 'USD', v.duration, v.media::jsonb, 'published'
  from v cross join p
  where not exists (select 1 from activities a where a.place_id = p.id and a.name = v.name)
  returning 1
)
update activities a set
  description = v.description,
  cost_low    = v.low::numeric,
  cost_high   = v.high::numeric,
  duration    = v.duration,
  media       = v.media::jsonb,
  status      = 'published'
from v cross join p
where a.place_id = p.id and a.name = v.name;

-- 3) Where to stay (lodges, grouped by tier on the page) --------------------
-- Lodges are partners of type 'lodge'. Replace names and URLs with real ones;
-- add more rows in the same shape if you want 2 lodges per tier.
with
p as (select id from places where slug = 'jinja'),
v(name, tier, description, contact, media) as (values
  ('Nile-side backpacker camp', 'budget',
   'Simple riverside bandas and a backpacker vibe, walking distance to the source.',
   null,
   '[{"type":"image","url":"https://example.com/images/jinja/stay-budget.jpg","caption":null}]'),
  ('Guesthouse with river views', 'mid',
   'Clean, quiet guesthouses and small lodges looking over the water.',
   null,
   '[{"type":"image","url":"https://example.com/images/jinja/stay-mid.jpg","caption":null}]'),
  ('Lodge overlooking the Nile', 'comfort',
   'Upscale lodge with a pool and gardens right on the riverbank.',
   null,
   '[{"type":"image","url":"https://example.com/images/jinja/stay-comfort.jpg","caption":null}]')
),
ins as (
  insert into partners (name, type, tier, description, contact, media, place_ids)
  select v.name, 'lodge', v.tier, v.description, v.contact, v.media::jsonb, array[p.id]
  from v cross join p
  where not exists (
    select 1 from partners pr
    where pr.type = 'lodge' and pr.name = v.name and p.id = any(pr.place_ids)
  )
  returning 1
)
update partners pr set
  tier        = v.tier,
  description = v.description,
  contact     = v.contact,
  media       = v.media::jsonb,
  place_ids   = case when p.id = any(pr.place_ids) then pr.place_ids else pr.place_ids || p.id end
from v cross join p
where pr.type = 'lodge' and pr.name = v.name;
