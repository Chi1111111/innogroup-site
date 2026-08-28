import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_FILES = [
  { file: path.join(ROOT, 'data', 'imports', 'jpauc-vehicles.json'), fixedPrice: false },
  { file: path.join(ROOT, 'data', 'imports', 'jpauc-oneprice-japan-vehicles.json'), fixedPrice: true },
];
const OUTPUT_DIR = path.join(ROOT, 'public', 'data', 'japan-market');
const DETAIL_SHARD_COUNT = 128;

const PRICING = {
  nzdPerJpy: Number(process.env.JAPAN_MARKET_NZD_PER_JPY ?? 0.0114),
  serviceFeeNzd: Number(process.env.JAPAN_MARKET_SERVICE_FEE_NZD ?? 2500),
  shippingNzd: Number(process.env.JAPAN_MARKET_SHIPPING_NZD ?? 3200),
  complianceNzd: Number(process.env.JAPAN_MARKET_COMPLIANCE_NZD ?? 1450),
  registrationNzd: Number(process.env.JAPAN_MARKET_REGISTRATION_NZD ?? 650),
  emissionsNzd: Number(process.env.JAPAN_MARKET_EMISSIONS_NZD ?? 0),
  gstRate: Number(process.env.JAPAN_MARKET_GST_RATE ?? 0.15),
};

const MAKE_LABELS = new Map([
  ['ALFA ROMEO', 'Alfa Romeo'],
  ['ASTON MARTIN', 'Aston Martin'],
  ['BMW', 'BMW'],
  ['BYD', 'BYD'],
  ['LAND ROVER', 'Land Rover'],
  ['LEXUS', 'Lexus'],
  ['MERCEDES BENZ', 'Mercedes-Benz'],
  ['MERCEDES-BENZ', 'Mercedes-Benz'],
  ['MG', 'MG'],
  ['MINI', 'MINI'],
  ['NISSAN', 'Nissan'],
  ['PORSCHE', 'Porsche'],
  ['ROLLS ROYCE', 'Rolls-Royce'],
  ['SUBARU', 'Subaru'],
  ['TOYOTA', 'Toyota'],
]);

const SPORTS_MODELS = /\b(86|GR86|BRZ|GT-?R|SUPRA|RX-?7|ROADSTER|MX-?5|FAIRLADY|CAYMAN|BOXSTER|911|MUSTANG|CORVETTE|NSX|S2000)\b/i;
const MPV_MODELS = /\b(ALPHARD|VELLFIRE|VOXY|NOAH|SERENA|ELGRAND|STEPWGN|ODYSSEY|FREED|ESTIMA|HIACE|CARAVAN|NV200|ATRAI|EVERY|CLIPPER|VAN|TRUCK|MPV|MINIVAN)\b/i;
const SUV_MODELS = /\b(SUV|HARRIER|LAND CRUISER|PRADO|RAV4|BZ4X|C-HR|COROLLA CROSS|COUNTRY\s*MA(?:N)?|CROSSOVER|PACEMAN|CX-[3-9]|FORESTER|X-TRAIL|OUTLANDER|ECLIPSE CROSS|CR-V|ZR-V|VEZEL|KICKS|JIMNY|WRANGLER|CAYENNE|Q[2-9]|GL[ABCES]|X[1-7]|RX|NX|UX|GX|LX)\b/i;
const WAGON_MODELS = /\b(WAGON|TOURING|SHOOTING BRAKE|LEVORG|OUTBACK|AVANTE|ESTATE|FIELDER|SHUTTLE)\b/i;
const COUPE_MODELS = /\b(COUPE|CABRIO|CONVERTIBLE)\b/i;
const HATCH_MODELS = /\b(HATCH|SPORTBACK|AQUA|FIT|NOTE|DEMIO|MAZDA2|SWIFT|YARIS|VITZ|MARCH|LEAF|PRIUS|COROLLA SPORT|CUBE|N BOX|DAYZ|ROOX|TANTO|MOVE|MIRA|TAFT|HUSTLER|SPACIA|WAGON R)\b/i;

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function titleCase(value) {
  return normalizeText(value).toLowerCase().replace(/(^|[\s/-])([a-z])/g, (_, boundary, letter) => `${boundary}${letter.toUpperCase()}`);
}

function normalizeMake(value) {
  const normalized = normalizeText(value).toUpperCase();
  return MAKE_LABELS.get(normalized) ?? titleCase(normalized);
}

function normalizeModel(value) {
  return normalizeText(value)
    .split(' ')
    .map((part) => /^(GT-R|GR86|BZ4X|E-NV200|CX-\d+|CR-V|C-HR|ZR-V|EV|SUV|NX|RX|UX|LX|IS|ES|GS|RS|NSX|MX-\d+)$/i.test(part) ? part.toUpperCase() : titleCase(part))
    .join(' ');
}

function normalizeVariant(value) {
  const cleaned = normalizeText(value)
    .replace(/^\/\s*\d*\s*/, '')
    .replace(/\bN\/A\b/gi, '')
    .replace(/[_*]+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .trim();
  return titleCase(cleaned)
    .replace(/\bEhev\b/g, 'e:HEV')
    .replace(/\bXdrive\b/g, 'xDrive')
    .replace(/\bJohn Cooper Works Country Ma\b/i, 'John Cooper Works Countryman')
    .replace(/\bShoe Tingb\b/i, 'Shooting Brake')
    .replace(/\bShoe Tingbre-?\b/i, 'Shooting Brake')
    .replace(/[-/]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTransmission(value) {
  const normalized = normalizeText(value).toUpperCase().replace(/\s+/g, '');
  if (!normalized || /^[-.]+$/.test(normalized) || /[?.]/.test(normalized) || normalized === 'N/A') return 'Not listed';
  if (normalized.includes('CVT')) return 'CVT';
  if (normalized.includes('DCT')) return 'Dual-clutch automatic';
  if (normalized.includes('AT') || /^(AT|A\/T|FAT|IAT|CAT|DAT|FA|IA|CA|DA|AGS)$/.test(normalized)) return 'Automatic';
  if (normalized.includes('MT') || /^(F|I)?\d+(F|I)?$/.test(normalized)) return 'Manual';
  return 'Not listed';
}

function numberFrom(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = Number(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function yenFrom(value) {
  return /^¥\s*[\d,]+$/.test(normalizeText(value)) ? numberFrom(value) : null;
}

function roundedHundred(value) {
  return Math.round(value / 100) * 100;
}

function landedEstimate(japanPrice) {
  if (!japanPrice) return null;
  const japanVehiclePriceNzd = Math.round(japanPrice * PRICING.nzdPerJpy);
  const gstNzd = Math.round((japanVehiclePriceNzd + PRICING.shippingNzd) * PRICING.gstRate);
  return roundedHundred(
    japanVehiclePriceNzd +
    PRICING.serviceFeeNzd +
    PRICING.shippingNzd +
    gstNzd +
    PRICING.complianceNzd +
    PRICING.registrationNzd +
    PRICING.emissionsNzd
  );
}

function fuelTypeFor(vehicle) {
  const value = `${vehicle.model} ${vehicle.modelGrade} ${vehicle.modelCode}`.toUpperCase();
  if (/\b(PHEV|PHV|PLUG[ -]?IN)\b/.test(value)) return 'PHEV';
  if (/\b(EV|BEV|ELECTRIC|E-TRON|LEAF|ARIYA|I-MIEV|BZ4X|SAKURA|E-NV200|IONIQ 5|KONA ELECTRIC|MODEL [3SXY])\b/.test(value) || /^ZAA-/.test(vehicle.modelCode ?? '') || /\bTESLA\b/.test(String(vehicle.maker ?? '').toUpperCase())) return 'EV';
  if (/\b(HYBRID|E:HEV|E-POWER|AQUA|PRIUS)\b/.test(value)) return 'Hybrid';
  if (/\b(DIESEL|D-4D|XD|TDI|CDI)\b/.test(value) || /\d{2,3}D(?:\b|S\b)/.test(value)) return 'Diesel';
  return 'Petrol';
}

function bodyTypeFor(vehicle) {
  const value = `${vehicle.model} ${vehicle.modelGrade}`;
  if (SPORTS_MODELS.test(value)) return 'Sports';
  if (MPV_MODELS.test(value)) return 'Van / MPV';
  if (SUV_MODELS.test(value)) return 'SUV';
  if (WAGON_MODELS.test(value)) return 'Wagon';
  if (COUPE_MODELS.test(value)) return 'Coupe';
  if (HATCH_MODELS.test(value)) return 'Hatchback';
  return 'Sedan';
}

function driveTypeFor(vehicle) {
  const value = `${vehicle.modelGrade} ${vehicle.modelCode}`.toUpperCase();
  if (/\b(4WD|AWD|4X4|QUATTRO|XDRIVE)\b/.test(value)) return '4WD / AWD';
  if (/\b2WD\b/.test(value)) return '2WD';
  return 'Not listed';
}

function normalizeGrade(value) {
  const normalized = normalizeText(value);
  return ['3.5', '4', '4.5', '5'].includes(normalized) ? normalized : null;
}

function normalizedVehicle(vehicle, refreshedAt, fixedPrice) {
  const rawId = normalizeText(vehicle.id);
  const rawMake = normalizeText(vehicle.maker).toUpperCase();
  const rawModel = normalizeText(vehicle.model);
  const splitMake = [
    ['MERCEDES', 'BENZ', 'Mercedes-Benz'],
    ['LAND', 'ROVER', 'Land Rover'],
    ['ALFA', 'ROMEO', 'Alfa Romeo'],
    ['ASTON', 'MARTIN', 'Aston Martin'],
    ['ROLLS', 'ROYCE', 'Rolls-Royce'],
  ].find(([maker, modelPrefix]) => rawMake === maker && new RegExp(`^${modelPrefix}\\b`, 'i').test(rawModel));
  const make = splitMake ? splitMake[2] : normalizeMake(rawMake);
  const model = normalizeModel(splitMake ? rawModel.replace(new RegExp(`^${splitMake[1]}\\s+`, 'i'), '') : rawModel);
  const year = numberFrom(vehicle.year);
  const mileage = numberFrom(vehicle.mileage);
  const japanPrice = fixedPrice ? yenFrom(vehicle.startPrice) : null;
  if (!rawId || !make || !model || !year || mileage === null || (fixedPrice && !japanPrice)) return null;

  const id = `JP${rawId.replace(/\D/g, '') || rawId}`;

  return {
    id,
    make,
    model,
    variant: normalizeVariant(vehicle.modelGrade),
    year,
    mileage,
    fuelType: fuelTypeFor(vehicle),
    engine: normalizeText(vehicle.cc).replace(/\s*cc$/i, '') || 'Not listed',
    transmission: normalizeTransmission(vehicle.transmission),
    driveType: driveTypeFor(vehicle),
    colour: titleCase(vehicle.color) || 'Not listed',
    auctionGrade: normalizeGrade(vehicle.auctionGrade),
    interiorGrade: null,
    chassisCode: normalizeText(vehicle.modelCode) || 'Not listed',
    japanPrice,
    estimatedNzdPrice: landedEstimate(japanPrice),
    bodyType: bodyTypeFor(vehicle),
    location: titleCase(vehicle.location) || 'Japan',
    status: 'Available',
    updatedAt: normalizeText(vehicle.scrapedAt) || refreshedAt,
    lastSeenAt: normalizeText(vehicle.scrapedAt) || refreshedAt,
  };
}

function recommendationScore(vehicle) {
  const age = Math.max(0, new Date().getFullYear() - vehicle.year);
  const listingAgeDays = Math.max(0, (Date.now() - Date.parse(vehicle.updatedAt)) / 86_400_000);
  const yearScore = Math.max(0, 20 - Math.abs(age - 3) * 2.5);
  const gradeScore = vehicle.auctionGrade ? Number(vehicle.auctionGrade) * 4 : 6;
  const mileageScore = Math.max(0, 12 - vehicle.mileage / 10_000);
  const priceScore = vehicle.estimatedNzdPrice != null ? 10 : 0;
  const modelScore = /CROWN|ALPHARD|VELLFIRE|HARRIER|LAND CRUISER|PRIUS|RX|NX|SKYLINE|FORESTER|CX-5|3 SERIES|C CLASS/i.test(`${vehicle.make} ${vehicle.model}`) ? 6 : 0;
  const freshnessScore = listingAgeDays <= 7 ? 24 : listingAgeDays <= 30 ? 8 : 0;
  return yearScore + gradeScore + mileageScore + priceScore + modelScore + freshnessScore;
}

function detailShardFor(id) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) % DETAIL_SHARD_COUNT;
  return String(hash).padStart(3, '0');
}

function vehicleSummary(vehicle) {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant,
    year: vehicle.year,
    mileage: vehicle.mileage,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    auctionGrade: vehicle.auctionGrade,
    estimatedNzdPrice: vehicle.estimatedNzdPrice,
    bodyType: vehicle.bodyType,
    updatedAt: vehicle.updatedAt,
  };
}

function diversifyRecommended(vehicles) {
  const ranked = [...vehicles].sort((a, b) => recommendationScore(b) - recommendationScore(a));
  const pool = ranked.slice(0, Math.min(5_000, ranked.length));
  const selected = [];
  const selectedIds = new Set();
  const counts = {
    make: new Map(),
    model: new Map(),
    year: new Map(),
    grade: new Map(),
    fuel: new Map(),
    body: new Map(),
    veryLowMileage: 0,
    unpriced: 0,
  };
  const countFor = (map, key) => map.get(key) ?? 0;
  const increment = (map, key) => map.set(key, countFor(map, key) + 1);

  while (selected.length < Math.min(96, pool.length)) {
    let best = null;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;
    for (const vehicle of pool) {
      if (selectedIds.has(vehicle.id)) continue;
      const modelKey = `${vehicle.make}:${vehicle.model}`;
      const adjustedScore = recommendationScore(vehicle)
        - countFor(counts.model, modelKey) * 10
        - countFor(counts.make, vehicle.make) * 3
        - countFor(counts.year, vehicle.year) * 2
        - countFor(counts.grade, vehicle.auctionGrade ?? 'Unrated') * 1.5
        - countFor(counts.fuel, vehicle.fuelType) * 0.7
        - countFor(counts.body, vehicle.bodyType) * 0.5
        - (vehicle.mileage < 1_000 ? counts.veryLowMileage * 1.5 : 0)
        - (vehicle.estimatedNzdPrice == null ? counts.unpriced * 1.5 : 0);
      if (adjustedScore > bestAdjustedScore) {
        best = vehicle;
        bestAdjustedScore = adjustedScore;
      }
    }
    if (!best) break;
    selected.push(best);
    selectedIds.add(best.id);
    increment(counts.make, best.make);
    increment(counts.model, `${best.make}:${best.model}`);
    increment(counts.year, best.year);
    increment(counts.grade, best.auctionGrade ?? 'Unrated');
    increment(counts.fuel, best.fuelType);
    increment(counts.body, best.bodyType);
    if (best.mileage < 1_000) counts.veryLowMileage += 1;
    if (best.estimatedNzdPrice == null) counts.unpriced += 1;
  }

  return [...selected, ...ranked.filter((vehicle) => !selectedIds.has(vehicle.id))];
}

function selectFeatured(vehicles) {
  const candidates = vehicles
    .filter((vehicle) => vehicle.estimatedNzdPrice != null && vehicle.year >= 2018 && vehicle.mileage <= 90_000 && Number(vehicle.auctionGrade ?? 0) >= 4)
    .sort((a, b) => recommendationScore(b) - recommendationScore(a));
  const selected = [];
  const usedModels = new Set();
  const preferredMakes = ['Lexus', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'BMW', 'Mercedes-Benz', 'Mitsubishi'];
  for (const make of preferredMakes) {
    const vehicle = candidates.find((candidate) => candidate.make === make && !usedModels.has(`${candidate.make}:${candidate.model}`));
    if (!vehicle) continue;
    selected.push(vehicle);
    usedModels.add(`${vehicle.make}:${vehicle.model}`);
  }
  if (selected.length < 8) {
    for (const vehicle of candidates) {
      if (usedModels.has(`${vehicle.make}:${vehicle.model}`)) continue;
      selected.push(vehicle);
      usedModels.add(`${vehicle.make}:${vehicle.model}`);
      if (selected.length === 8) break;
    }
  }
  return selected;
}

for (const source of SOURCE_FILES) {
  if (!fs.existsSync(source.file)) throw new Error(`Missing Japan market source: ${source.file}`);
}

const sourcePayloads = SOURCE_FILES.map((source) => ({
  ...source,
  payload: JSON.parse(fs.readFileSync(source.file, 'utf8')),
}));
const refreshedAt = sourcePayloads
  .map((source) => normalizeText(source.payload.scrapedAt))
  .filter(Boolean)
  .sort()
  .at(-1) || new Date().toISOString();
const vehicleMap = new Map();
for (const source of sourcePayloads) {
  for (const rawVehicle of Array.isArray(source.payload.vehicles) ? source.payload.vehicles : []) {
    const vehicle = normalizedVehicle(rawVehicle, refreshedAt, source.fixedPrice);
    if (vehicle) vehicleMap.set(vehicle.id, vehicle);
  }
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
  count: vehicles.length,
  refreshedAt,
  pricing: PRICING,
  vehicles: vehicles.map(vehicleSummary),
}));
fs.writeFileSync(path.join(OUTPUT_DIR, 'featured.json'), JSON.stringify({
  count: vehicles.length,
  refreshedAt,
  pricing: PRICING,
  vehicles: featured.map(vehicleSummary),
}));
for (let index = 0; index < DETAIL_SHARD_COUNT; index += 1) {
  const shard = String(index).padStart(3, '0');
  fs.writeFileSync(path.join(detailDir, `${shard}.json`), JSON.stringify({
    refreshedAt,
    pricing: PRICING,
    vehicles: detailShards.get(shard) ?? [],
  }));
}
fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify({
  count: vehicles.length,
  refreshedAt,
  pricing: PRICING,
  disclaimer: 'Estimated landed prices may change with exchange rates, shipping, compliance requirements, vehicle condition and other import costs.',
}));

console.log(`Japan Market: wrote ${vehicles.length} searchable summaries, ${DETAIL_SHARD_COUNT} detail shards and ${featured.length} featured vehicles.`);
