-- Limit spam: max 3 enquiries per contact per hour. SECURITY DEFINER because anon cannot read enquiries under RLS.
create index if not exists enquiries_contact_time on enquiries (contact, created_at);

create function limit_enquiries() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from enquiries where contact = new.contact and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many enquiries, try again later';
  end if;
  return new;
end $$;

create trigger enquiries_rate_limit before insert on enquiries
  for each row execute function limit_enquiries();
