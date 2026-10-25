-- Migration: Ensure places table has lat/lng and populate destination coordinates
-- Run in Supabase SQL Editor

-- 1. Ensure places table has lat/lng columns (should exist from 001_init.sql)
alter table places 
add column if not exists lat double precision,
add column if not exists lng double precision;

-- 2. Update coordinates for all known Uganda destinations by place_id
-- Jinja (Source of the Nile)
update places set lat = 0.4333, lng = 33.2000
where id = '4935db5c-6b1c-4706-b095-948791bef229';

-- Bwindi South: Rushaga and Nkuringo
update places set lat = -1.0554, lng = 29.6281
where id = 'e7e61f32-01a0-4f1a-8d36-1ac26f1f8a11';

-- Mgahinga: Gorillas and Volcanoes
update places set lat = -1.3644, lng = 29.6111
where id = 'cc46773b-8087-4e5b-b12e-1c8ca6ff54cd';

-- Lake Bunyonyi
update places set lat = -1.2833, lng = 29.9333
where id = '874a228e-82dd-4234-93ec-2faa9e417d8f';

-- Sipi Falls
update places set lat = 1.3333, lng = 34.3833
where id = '77dc6695-1790-4f03-86dc-01dbf6dc0dfd';

-- Buganda Kingdom
update places set lat = 0.3476, lng = 32.5825
where id = '253fed73-7f91-4a0f-854e-e5fd15f30c33';

-- Murchison Falls
update places set lat = 2.2667, lng = 31.7500
where id = '6246025d-1330-41ce-8b45-608d14d88d9d';

-- Rwenzori Mountains
update places set lat = 0.3833, lng = 29.8833
where id = '5eac076a-a43a-48b6-8812-8ecff82ca2a8';

-- Bwindi: Gorillas at Buhoma
update places set lat = -1.0554, lng = 29.6281
where id = 'ae3b6302-3c29-4bd5-9871-1523b00ee3f5';

-- Kibale Forest: Chimpanzee Tracking
update places set lat = 0.4833, lng = 30.3833
where id = '9b151caa-c69d-4c1b-874f-16e935c3b790';

-- Queen Elizabeth National Park
update places set lat = -0.1367, lng = 30.0407
where id = '8f6c9558-5c4f-4c15-abf7-129632c78c95';

-- Kidepo Valley
update places set lat = 3.8833, lng = 33.7500
where id = 'f60c6df0-ef10-46d6-a237-6e565fe4b31e';

-- 3. Verify coordinates are populated
select 
  p.id as place_id,
  p.name,
  p.slug,
  p.lat,
  p.lng,
  dc.title,
  dc.distance_km,
  dc.duration_min,
  dc.travel_time
from places p
left join destination_content dc on dc.place_id = p.id and dc.language = 'en'
where p.type = 'destination'
order by p.name;