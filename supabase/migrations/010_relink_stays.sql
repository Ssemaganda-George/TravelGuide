-- Diagnose: list all lodge partners and their linked place_ids
select p.id, p.name, p.type, p.place_ids, p.email, p.website
from partners p
where p.type = 'lodge'
order by p.name;

-- Show which places are destinations (have a parent country)
select pl.id, pl.name, pl.slug, pl.parent_id, pl2.name as country_name
from places pl
join places pl2 on pl.parent_id = pl2.id
where pl.type = 'destination'
order by pl2.name, pl.name;

-- Re-link a specific lodge to a destination (run once per stay)
-- Replace the UUIDs with your actual values:
--   <lodge-id> = the partner id from the first query
--   <destination-place-id> = the places.id from the second query
update partners
set place_ids = array_append(COALESCE(place_ids, '{}'::uuid[]), '<destination-place-id>'::uuid)
where id = '<lodge-id>'::uuid
  and type = 'lodge'
  and not place_ids @> ARRAY['<destination-place-id>'::uuid];

-- Example: re-link "Chimps lodge kabale" to Bwindi Buhoma destination
-- (you'll need to get the actual UUIDs from the two SELECT queries above)
-- update partners
-- set place_ids = array_append(COALESCE(place_ids, '{}'::uuid[]), '<buhoma-place-uuid>'::uuid)
-- where id = '<chimps-lodge-uuid>'::uuid
--   and type = 'lodge'
--   and not place_ids @> ARRAY['<buhoma-place-uuid>'::uuid];
