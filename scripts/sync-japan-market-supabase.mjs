import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const DETAIL_DIR = path.join(ROOT, 'public', 'data', 'japan-market', 'details');
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const unavailableAfterHours = Number(process.env.JAPAN_MARKET_UNAVAILABLE_AFTER_HOURS ?? 48);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for database sync.');
}
if (!fs.existsSync(DETAIL_DIR)) throw new Error('Run npm run japan-market:build before database sync.');

const vehicles = fs.readdirSync(DETAIL_DIR)
  .filter((file) => file.endsWith('.json'))
  .flatMap((file) => {
    const payload = JSON.parse(fs.readFileSync(path.join(DETAIL_DIR, file), 'utf8'));
    return Array.isArray(payload.vehicles) ? payload.vehicles : [];
  });
const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const syncSeenAt = new Date().toISOString();

for (let index = 0; index < vehicles.length; index += 500) {
  const rows = vehicles.slice(index, index + 500).map((vehicle) => ({
    id: vehicle.id,
    source: 'jpauc',
    source_id: String(vehicle.id).replace(/^JP/, ''),
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant || null,
    year: vehicle.year || null,
    mileage: vehicle.mileage ?? null,
    fuel_type: vehicle.fuelType || null,
    engine: vehicle.engine || null,
    transmission: vehicle.transmission || null,
    drive_type: vehicle.driveType || null,
    colour: vehicle.colour || null,
    auction_grade: vehicle.auctionGrade || null,
    interior_grade: vehicle.interiorGrade || null,
    chassis_code: vehicle.chassisCode || null,
    japan_price: vehicle.japanPrice ?? null,
    estimated_nzd_price: vehicle.estimatedNzdPrice ?? null,
    image_urls: [],
    body_type: vehicle.bodyType || null,
    location: vehicle.location || null,
    status: 'Available',
    updated_at: syncSeenAt,
    last_seen_at: syncSeenAt,
  }));
  const { error } = await client.from('japan_market_vehicles').upsert(rows, { onConflict: 'source,source_id' });
  if (error) throw error;
}

const staleBefore = new Date(Date.now() - unavailableAfterHours * 60 * 60 * 1000).toISOString();
const { error: staleError } = await client
  .from('japan_market_vehicles')
  .update({ status: 'Unavailable', updated_at: syncSeenAt })
  .eq('source', 'jpauc')
  .eq('status', 'Available')
  .lt('last_seen_at', staleBefore);
if (staleError) throw staleError;

console.log(`Japan Market database sync complete: ${vehicles.length} vehicles seen; missing records age out after ${unavailableAfterHours} hours.`);
