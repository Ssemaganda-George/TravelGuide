-- Public engagement metrics for destination cards: views, likes, reviews.
-- Views already exist via page_views; this adds public read access plus likes + reviews tables.

-- Let the public read page view counts (used on homepage cards)
drop policy if exists "admin reads views" on page_views;
create policy "public reads views" on page_views for select using (true);
create policy "admin reads views"    on page_views for select using (is_admin());

-- Likes: one row per like on a destination (anonymous, no IP stored)
create table destination_likes (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table destination_likes enable row level security;
create index destination_likes_place on destination_likes (place_id);
create policy "public reads likes" on destination_likes for select using (true);
create policy "public inserts likes" on destination_likes for insert to anon, authenticated with check (true);

-- Reviews: rating (1-5) + optional comment + author name
create table destination_reviews (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references places(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  author     text not null check (char_length(author) between 1 and 80),
  comment    text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);
alter table destination_reviews enable row level security;
create index destination_reviews_place on destination_reviews (place_id);
create policy "public reads reviews" on destination_reviews for select using (true);
create policy "public inserts reviews" on destination_reviews for insert to anon, authenticated with check (true);
