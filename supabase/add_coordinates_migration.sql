-- ============================================================================
-- ADD COORDINATES TO EXISTING DESTINATIONS AND STAYS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add lat/lng columns to places table (for destinations)
ALTER TABLE places 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Add lat/lng columns to partners table (for stays/lodges)
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 3. Set Kampala as default for all Uganda destinations without coordinates
-- Kampala coordinates: 0.3476° N, 32.5825° E
UPDATE places 
SET latitude = 0.3476, longitude = 32.5825
WHERE type = 'destination' 
  AND latitude IS NULL 
  AND parent_id = (SELECT id FROM places WHERE slug = 'uganda' AND type = 'country');

-- 4. Set specific coordinates for known destinations (update as needed)
-- Sipi Falls
UPDATE places SET latitude = 1.1736, longitude = 34.4758 
WHERE slug = 'sipi-falls' AND type = 'destination';

-- Jinja
UPDATE places SET latitude = 0.4479, longitude = 33.2029 
WHERE slug = 'jinja' AND type = 'destination';

-- Bwindi Impenetrable (Buhoma)
UPDATE places SET latitude = -1.0567, longitude = 29.6200 
WHERE slug = 'bwindi-south-rushaga-nkuringo' AND type = 'destination';

-- Murchison Falls
UPDATE places SET latitude = 2.2807, longitude = 31.7169 
WHERE slug = 'murchison-falls' AND type = 'destination';

-- Mgahinga
UPDATE places SET latitude = -1.3833, longitude = 29.6333 
WHERE slug = 'mgahinga-gorillas-volcanoes' AND type = 'destination';

-- Lake Bunyonyi
UPDATE places SET latitude = -1.2833, longitude = 29.9167 
WHERE slug = 'lake-bunyonyi' AND type = 'destination';

-- Kidepo Valley
UPDATE places SET latitude = 3.9500, longitude = 33.7500 
WHERE slug = 'kidepo-valley' AND type = 'destination';

-- Queen Elizabeth
UPDATE places SET latitude = -0.1500, longitude = 29.8500 
WHERE slug = 'queen-elizabeth' AND type = 'destination';

-- 5. Set default Kampala coordinates for stays without coordinates (Uganda lodges)
-- Only update if lat/lng are null
UPDATE partners 
SET latitude = 0.3476, longitude = 32.5825
WHERE type = 'lodge' 
  AND latitude IS NULL 
  AND longitude IS NULL
  AND EXISTS (
    SELECT 1 FROM places p 
    WHERE p.id = ANY(partners.place_ids) 
    AND p.parent_id = (SELECT id FROM places WHERE slug = 'uganda' AND type = 'country')
  );

-- 6. Set specific coordinates for known lodges (update as you have them)
-- Example - update with actual coordinates when available:
-- UPDATE partners SET latitude = 1.1740, longitude = 34.4760 WHERE name = 'Sipi River Lodge';
-- UPDATE partners SET latitude = 1.1730, longitude = 34.4750 WHERE name = 'Rafiki Lodge Sipi';

-- 7. Verify the data
SELECT name, slug, latitude, longitude 
FROM places 
WHERE type = 'destination' 
ORDER BY name;

SELECT name, latitude, longitude 
FROM partners 
WHERE type = 'lodge' 
ORDER BY name;

-- ============================================================================
-- AFTER RUNNING THIS, THE MAP WILL SHOW PINS FOR:
-- 1. Homepage: All Uganda destinations with their coordinates
-- 2. Detail pages: Stays and activities for each destination
-- ============================================================================