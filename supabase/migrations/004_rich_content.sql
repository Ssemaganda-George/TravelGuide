-- Richer destination pages: extra prose sections, and media for activities and lodges.
-- media is a JSON array: [{"type":"image"|"video","url":"https://...","caption":"optional"}]

alter table destination_content
  add column if not exists region      text,
  add column if not exists best_time   text,
  add column if not exists plan_around text;

alter table activities
  add column if not exists media jsonb not null default '[]';

-- Lodges are partners of type 'lodge'; give them a stay tier, a blurb, and media
alter table partners
  add column if not exists description text,
  add column if not exists tier        text check (tier in ('budget', 'mid', 'comfort')),
  add column if not exists media       jsonb not null default '[]';
