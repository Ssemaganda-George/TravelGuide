-- First-party, cookie-free page-view counting + admin-only reporting functions.
create table page_views (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path       text not null check (char_length(path) <= 200),
  channel    text not null default 'direct' check (char_length(channel) <= 80),
  visitor    text not null check (char_length(visitor) <= 32)  -- daily-rotating hash, no IP stored
);
create index page_views_path_time on page_views (path, created_at);
create index page_views_time on page_views (created_at);

alter table page_views enable row level security;
create policy "public inserts views" on page_views for insert to anon, authenticated with check (true);
create policy "admin reads views"    on page_views for select using (is_admin());

-- Views, visitors and enquiries per page. Visitors are counted per day (a returning person counts again).
create function page_stats(p_days int default 30)
returns table (path text, views int, visitors int, enquiries int)
language sql stable security definer set search_path = public as $$
  select v.path, count(*)::int as views, count(distinct v.visitor)::int as visitors,
    (select count(*)::int from enquiries e
      where e.source_page = v.path and e.created_at > now() - make_interval(days => p_days)) as enquiries
  from page_views v
  where is_admin() and v.created_at > now() - make_interval(days => p_days)
  group by v.path order by views desc limit 50
$$;

create function source_stats(p_days int default 30)
returns table (channel text, views int, visitors int)
language sql stable security definer set search_path = public as $$
  select v.channel, count(*)::int as views, count(distinct v.visitor)::int as visitors
  from page_views v
  where is_admin() and v.created_at > now() - make_interval(days => p_days)
  group by v.channel order by views desc limit 100
$$;

-- Optional housekeeping: delete raw rows older than a year (run now and then, or schedule it)
-- delete from page_views where created_at < now() - interval '365 days';
