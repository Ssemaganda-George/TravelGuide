-- Public bucket for lodge/activity photos and videos attached in the admin editor.
-- Media JSON columns (partners.media, activities.media) already exist from 004_rich_content.sql;
-- uploaded files are stored here and their public URLs saved in those columns.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Anyone can view media; only signed-in users can write into the media bucket.
-- Admin uploads are additionally guarded by the is_admin() check in the uploadMedia server action.

create policy "media public select" on storage.objects
  for select using (bucket_id = 'media');

create policy "media authenticated insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

create policy "media authenticated update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media');

create policy "media authenticated delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media');
