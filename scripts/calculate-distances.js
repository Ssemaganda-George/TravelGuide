#!/usr/bin/env node
// Calculate distances from Kampala to all destinations and update database
// Run: node scripts/calculate-distances.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role for updates
);

const KAMPALA = { lat: 0.3476, lng: 32.5825 };

async function calculateDistance(lat: number, lng: number) {
  const url = `https://router.project-osrm.org/route/v1/driving/${KAMPALA.lng},${KAMPALA.lat};${lng},${lat}?overview=false`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    return {
      distance_km: Math.round(route.distance / 1000 * 10) / 10,
      duration_min: Math.round(route.duration / 60)
    };
  }
  return null;
}

async function main() {
  console.log('Fetching destinations...');
  
  const { data: destinations, error } = await supabase
    .from('destination_content')
    .select('id, title, place_id, places!inner(lat, lng)')
    .eq('status', 'published')
    .eq('language', 'en');
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${destinations?.length} destinations`);
  
  for (const dest of destinations || []) {
    const place = dest.places as { lat: number | null; lng: number | null } | null;
    
    if (!place || place.lat == null || place.lng == null) {
      console.log(`Skipping ${dest.title} - no coordinates`);
      continue;
    }
    
    console.log(`Calculating for ${dest.title}...`);
    const result = await calculateDistance(place.lat, place.lng);
    
    if (result) {
      const { error: updateError } = await supabase
        .from('destination_content')
        .update({
          distance_km: result.distance_km,
          duration_min: result.duration_min
        })
        .eq('id', dest.id);
      
      if (updateError) {
        console.error(`Error updating ${dest.title}:`, updateError);
      } else {
        console.log(`  ✓ ${dest.title}: ${result.distance_km} km, ${result.duration_min} min`);
      }
    } else {
      console.log(`  ✗ ${dest.title}: Failed to calculate`);
    }
    
    // Rate limit: OSRM allows ~1 req/sec for free tier
    await new Promise(r => setTimeout(r, 1100));
  }
  
  console.log('Done!');
}

main().catch(console.error);