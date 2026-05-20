import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IMPORT_DIR = path.join(ROOT, 'data', 'imports');
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data');
const OUTPUT_DIR = path.join(PUBLIC_DATA_DIR, 'jpauc-paged');
const SHARD_SIZE = 200;
const PAGE_SIZE = 20;
const DEFAULT_PUBLIC_MAX_VEHICLES = 0;
const publicMaxVehicles = Number(process.env.JPAUC_PUBLIC_MAX_VEHICLES ?? DEFAULT_PUBLIC_MAX_VEHICLES);

const feeds = [
  {
    key: 'auction',
    sourceFile: path.join(IMPORT_DIR, 'jpauc-vehicles.json'),
    sourceName: 'jpauc',
    fallbackBaseUrl: 'https://jpauc.com',
    makerModelColumn: 4,
  },
  {
    key: 'oneprice_japan',
    sourceFile: path.join(IMPORT_DIR, 'jpauc-oneprice-japan-vehicles.json'),
    sourceName: 'jpauc-oneprice-japan',
    fallbackBaseUrl: 'https://jpauc.com/oneprice',
    makerModelColumn: 3,
  },
];

const MULTI_WORD_MAKES = ['MERCEDES BENZ', 'LAND ROVER', 'ALFA ROMEO', 'ASTON MARTIN', 'ROLLS ROYCE'];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function uniq(items) {
  return Array.from(new Set(items.map(normalizeText).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function parseMakerModel(value) {
  const normalized = normalizeText(value);
  if (!normalized) return { maker: '', model: '' };

  const upper = normalized.toUpperCase();
  const multiWordMake = MULTI_WORD_MAKES.find(
    (make) => upper === make || upper.startsWith(`${make} `)
  );

  if (multiWordMake) {
    return {
      maker: multiWordMake,
      model: normalizeText(normalized.slice(multiWordMake.length)),
    };
  }

  const [maker = '', ...modelParts] = normalized.split(' ');
  const model = normalizeText(modelParts.join(' '));
  return {
    maker: normalizeText(maker),
    model: model.startsWith(`${maker} `) ? normalizeText(model.slice(maker.length)) : model,
  };
}

function normalizeVehicle(vehicle, makerModelColumn) {
  const parsed = parseMakerModel(vehicle.rawColumns?.[makerModelColumn] || `${vehicle.maker || ''} ${vehicle.model || ''}`);
  return {
    ...vehicle,
    maker: parsed.maker || vehicle.maker || '',
    model: parsed.model || vehicle.model || '',
  };
}

function addNestedOption(target, firstKey, secondKey, value) {
  const first = normalizeText(firstKey);
  const second = normalizeText(secondKey);
  const normalizedValue = normalizeText(value);
  if (!first || !normalizedValue) return;

  target[first] ??= {};
  if (!second) {
    target[first].__all ??= [];
    target[first].__all.push(normalizedValue);
    return;
  }

  target[first][second] ??= [];
  target[first][second].push(normalizedValue);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
}

for (const feed of feeds) {
  if (!fs.existsSync(feed.sourceFile)) {
    console.warn(`Skipping ${feed.key}: missing ${feed.sourceFile}`);
    continue;
  }

  const sourcePayload = JSON.parse(fs.readFileSync(feed.sourceFile, 'utf8'));
  const sourceVehicles = Array.isArray(sourcePayload.vehicles)
    ? sourcePayload.vehicles.map((vehicle) => normalizeVehicle(vehicle, feed.makerModelColumn))
    : [];
  const vehicles =
    publicMaxVehicles > 0 ? sourceVehicles.slice(0, publicMaxVehicles) : sourceVehicles;
  const feedOutputDir = path.join(OUTPUT_DIR, feed.key);
  const shardOutputDir = path.join(feedOutputDir, 'shards');
  const modelByMake = {};
  const modelCodeByMakeModel = {};

  fs.rmSync(feedOutputDir, { recursive: true, force: true });
  fs.mkdirSync(shardOutputDir, { recursive: true });

  vehicles.forEach((vehicle) => {
    addNestedOption(modelByMake, vehicle.maker, '', vehicle.model);
    addNestedOption(modelCodeByMakeModel, vehicle.maker, vehicle.model, vehicle.modelCode);
  });

  for (let index = 0; index < vehicles.length; index += SHARD_SIZE) {
    const shardNumber = Math.floor(index / SHARD_SIZE) + 1;
    const shardVehicles = vehicles.slice(index, index + SHARD_SIZE).map((vehicle, offset) => ({
      ...vehicle,
      absoluteIndex: index + offset,
    }));

    writeJson(path.join(shardOutputDir, `${shardNumber}.json`), {
      shard: shardNumber,
      startIndex: index,
      shardSize: SHARD_SIZE,
      vehicles: shardVehicles,
    });
  }

  const indexVehicles = vehicles.map((vehicle, absoluteIndex) => ({
    absoluteIndex,
    id: vehicle.id || '',
    maker: vehicle.maker || '',
    model: vehicle.model || '',
    modelGrade: vehicle.modelGrade || '',
    year: vehicle.year || '',
    modelCode: vehicle.modelCode || '',
    transmission: vehicle.transmission || '',
    mileage: vehicle.mileage || '',
    color: vehicle.color || '',
    cc: vehicle.cc || '',
    auctionGrade: vehicle.auctionGrade || '',
    startPrice: vehicle.startPrice || '',
    endPrice: vehicle.endPrice || '',
    status: vehicle.status || '',
    location: vehicle.location || '',
    lotNo: vehicle.lotNo || '',
    titleFull: vehicle.titleFull || '',
  }));

  writeJson(path.join(feedOutputDir, 'index.json'), {
    source: sourcePayload.source || feed.sourceName,
    count: vehicles.length,
    shardSize: SHARD_SIZE,
    pageSize: PAGE_SIZE,
    vehicles: indexVehicles,
  });

  writeJson(path.join(feedOutputDir, 'manifest.json'), {
    source: sourcePayload.source || feed.sourceName,
    scrapedAt: sourcePayload.scrapedAt || '',
    count: vehicles.length,
    listingBaseUrl: sourcePayload.listingBaseUrl || feed.fallbackBaseUrl,
    shardSize: SHARD_SIZE,
    pageSize: PAGE_SIZE,
    shardCount: Math.ceil(vehicles.length / SHARD_SIZE),
    pageCount: Math.max(1, Math.ceil(vehicles.length / PAGE_SIZE)),
    settings: sourcePayload.settings || { maxPages: 0, maxVehicles: 0, detailConcurrency: 0 },
    options: {
      maker: uniq(vehicles.map((item) => item.maker)),
      model: uniq(vehicles.map((item) => item.model)),
      modelCode: uniq(vehicles.map((item) => item.modelCode)),
      modelByMake: Object.fromEntries(
        Object.entries(modelByMake).map(([maker, groups]) => [maker, uniq(groups.__all || [])])
      ),
      modelCodeByMakeModel: Object.fromEntries(
        Object.entries(modelCodeByMakeModel).map(([maker, modelGroups]) => [
          maker,
          Object.fromEntries(
            Object.entries(modelGroups).map(([model, codes]) => [model, uniq(codes)])
          ),
        ])
      ),
      year: uniq(vehicles.map((item) => item.year)).sort((a, b) => Number(b || 0) - Number(a || 0)),
      color: uniq(vehicles.map((item) => item.color)),
      cc: uniq(vehicles.map((item) => item.cc)),
      auctionGrade: uniq(vehicles.map((item) => item.auctionGrade)),
    },
  });

  console.log(
    `${feed.key}: wrote ${vehicles.length} of ${sourceVehicles.length} vehicles into ${Math.ceil(
      vehicles.length / SHARD_SIZE
    )} shards`
  );
}
