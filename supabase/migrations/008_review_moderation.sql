-- Moderation workflow for reviews: new reviews start as 'pending'
-- and only 'approved' reviews show publicly. Admin approves/rejects.
alter table destination_reviews
  add column if not exists status text not null default 'pending' check (status in ('pending','approved','rejected')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

create index if not exists destination_reviews_status on destination_reviews (status);
create index if not exists destination_reviews_place_status on destination_reviews (place_id, status);

-- Public reads only approved reviews
drop policy if exists "public reads reviews" on destination_reviews;
create policy "public reads reviews" on destination_reviews for select
  using (status = 'approved');

-- Admins can read all reviews and update status
drop policy if exists "admin all reviews" on destination_reviews;
create policy "admin all reviews" on destination_reviews for all
  using (is_admin()) with check (is_admin());
