-- Add email and website to partners (lodges/stays)
alter table partners
  add column if not exists email text,
  add column if not exists website text;

-- Junction table: activities <-> providers (partners)
create table if not exists activity_providers (
  activity_id uuid not null references activities(id) on delete cascade,
  partner_id  uuid not null references partners(id) on delete cascade,
  primary key (activity_id, partner_id)
);
create index if not exists activity_providers_activity on activity_providers (activity_id);
create index if not exists activity_providers_partner on activity_providers (partner_id);
