-- Add country to page_views for visitor country insights
alter table page_views add column if not exists country text;

create index if not exists page_views_country on page_views (country);
