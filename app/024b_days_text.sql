-- 024b: Add enquiries.days as text (range labels like 2-5, 5-10, 10-20, 20-plus)
-- Safe to run more than once. Handles: column missing, column as integer, column with check constraint.

do $$
begin
  -- Drop any check constraint on days first
  alter table enquiries drop constraint if exists enquiries_days_check;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enquiries' and column_name = 'days'
  ) then
    alter table enquiries add column days text;
  else
    alter table enquiries alter column days type text using days::text;
  end if;
end $$;

-- Check:
-- select table_name, column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name = 'enquiries' and column_name = 'days';
