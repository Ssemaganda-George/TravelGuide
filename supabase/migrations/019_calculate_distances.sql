-- Update distance_km and duration_min for all published destinations
-- Run after populating coordinates

-- This uses a loop to calculate for each destination
-- Note: This requires pg_net or similar for HTTP calls, or run from application

-- Alternative: Run from your app by visiting /admin/content/[id] and saving each
-- Or use this script with psql + curl (run from command line):

-- For manual calculation via OSRM API, you can use this pattern:
-- https://router.project-osrm.org/route/v1/driving/32.5825,0.3476;29.6111,-1.3644?overview=false
-- Returns distance in meters and duration in seconds

-- Quick reference for Kampala (capital) to each destination:
-- Kampala: 0.3476, 32.5825

-- If you have pg_net extension enabled, you could use:
/*
do $$
declare
  rec record;
  resp jsonb;
  route jsonb;
begin
  for rec in 
    select p.id, p.name, p.lat, p.lng 
    from places p 
    join destination_content dc on dc.place_id = p.id 
    where p.type = 'destination' 
    and p.lat is not null 
    and p.lng is not null
    and dc.status = 'published'
    and dc.language = 'en'
  loop
    -- Call OSRM API
    -- This requires pg_net extension: create extension pg_net;
    -- select pg_net.http_get('https://router.project-osrm.org/route/v1/driving/' || 
    --   32.5825 || ',' || 0.3476 || ';' || rec.lng || ',' || rec.lat || '?overview=false');
    
    -- For now, just log what would be called
    raise notice 'Destination: %, URL: https://router.project-osrm.org/route/v1/driving/32.5825,0.3476;%,%?overview=false', 
      rec.name, rec.lng, rec.lat;
  end loop;
end $$;
*/

-- Manual verification query:
select 
  dc.title,
  p.name as place_name,
  p.lat,
  p.lng,
  dc.distance_km,
  dc.duration_min,
  case 
    when dc.distance_km is not null then dc.distance_km || ' km'
    else 'NOT CALCULATED'
  end as distance_status
from destination_content dc
join places p on p.id = dc.place_id
where dc.status = 'published' 
and dc.language = 'en'
order by dc.title;