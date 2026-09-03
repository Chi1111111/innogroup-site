import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'public', 'data', 'japan-market');
const DETAIL_SHARD_COUNT = 128;
const API_URL = 'https://api.carapis.com/apix/catalog_api/vehicles/';
const SOURCE = String(process.env.CARAPIS_SOURCE ?? 'carsensor').trim().toLowerCase();
const PAGE_SIZE = Math.min(100, Math.max(10, Number(process.env.CARAPIS_PAGE_SIZE ?? 100)));
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.CARAPIS_REQUEST_TIMEOUT_MS ?? 20_000));
const CONCURRENCY = Math.min(5, Math.max(1, Number(process.env.CARAPIS_CONCURRENCY ?? 3)));
const DAILY_REQUEST_BUDGET = Math.min(100, Math.max(1, Number(process.env.CARAPIS_DAILY_REQUEST_BUDGET ?? 90)));
const configuredDetailBudget = String(process.env.CARAPIS_DETAIL_REQUEST_BUDGET ?? '').trim();
const DETAIL_REQUEST_BUDGET = configuredDetailBudget
  ? Math.max(0, Number(configuredDetailBudget))
  : Number.POSITIVE_INFINITY;
const keyFileArgument = process.argv.find((argument) => argument.startsWith('--key-file='));
const keyFilePath = process.env.CARAPIS_API_KEY_FILE || keyFileArgument?.slice('--key-file='.length);
const inputFileArgument = process.argv.find((argument) => argument.startsWith('--input='));
const inputFilePath = process.env.CARAPIS_INPUT_FILE || inputFileArgument?.slice('--input='.length);

const apiKey = String(process.env.CARAPIS_API_KEY ?? '').trim()
  || (keyFilePath
    ? fs.readFileSync(path.resolve(keyFilePath), 'utf8').trim()
    : '');

if (!apiKey && !inputFilePath) {
  throw new Error('CARAPIS_API_KEY or CARAPIS_API_KEY_FILE is required. Keep the key server-side and out of VITE_ variables.');
}

const PRICING = {
  nzdPerJpy: Number(process.env.JAPAN_MARKET_NZD_PER_JPY ?? 0.0114),
  nzdPerUsd: Number(process.env.JAPAN_MARKET_NZD_PER_USD ?? 1.70),
  serviceFeeNzd: Number(process.env.JAPAN_MARKET_SERVICE_FEE_NZD ?? 2500),
  shippingNzd: Number(process.env.JAPAN_MARKET_SHIPPING_NZD ?? 3200),
  complianceNzd: Number(process.env.JAPAN_MARKET_COMPLIANCE_NZD ?? 1450),
  registrationNzd: Number(process.env.JAPAN_MARKET_REGISTRATION_NZD ?? 650),
  emissionsNzd: Number(process.env.JAPAN_MARKET_EMISSIONS_NZD ?? 0),
  gstRate: Number(process.env.JAPAN_MARKET_GST_RATE ?? 0.15),
};

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let apiRequestCount = 0;
async function fetchJson(url, label) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    if (apiRequestCount >= DAILY_REQUEST_BUDGET) {
      throw new Error(`CARAPIS daily safety budget reached (${DAILY_REQUEST_BUDGET} requests). No more requests were sent.`);
    }
    let retryAfterSeconds = 0;
    let shouldRetry = true;
    try {
      apiRequestCount += 1;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) return response.json();

      const body = await response.text();
      retryAfterSeconds = Number(response.headers.get('retry-after'));
      lastError = new Error(`${label} failed (${response.status}): ${body.slice(0, 300)}`);
      shouldRetry = [429, 500, 502, 503, 504].includes(response.status);
    } catch (error) {
      lastError = error;
    }

    if (!shouldRetry || attempt === MAX_RETRIES) break;
    await sleep(Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1_000 : attempt * 1_500);
  }

  throw new Error(`${label} failed after ${MAX_RETRIES} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function fetchPage(page) {
  const url = new URL(API_URL);
  url.searchParams.set('source', SOURCE);
  url.searchParams.set('available_only', 'true');
  url.searchParams.set('ordering', '-last_seen_at');
  url.searchParams.set('page', String(page));
  url.searchParams.set('page_size', String(PAGE_SIZE));
  return fetchJson(url, `CARAPIS page ${page}`);
}

async function fetchVehicleDetail(id) {
  return fetchJson(new URL(`${encodeURIComponent(id)}/`, API_URL), `CARAPIS vehicle ${id}`);
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function titleCase(value) {
  return cleanText(value).toLowerCase().replace(/(^|[\s/-])([a-z])/g, (_, boundary, letter) => `${boundary}${letter.toUpperCase()}`);
}

function absolutePhotoUrl(photo) {
  if (!photo) return '';
  const candidate = typeof photo === 'string'
    ? cleanText(photo)
    : cleanText(photo.original_url || photo.full_url || photo.large_url || photo.url || photo.src || photo.thumb_url);
  if (/^https:\/\//i.test(candidate)) return candidate;
  return candidate.startsWith('/') ? `https://api.carapis.com${candidate}` : '';
}

function collectPhotoUrls(raw) {
  const candidates = [raw?.thumb, raw?.photo, raw?.cover];
  for (const field of ['photos', 'images', 'gallery', 'photo_urls']) {
    const value = raw?.[field];
    if (Array.isArray(value)) candidates.push(...value);
  }
  return candidates
    .map(absolutePhotoUrl)
    .filter(Boolean)
    .filter((url, index, values) => values.indexOf(url) === index);
}

function fuelTypeFor(value) {
  return ({
    gasoline: 'Petrol',
    diesel: 'Diesel',
    hybrid: 'Hybrid',
    plug_hybrid: 'PHEV',
    electric: 'EV',
  })[cleanText(value).toLowerCase()] ?? 'Other';
}

function transmissionFor(value) {
  return ({
    auto: 'Automatic',
    manual: 'Manual',
    cvt: 'CVT',
    dct: 'Dual-clutch automatic',
    semi_auto: 'Semi-automatic',
  })[cleanText(value).toLowerCase()] ?? 'Not listed';
}

function bodyTypeFor(value) {
  return ({
    sedan: 'Sedan',
    suv: 'SUV',
    crossover: 'SUV',
    hatchback: 'Hatchback',
    wagon: 'Wagon',
    coupe: 'Coupe',
    convertible: 'Coupe',
    van: 'Van / MPV',
    minivan: 'Van / MPV',
    pickup: 'Van / MPV',
    truck: 'Van / MPV',
    bus: 'Van / MPV',
  })[cleanText(value).toLowerCase()] ?? 'Other';
}

function roundedHundred(value) {
  return Math.round(value / 100) * 100;
}

function landedEstimate(priceUsd) {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
  const vehiclePriceNzd = Math.round(priceUsd * PRICING.nzdPerUsd);
  const gstNzd = Math.round((vehiclePriceNzd + PRICING.shippingNzd) * PRICING.gstRate);
  return roundedHundred(
    vehiclePriceNzd
      + PRICING.serviceFeeNzd
      + PRICING.shippingNzd
      + gstNzd
      + PRICING.complianceNzd
      + PRICING.registrationNzd
      + PRICING.emissionsNzd,
  );
}

function normalizeVehicle(raw, refreshedAt, existingVehicle, detailResult) {
  const id = cleanText(raw.id);
  const make = cleanText(raw.brand_name);
  const model = cleanText(raw.model_name);
  const year = Number(raw.year);
  const mileage = Number(raw.mileage);
  if (!id || !make || !model || !Number.isFinite(year) || !Number.isFinite(mileage)) return null;

  const detailPhotos = detailResult ? collectPhotoUrls(detailResult) : [];
  const existingPhotos = Array.isArray(existingVehicle?.imageUrls) ? existingVehicle.imageUrls : [];
  const photos = [...collectPhotoUrls(raw), ...detailPhotos, ...existingPhotos]
    .filter((url, index, values) => values.indexOf(url) === index);
  const priceUsd = Number(raw.price_usd);
  const lastSeenAt = cleanText(raw.last_seen_at) || refreshedAt;

  return {
    id,
    source: 'Carsensor',
    sourceCode: SOURCE,
    make,
    model,
    variant: cleanText(raw.trim),
    year,
    mileage,
    fuelType: fuelTypeFor(raw.fuel_type),
    engine: 'Not listed',
    transmission: transmissionFor(raw.transmission),
    driveType: 'Not listed',
    colour: titleCase(raw.color) || 'Not listed',
    auctionGrade: null,
    interiorGrade: null,
    chassisCode: 'Not listed',
    japanPrice: null,
    sourcePriceUsd: Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : null,
    estimatedNzdPrice: landedEstimate(priceUsd),
    imageUrl: photos[0] || null,
    imageUrls: photos,
    photoCount: photos.length,
    photoGallerySyncedAt: detailResult ? refreshedAt : existingVehicle?.photoGallerySyncedAt,
    hasAccident: typeof raw.has_accident === 'boolean' ? raw.has_accident : null,
    isNewVehicle: typeof raw.is_new_vehicle === 'boolean' ? raw.is_new_vehicle : null,
    isVerified: typeof raw.is_verified === 'boolean' ? raw.is_verified : null,
    bodyType: bodyTypeFor(raw.body_type),
    location: cleanText(raw.region || raw.source_location) || 'Japan',
    status: 'Available',
    updatedAt: lastSeenAt,
    lastSeenAt,
  };
}

function detailShardFor(id) {
  let hash = 0;
  for (const character of id.toUpperCase()) hash = (hash * 31 + character.charCodeAt(0)) % DETAIL_SHARD_COUNT;
  return String(hash).padStart(3, '0');
}

function vehicleSummary(vehicle) {
  const {
    engine,
    driveType,
    colour,
    interiorGrade,
    chassisCode,
    japanPrice,
    imageUrls,
    photoGallerySyncedAt,
    location,
    status,
    lastSeenAt,
    ...summary
  } = vehicle;
  return summary;
}

function loadExistingVehicles() {
  const vehicles = new Map();
  const detailDir = path.join(OUTPUT_DIR, 'details');
  if (!fs.existsSync(detailDir)) return vehicles;
  for (const filename of fs.readdirSync(detailDir)) {
    if (!filename.endsWith('.json')) continue;
    try {
      const payload = JSON.parse(fs.readFileSync(path.join(detailDir, filename), 'utf8'));
      for (const vehicle of Array.isArray(payload.vehicles) ? payload.vehicles : []) {
        if (vehicle?.id) vehicles.set(String(vehicle.id), vehicle);
      }
    } catch (error) {
      console.warn(`Skipped unreadable existing detail shard ${filename}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return vehicles;
}

function recommendationScore(vehicle) {
  const age = Math.max(0, new Date().getFullYear() - vehicle.year);
  const yearScore = Math.max(0, 24 - Math.abs(age - 3) * 2.5);
  const mileageScore = Math.max(0, 18 - vehicle.mileage / 8_000);
  const priceScore = vehicle.estimatedNzdPrice != null ? 10 : 0;
  const photoScore = vehicle.imageUrl ? 12 : 0;
  const accidentScore = vehicle.hasAccident === false ? 8 : vehicle.hasAccident === true ? -12 : 0;
  const modelScore = /ALPHARD|VELLFIRE|HARRIER|LAND CRUISER|PRIUS|RAV4|FIT|N-BOX|JIMNY|FORESTER|CX-5/i.test(`${vehicle.make} ${vehicle.model}`) ? 6 : 0;
  return yearScore + mileageScore + priceScore + photoScore + accidentScore + modelScore;
}

function diversifyRecommended(vehicles) {
  const ranked = [...vehicles].sort((a, b) => recommendationScore(b) - recommendationScore(a));
  const selected = [];
  const selectedIds = new Set();
  const makeCounts = new Map();
  const modelCounts = new Map();

  while (selected.length < Math.min(120, ranked.length)) {
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const vehicle of ranked) {
      if (selectedIds.has(vehicle.id)) continue;
      const modelKey = `${vehicle.make}:${vehicle.model}`;
      const score = recommendationScore(vehicle)
        - (makeCounts.get(vehicle.make) ?? 0) * 2.5
        - (modelCounts.get(modelKey) ?? 0) * 9;
      if (score > bestScore) {
        best = vehicle;
        bestScore = score;
      }
    }
    if (!best) break;
    selected.push(best);
    selectedIds.add(best.id);
    makeCounts.set(best.make, (makeCounts.get(best.make) ?? 0) + 1);
    const modelKey = `${best.make}:${best.model}`;
    modelCounts.set(modelKey, (modelCounts.get(modelKey) ?? 0) + 1);
  }

  return [...selected, ...ranked.filter((vehicle) => !selectedIds.has(vehicle.id))];
}

function selectFeatured(vehicles) {
  const candidates = vehicles.filter((vehicle) => vehicle.imageUrl && vehicle.estimatedNzdPrice != null && vehicle.hasAccident !== true);
  const selected = [];
  const usedModels = new Set();
  for (const vehicle of candidates) {
    const modelKey = `${vehicle.make}:${vehicle.model}`;
    if (usedModels.has(modelKey)) continue;
    selected.push(vehicle);
    usedModels.add(modelKey);
    if (selected.length === 8) break;
  }
  return selected;
}

const existingVehicles = loadExistingVehicles();
let rawVehicles = [];
if (inputFilePath) {
  const inputPayload = JSON.parse(fs.readFileSync(path.resolve(inputFilePath), 'utf8'));
  rawVehicles = Array.isArray(inputPayload) ? inputPayload : Array.isArray(inputPayload.results) ? inputPayload.results : [];
  console.log(`CARAPIS ${SOURCE}: building from ${rawVehicles.length.toLocaleString()} captured vehicles.`);
} else {
  const firstPage = await fetchPage(1);
  const totalPages = Number(firstPage.pages ?? Math.ceil(Number(firstPage.count ?? 0) / PAGE_SIZE));
  rawVehicles = [...(Array.isArray(firstPage.results) ? firstPage.results : [])];

  console.log(`CARAPIS ${SOURCE}: ${Number(firstPage.count ?? 0).toLocaleString()} vehicles across ${totalPages} pages.`);

  for (let page = 2; page <= totalPages; page += CONCURRENCY) {
    const pageNumbers = Array.from(
      { length: Math.min(CONCURRENCY, totalPages - page + 1) },
      (_, index) => page + index,
    );
    const payloads = await Promise.all(pageNumbers.map(fetchPage));
    for (const payload of payloads) rawVehicles.push(...(Array.isArray(payload.results) ? payload.results : []));
    const completedPage = pageNumbers.at(-1);
    if (completedPage === totalPages || completedPage % 10 < CONCURRENCY) console.log(`Fetched page ${completedPage}/${totalPages}.`);
  }
}

const refreshedAt = new Date().toISOString();
const detailResults = new Map();
if (!inputFilePath && apiKey) {
  const detailCandidates = rawVehicles.filter((raw) => {
    const id = cleanText(raw.id);
    if (!id) return false;
    const existing = existingVehicles.get(id);
    if (!existing?.photoGallerySyncedAt) return true;
    const listingUpdatedAt = Date.parse(cleanText(raw.last_seen_at));
    const galleryUpdatedAt = Date.parse(cleanText(existing.photoGallerySyncedAt));
    return Number.isFinite(listingUpdatedAt) && (!Number.isFinite(galleryUpdatedAt) || listingUpdatedAt > galleryUpdatedAt);
  });
  const remainingRequestBudget = Math.max(0, DAILY_REQUEST_BUDGET - apiRequestCount);
  const detailLimit = Math.min(detailCandidates.length, remainingRequestBudget, DETAIL_REQUEST_BUDGET);
  if (detailLimit > 0) console.log(`Fetching full photo galleries for ${detailLimit} vehicles within the ${DAILY_REQUEST_BUDGET}-request safety budget.`);

  for (let index = 0; index < detailLimit; index += CONCURRENCY) {
    const batch = detailCandidates.slice(index, Math.min(index + CONCURRENCY, detailLimit));
    const results = await Promise.allSettled(batch.map((raw) => fetchVehicleDetail(cleanText(raw.id))));
    results.forEach((result, resultIndex) => {
      const id = cleanText(batch[resultIndex].id);
      if (result.status === 'fulfilled') detailResults.set(id, result.value);
      else console.warn(`Photo gallery fetch skipped for ${id}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    });
  }
}

const vehicleMap = new Map();
for (const raw of rawVehicles) {
  const id = cleanText(raw.id);
  const vehicle = normalizeVehicle(raw, refreshedAt, existingVehicles.get(id), detailResults.get(id));
  if (vehicle) vehicleMap.set(vehicle.id, vehicle);
}

const vehicles = diversifyRecommended([...vehicleMap.values()]);
const featured = selectFeatured(vehicles);
const detailShards = new Map();
for (const vehicle of vehicles) {
  const shard = detailShardFor(vehicle.id);
  const shardVehicles = detailShards.get(shard) ?? [];
  shardVehicles.push(vehicle);
  detailShards.set(shard, shardVehicles);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const detailDir = path.join(OUTPUT_DIR, 'details');
fs.mkdirSync(detailDir, { recursive: true });

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify({
  source: 'CARAPIS · Carsensor',
  count: vehicles.length,
  refreshedAt,
  pricing: PRICING,
  vehicles: vehicles.map(vehicleSummary),
}));
fs.writeFileSync(path.join(OUTPUT_DIR, 'featured.json'), JSON.stringify({
  source: 'CARAPIS · Carsensor',
  count: vehicles.length,
  refreshedAt,
  pricing: PRICING,
  vehicles: featured.map(vehicleSummary),
}));

for (let index = 0; index < DETAIL_SHARD_COUNT; index += 1) {
  const shard = String(index).padStart(3, '0');
  fs.writeFileSync(path.join(detailDir, `${shard}.json`), JSON.stringify({
    source: 'CARAPIS · Carsensor',
    refreshedAt,
    pricing: PRICING,
    vehicles: detailShards.get(shard) ?? [],
  }));
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify({
  source: 'CARAPIS · Carsensor',
  count: vehicles.length,
  refreshedAt,
  pricing: PRICING,
  disclaimer: 'Carsensor dealer listings supplied through CARAPIS. Availability and estimated landed pricing must be confirmed before purchase.',
}));

console.log(`Japan Market updated from CARAPIS: ${vehicles.length} vehicles, ${featured.length} featured, ${DETAIL_SHARD_COUNT} detail shards, ${apiRequestCount} API requests.`);
