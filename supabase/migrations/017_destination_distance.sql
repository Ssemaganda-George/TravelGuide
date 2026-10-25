-- Add distance and duration columns to destination_content
-- distance_km: distance from capital in kilometers (with 1 decimal precision)
-- duration_min: driving time from capital in minutes

alter table destination_content
add column if not exists distance_km numeric(6,1),
add column if not exists duration_min int;

-- Add index for sorting by distance
create index if not exists idx_destination_content_distance on destination_content(distance_km);