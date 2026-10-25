-- Automatic distance/duration calculation via database trigger
-- Run in Supabase SQL Editor

-- 1. Create the function that calculates distance from capital
create or replace function calculate_destination_distance()
returns trigger language plpgsql as $$
declare
  capital_lat double precision;
  capital_lng double precision;
  route_data jsonb;
  route_record jsonb;
  distance_m numeric;
  duration_s numeric;
begin
  -- Only calculate if lat/lng are provided and changed
  if NEW.lat is null or NEW.lng is null then
    return NEW;
  end if;

  -- Skip if coordinates haven't changed
  if OLD.lat is not null and OLD.lng is not null 
     and OLD.lat = NEW.lat and OLD.lng = NEW.lng then
    return NEW;
  end if;

  -- Get the country capital coordinates for this destination
  select p.lat, p.lng into capital_lat, capital_lng
  from places p
  join places c on c.id = p.parent_id
  where p.id = NEW.id
  and p.type = 'destination'
  and c.type = 'country';

  if capital_lat is null or capital_lng is null then
    return NEW;
  end if;

  -- Call OSRM API using pg_net (requires pg_net extension)
  -- If pg_net is not available, this will skip silently
  begin
    -- Using pg_net for HTTP request
    perform pg_net.http_get(
      'osrm_route',
      'https://router.project-osrm.org/route/v1/driving/' || capital_lng || ',' || capital_lat || ';' || NEW.lng || ',' || NEW.lat || '?overview=false',
      '{}'::jsonb,
      '{}'::jsonb
    );
  exception when others then
    -- pg_net not installed or network error - skip silently
    return NEW;
  end;

  -- Note: The async http_get doesn't return the response directly.
  -- For synchronous calculation, you'd need a different approach.
  -- This trigger approach requires pg_net with async handling.

  return NEW;
end;
$$;

-- 2. Alternative: Simpler approach - use a scheduled job or application-level
-- The most reliable method is the application-level calculation already in place
-- (createDestination and saveContent functions)

-- 3. If you want a cron job to update missing distances nightly:
-- Create this as a Supabase Edge Function or pg_cron job

/*
-- pg_cron example (run nightly at 3 AM):
select cron.schedule(
  'calculate-missing-distances',
  '0 3 * * *',
  $$
  update destination_content dc
  set 
    distance_km = round(calc.distance / 1000 * 10) / 10,
    duration_min = round(calc.duration / 60)
  from (
    select dc.id, p.lat, p.lng, c.lat as capital_lat, c.lng as capital_lng
    from destination_content dc
    join places p on p.id = dc.place_id
    join places c on c.id = p.parent_id
    where dc.status = 'published'
    and dc.language = 'en'
    and dc.distance_km is null
    and p.lat is not null and p.lng is not null
    and c.lat is not null and c.lng is not null
  ) dest
  -- This would need a lateral join with OSRM call
  -- Best done via application code
$$
);
*/

-- 4. Best practice: The admin panel already auto-calculates on save.
-- For other entry points (API, imports), call the same logic.

-- Verification: Check which destinations have missing distances
select 
  dc.title,
  p.name as place_name,
  p.lat,
  p.lng,
  dc.distance_km,
  dc.duration_min,
  case when dc.distance_km is null then 'MISSING' else 'OK' end as status
from destination_content dc
join places p on p.id = dc.place_id
where dc.status = 'published' 
and dc.language = 'en'
order by status desc, dc.title;