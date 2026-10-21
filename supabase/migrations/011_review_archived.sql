-- Add archived column to destination_reviews for review lifecycle management
-- Allows admins to archive reviews without deleting them
alter table destination_reviews
  add column if not exists archived boolean not null default false;

create index if not exists destination_reviews_archived on destination_reviews (archived);

-- Re-apply RLS policies so admins can manage archived reviews
drop policy if exists "public reads reviews" on destination_reviews;
drop policy if exists "admin all reviews" on destination_reviews;

create policy "public reads reviews" on destination_reviews for select
  using (status = 'approved' and archived = false);

create policy "admin all reviews" on destination_reviews for all
  using (is_admin()) with check (is_admin());
