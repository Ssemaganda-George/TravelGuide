-- Persist manual ordering of activities and stays on destination pages.
-- order_index defaults to existing rows so they keep their current relative order;
-- new rows start at the end (higher index).

alter table activities add column if not exists order_index integer not null default 0;
create index if not exists activities_place_order on activities (place_id, order_index);

alter table partners add column if not exists order_index integer not null default 0;
create index if not exists partners_type_order on partners (type, order_index);
