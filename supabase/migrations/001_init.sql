-- Uganda Guide: core schema + Row Level Security
-- Run in Supabase: SQL Editor -> paste -> Run (or keep in /supabase/migrations)

create type place_type        as enum ('country','region','destination');
create type content_status    as enum ('draft','published');
create type partner_type      as enum ('lodge','operator','driver','guide','activity');
create type enquiry_status    as enum ('new','contacted','quoted','booked','lost');
create type commission_status as enum ('pending','invoiced','paid');

-- Geography: country -> region -> destination (add Kenya later = add rows)
create table places (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  type       place_type not null,
  parent_id  uuid references places(id),
  lat        double precision,
  lng        double precision,
  created_at timestamptz not null default now()
);

-- Writing, one row per destination per language
create table destination_content (
  id            uuid primary key default gen_random_uuid(),
  place_id      uuid not null references places(id),
  language      text not null default 'en',
  title         text not null,
  hook          text,
  story         text,
  best_months   text,
  budget_range  text,
  ideal_days    int,
  tags          text[] not null default '{}',
  getting_there text,
  local_tip     text,
  tip_author    text,
  last_checked  date,
  status        content_status not null default 'draft',
  unique (place_id, language)
);

create table partners (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  type              partner_type not null,
  contact           text,
  place_ids         uuid[] not null default '{}',
  commission_rate   numeric,          -- percent, e.g. 10
  commission_flat   numeric,          -- or a flat fee
  currency          text default 'USD',
  agreement_status  text not null default 'none',  -- none | agreed | signed
  payment_terms     text,
  notes             text,
  active            boolean not null default true
);

create table activities (
  id             uuid primary key default gen_random_uuid(),
  place_id       uuid not null references places(id),
  partner_id     uuid references partners(id),
  name           text not null,
  description    text,
  cost_low       numeric,
  cost_high      numeric,
  currency       text default 'USD',
  duration       text,
  last_checked   date,
  status         content_status not null default 'draft'
);

create table enquiries (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text not null check (char_length(name) between 1 and 120),
  contact        text not null check (char_length(contact) between 3 and 160),
  contact_method text not null default 'whatsapp',
  place_id       uuid references places(id),
  travel_dates   text,
  group_size     int check (group_size between 1 and 100),
  budget         text,
  interests      text[] not null default '{}',
  message        text check (char_length(message) <= 2000),
  source_page    text,
  source_channel text,
  status         enquiry_status not null default 'new',
  handled_by     text,
  lost_reason    text
);

create table referrals (
  id                uuid primary key default gen_random_uuid(),
  enquiry_id        uuid not null references enquiries(id),
  partner_id        uuid not null references partners(id),
  booking_value     numeric,
  currency          text default 'USD',
  commission_due    numeric,
  commission_status commission_status not null default 'pending',
  trip_date         date,
  paid_date         date
);

-- Admins: add yourself after signing up (see bottom of file)
create table admins (user_id uuid primary key references auth.users(id));

create function is_admin() returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from admins where user_id = auth.uid()) $$;

-- Row Level Security
alter table places              enable row level security;
alter table destination_content enable row level security;
alter table activities          enable row level security;
alter table partners            enable row level security;
alter table enquiries           enable row level security;
alter table referrals           enable row level security;
alter table admins              enable row level security;

-- Public can read published content only
create policy "public reads places"     on places              for select using (true);
create policy "public reads content"    on destination_content for select using (status = 'published');
create policy "public reads activities" on activities          for select using (status = 'published');

-- Public can submit enquiries but never read them
create policy "public submits enquiries" on enquiries for insert
  to anon, authenticated with check (status = 'new');

-- Admin can do everything
create policy "admin all places"     on places              for all using (is_admin()) with check (is_admin());
create policy "admin all content"    on destination_content for all using (is_admin()) with check (is_admin());
create policy "admin all activities" on activities          for all using (is_admin()) with check (is_admin());
create policy "admin all partners"   on partners            for all using (is_admin()) with check (is_admin());
create policy "admin all enquiries"  on enquiries           for all using (is_admin()) with check (is_admin());
create policy "admin all referrals"  on referrals           for all using (is_admin()) with check (is_admin());
create policy "admin reads admins"   on admins              for select using (is_admin());

-- Starter data
insert into places (name, slug, type) values ('Uganda', 'uganda', 'country');

-- After you create your own user in Authentication -> Users, run:
-- insert into admins (user_id) values ('<your-user-uuid>');
