-- Update coordinates for Rwenzori Mountains and Buganda Kingdom
-- Run in Supabase SQL Editor

-- Rwenzori Mountains (place_id from CSV: 5eac076a-a43a-48b6-8812-8ecff82ca2a8)
-- Location: Western Uganda near Kasese, ~350 km from Kampala
update places set lat = 0.3833, lng = 29.8833
where id = '5eac076a-a43a-48b6-8812-8ecff82ca2a8';

-- Buganda Kingdom (place_id from CSV: 253fed73-7f91-4a0f-854e-e5fd15f30c33)
-- Location: In/around Kampala (Mengo, Kasubi, etc.) - very close to capital
update places set lat = 0.3167, lng = 32.5833
where id = '253fed73-7f91-4a0f-854e-e5fd15f30c33';

-- Verify updates
select 
  p.id,
  p.name,
  p.slug,
  p.lat,
  p.lng,
  dc.title,
  dc.distance_km,
  dc.duration_min
from places p
left join destination_content dc on dc.place_id = p.id and dc.language = 'en'
where p.id in ('5eac076a-a43a-48b6-8812-8ecff82ca2a8', '253fed73-7f91-4a0f-854e-e5fd15f30c33');