-- Migration 013: Brand rename check - Trip Insights
-- This file contains SELECT statements to identify any rows containing old brand names.
-- Run these to review, then create an UPDATE script if needed.

-- Check destination_content for old brand references
SELECT id, place_id, title, hook, story, local_tip, getting_there, meta_title, meta_description
FROM destination_content
WHERE 
  title ILIKE '%travel guide%' OR
  hook ILIKE '%travel guide%' OR
  story ILIKE '%travel guide%' OR
  local_tip ILIKE '%travel guide%' OR
  getting_there ILIKE '%travel guide%' OR
  meta_title ILIKE '%travel guide%' OR
  meta_description ILIKE '%travel guide%' OR
  title ILIKE '%uganda guide%' OR
  hook ILIKE '%uganda guide%' OR
  story ILIKE '%uganda guide%' OR
  local_tip ILIKE '%uganda guide%' OR
  getting_there ILIKE '%uganda guide%' OR
  meta_title ILIKE '%uganda guide%' OR
  meta_description ILIKE '%uganda guide%' OR
  title ILIKE '%dirt.trails%' OR
  hook ILIKE '%dirt.trails%' OR
  story ILIKE '%dirt.trails%' OR
  local_tip ILIKE '%dirt.trails%' OR
  getting_there ILIKE '%dirt.trails%' OR
  meta_title ILIKE '%dirt.trails%' OR
  meta_description ILIKE '%dirt.trails%' OR
  title ILIKE '%travelguide%' OR
  hook ILIKE '%travelguide%' OR
  story ILIKE '%travelguide%' OR
  local_tip ILIKE '%travelguide%' OR
  getting_there ILIKE '%travelguide%' OR
  meta_title ILIKE '%travelguide%' OR
  meta_description ILIKE '%travelguide%';

-- Check packages for old brand references
SELECT id, name, description, features, inclusions, exclusions
FROM packages
WHERE 
  name ILIKE '%travel guide%' OR
  description ILIKE '%travel guide%' OR
  features ILIKE '%travel guide%' OR
  inclusions ILIKE '%travel guide%' OR
  exclusions ILIKE '%travel guide%' OR
  name ILIKE '%uganda guide%' OR
  description ILIKE '%uganda guide%' OR
  features ILIKE '%uganda guide%' OR
  inclusions ILIKE '%uganda guide%' OR
  exclusions ILIKE '%uganda guide%' OR
  name ILIKE '%travelguide%' OR
  description ILIKE '%travelguide%' OR
  features ILIKE '%travelguide%' OR
  inclusions ILIKE '%travelguide%' OR
  exclusions ILIKE '%travelguide%';

-- Check media for old brand references
SELECT id, place_id, url, alt, caption
FROM media
WHERE 
  alt ILIKE '%travel guide%' OR
  caption ILIKE '%travel guide%' OR
  alt ILIKE '%uganda guide%' OR
  caption ILIKE '%uganda guide%' OR
  alt ILIKE '%travelguide%' OR
  caption ILIKE '%travelguide%' OR
  alt ILIKE '%dirt.trails%' OR
  caption ILIKE '%dirt.trails%';

-- Check chat_messages for old brand references
SELECT id, place_id, role, content
FROM chat_messages
WHERE 
  content ILIKE '%travel guide%' OR
  content ILIKE '%uganda guide%' OR
  content ILIKE '%travelguide%' OR
  content ILIKE '%dirt.trails%';

-- Check partners for old brand references
SELECT id, name, description, contact, email, website
FROM partners
WHERE 
  name ILIKE '%travel guide%' OR
  description ILIKE '%travel guide%' OR
  name ILIKE '%uganda guide%' OR
  description ILIKE '%uganda guide%' OR
  name ILIKE '%travelguide%' OR
  description ILIKE '%travelguide%' OR
  name ILIKE '%dirt.trails%' OR
  description ILIKE '%dirt.trails%';

-- Check activities for old brand references
SELECT id, name, description
FROM activities
WHERE 
  name ILIKE '%travel guide%' OR
  description ILIKE '%travel guide%' OR
  name ILIKE '%uganda guide%' OR
  description ILIKE '%uganda guide%' OR
  name ILIKE '%travelguide%' OR
  description ILIKE '%travelguide%';

-- Check destination_content tags for old brand references
SELECT id, place_id, tags
FROM destination_content
WHERE 
  tags @> ARRAY['travel guide'] OR
  tags @> ARRAY['uganda guide'] OR
  tags @> ARRAY['travelguide'] OR
  tags @> ARRAY['dirt-trails'];
