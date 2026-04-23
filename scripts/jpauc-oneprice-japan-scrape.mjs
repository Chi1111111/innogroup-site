import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const IMPORT_DIR = path.join(ROOT, 'data', 'imports');
const PUBLIC_DIR = path.join(ROOT, 'public', 'data');
const OUTPUT_IMPORT_FILE = path.join(IMPORT_DIR, 'jpauc-oneprice-japan-vehicles.json');
const DEBUG_DIR = path.join(ROOT, 'tmp', 'jpauc-oneprice-japan-debug');

const START_URL = 'https://jpauc.com/oneprice/location';
const DEFAULT_MAX_PAGES = 50;
const DEFAULT_START_PAGE = 1;
const DEFAULT_MAX_VEHICLES = 0;
const DEFAULT_DETAIL_CONCURRENCY = 4;
const DEFAULT_WAIT_MS = 1200;

function ensureDir(target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
}

function normalizeText(value) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function parsePrice(value) {
  const match = value.match(/[¥楼]?\s*[\d,]+/);
  return match ? normalizeText(match[0]) : '';
}

function parseByPrefix(value, prefix) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reg = new RegExp(`${escaped}\\s*:?\\s*([^|]+)`, 'i');
  const found = value.match(reg);
  return found ? normalizeText(found[1]) : '';
}

function parseYearOnly(yearGrade) {
  const found = yearGrade.match(/\b(19|20)\d{2}\b/);
  return found ? found[0] : '';
}

function parseModelGrade(yearGrade) {
  return normalizeText(yearGrade.replace(/Year:\s*(19|20)\d{2}\s*/i, ''));
}

function parseColorAndTitle(text) {
  const full = normalizeText(text);
  const match = full.match(/([A-Za-z ]+?)\s*\|\s*Seat\s*:\s*(.*)$/i);
  if (match) {
    return {
      color: normalizeText(match[1]),
      title: normalizeText(match[2]),
    };
  }

  const fallback = full.match(/Color\s*:\s*(.*?)\s*Title\s*:\s*(.*)$/i);
  if (fallback) {
    return {
      color: normalizeText(fallback[1]),
      title: normalizeText(fallback[2]),
    };
  }

  return { color: '', title: '' };
}

function toAbsoluteUrl(candidate, baseUrl) {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return '';
  }
}

function nowIso() {
  return new Date().toISOString();
}

function readExistingOutput(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.vehicles)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function mergeVehiclesById(existingVehicles, nextVehicles) {
  const merged = [];
  const byId = new Map();

  for (const item of existingVehicles) {
    if (!item?.id) continue;
    byId.set(item.id, item);
    merged.push(item);
  }

  for (const item of nextVehicles) {
    if (!item?.id) continue;
    if (byId.has(item.id)) {
      const index = merged.findIndex((current) => current.id === item.id);
      if (index >= 0) merged[index] = item;
    } else {
      merged.push(item);
    }
    byId.set(item.id, item);
  }

  return merged;
}

async function openListingPage(page) {
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Japan only (exclude Hong Kong).
  await page.check('input.checkcountry[value="Japan"]');
  await page.dispatchEvent('input.checkcountry[value="Japan"]', 'change');
  if (await page.isChecked('input.checkcountry[value="Hong Kong"]')) {
    await page.uncheck('input.checkcountry[value="Hong Kong"]');
  }
  await page.dispatchEvent('input.checkcountry[value="Hong Kong"]', 'change');

  await Promise.all([
    page.waitForURL('**/oneprice/maker**', { timeout: 30000 }),
    page.click('form button[name="submit"]'),
  ]);

  await page.evaluate(() => {
    const makers = Array.from(document.querySelectorAll('input[name="mk[]"]'));
    makers.forEach((el) => {
      el.checked = true;
    });
  });
  await Promise.all([
    page.waitForURL('**/oneprice/model**', { timeout: 30000 }),
    page.click('form button[name="submit"], form .action-fixed button'),
  ]);

  await page.evaluate(() => {
    const models = Array.from(document.querySelectorAll('input[name="md[]"]'));
    models.forEach((el) => {
      el.checked = true;
    });
  });
  await Promise.all([
    page.waitForURL('**/oneprice/listing**', { timeout: 120000 }),
    page.click('form button[name="submit"], form .action-fixed button'),
  ]);
  await page.waitForTimeout(1800);
}

async function scrapeListingRows(page) {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#cars tr[data-id]'));

    return rows.map((row) => {
      const id = row.getAttribute('data-id') ?? '';
      const cols = Array.from(row.querySelectorAll('td')).map((td) =>
        (td.textContent ?? '').replace(/\s+/g, ' ').trim()
      );
      const imageEl = row.querySelector('td.thumb img');
      const imageUrl =
        imageEl?.getAttribute('data-original') || imageEl?.getAttribute('src') || '';

      return {
        id,
        cols,
        imageUrl,
      };
    });
  });
}

function mapListingRecord(raw, pageUrl) {
  const cols = raw.cols ?? [];
  const locationLot = normalizeText(cols[2] ?? '');
  const makerModel = normalizeText(cols[3] ?? '');
  const yearGrade = normalizeText(cols[4] ?? '');
  const ccModelCode = normalizeText(cols[5] ?? '');
  const shiftMileage = normalizeText(cols[6] ?? '');
  const colorSeat = normalizeText(cols[7] ?? '');
  const conditionPrice = normalizeText(cols[8] ?? '');
  const statusCol = normalizeText(cols[9] ?? '');
  const parsedColorTitle = parseColorAndTitle(colorSeat);

  const [location, lotNo] = locationLot.split('|').map((item) => normalizeText(item));
  const [maker, ...modelParts] = makerModel.split(' ').map((item) => normalizeText(item));
  const model = normalizeText(modelParts.join(' '));

  return {
    id: raw.id,
    source: 'jpauc-oneprice-japan',
    scrapedAt: nowIso(),
    detailUrl: `https://jpauc.com/oneprice/detail/${raw.id}`,
    listingPageUrl: pageUrl,
    imageUrl: toAbsoluteUrl(raw.imageUrl, pageUrl),
    number: normalizeText(cols[0] ?? ''),
    dateTime: '',
    location,
    lotNo,
    maker,
    model,
    year: parseYearOnly(yearGrade),
    modelGrade: parseModelGrade(yearGrade),
    cc: normalizeText(ccModelCode.split('|')[0] ?? ''),
    modelCode: normalizeText(ccModelCode.split('|')[1] ?? ''),
    transmission: normalizeText(shiftMileage.split('|')[0] ?? ''),
    mileage: parseByPrefix(shiftMileage, '|') || normalizeText(shiftMileage.split('|')[1] ?? ''),
    color: parsedColorTitle.color,
    title: parsedColorTitle.title,
    auctionGrade: parseByPrefix(conditionPrice, 'Condition'),
    startPrice: parseByPrefix(conditionPrice, 'List Price') || parsePrice(conditionPrice),
    status: statusCol || 'Buy Now',
    endPrice: '',
    rawColumns: cols,
  };
}

async function scrapeDetail(page, record) {
  await page.goto(record.detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(600);

  return page.evaluate((current) => {
    const output = {
      titleFull: '',
      detailSpecs: {},
      auctionSheetUrl: '',
      galleryImages: [],
      detailRawText: '',
      sourceDetailUrl: window.location.href,
      listingBackUrl: '',
    };

    const title = document.querySelector('h1.page-title');
    output.titleFull = (title?.textContent ?? '').replace(/\s+/g, ' ').trim();

    const specCells = Array.from(document.querySelectorAll('.detail-info table.desktop-mode td'));
    for (const cell of specCells) {
      const label = cell.querySelector('.mobilelabel');
      if (!label) continue;

      const key = (label.textContent ?? '').replace(':', '').trim();
      const value = (cell.textContent ?? '')
        .replace(label.textContent ?? '', '')
        .replace(/\s+/g, ' ')
        .trim();

      if (key && value) {
        output.detailSpecs[key] = value.replace(/\s*\d+\/\s*$/, '').trim();
      }
    }

    const auctionSheet = document.querySelector('.auction-sheet a.car-image');
    if (auctionSheet) {
      output.auctionSheetUrl = auctionSheet.getAttribute('href') || '';
    }

    const gallery = Array.from(
      document.querySelectorAll('.imagecar a.car-image, .auction-sheet a.car-image, a.car-image')
    )
      .map((node) => node.getAttribute('href') || '')
      .filter(Boolean);
    output.galleryImages = Array.from(new Set(gallery));

    output.detailRawText = (document.body?.innerText ?? '').replace(/\s+/g, ' ').trim();

    const backButton = document.querySelector('.prev-next a.btn[href*="/oneprice/listing"]');
    output.listingBackUrl = backButton?.getAttribute('href') || '';

    return {
      ...current,
      ...output,
      auctionSheetUrl: output.auctionSheetUrl
        ? new URL(output.auctionSheetUrl, window.location.href).toString()
        : '',
      galleryImages: output.galleryImages.map((url) => new URL(url, window.location.href).toString()),
      listingBackUrl: output.listingBackUrl
        ? new URL(output.listingBackUrl, window.location.href).toString()
        : '',
    };
  }, record);
}

async function runWithConcurrency(items, worker, limit) {
  const outputs = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      outputs[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return outputs;
}

async function main() {
  const maxPages = Number(process.env.JPAUC_ONEPRICE_MAX_PAGES ?? DEFAULT_MAX_PAGES);
  const startPage = Number(process.env.JPAUC_ONEPRICE_START_PAGE ?? DEFAULT_START_PAGE);
  const maxVehicles = Number(process.env.JPAUC_ONEPRICE_MAX_VEHICLES ?? DEFAULT_MAX_VEHICLES);
  const detailConcurrency = Number(
    process.env.JPAUC_ONEPRICE_DETAIL_CONCURRENCY ?? DEFAULT_DETAIL_CONCURRENCY
  );
  const waitMs = Number(process.env.JPAUC_ONEPRICE_WAIT_MS ?? DEFAULT_WAIT_MS);
  const headless = process.env.JPAUC_ONEPRICE_HEADLESS !== 'false';
  const skipDetail = process.env.JPAUC_ONEPRICE_SKIP_DETAIL === 'true';

  ensureDir(IMPORT_DIR);
  ensureDir(PUBLIC_DIR);
  ensureDir(DEBUG_DIR);

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1460, height: 920 } });
  const listingPage = await context.newPage();

  try {
    await openListingPage(listingPage);
    const listingBaseUrl = listingPage.url().split('?')[0];

    const seen = new Set();
    const listRecords = [];

    for (let pageIndex = Math.max(1, startPage); pageIndex <= Math.max(1, maxPages); pageIndex += 1) {
      const targetUrl =
        pageIndex === 1 ? listingBaseUrl : `${listingBaseUrl}?p=${pageIndex}`;

      await listingPage.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await listingPage.waitForTimeout(waitMs);

      const rows = await scrapeListingRows(listingPage);
      if (rows.length === 0) break;

      let newCount = 0;
      for (const row of rows) {
        if (!row.id || seen.has(row.id)) continue;
        seen.add(row.id);
        listRecords.push(mapListingRecord(row, targetUrl));
        newCount += 1;
      }

      if (newCount === 0) break;
      if (maxVehicles > 0 && listRecords.length >= maxVehicles) break;
    }

    const trimmedList = maxVehicles > 0 ? listRecords.slice(0, maxVehicles) : listRecords;
    const detailWorkers = skipDetail
      ? trimmedList
      : await runWithConcurrency(
          trimmedList,
          async (record) => {
            const page = await context.newPage();
            try {
              return await scrapeDetail(page, record);
            } finally {
              await page.close();
            }
          },
          detailConcurrency
        );

    const vehicles = detailWorkers;

    const output = {
      source: 'jpauc-oneprice-japan',
      scrapedAt: nowIso(),
      count: vehicles.length,
      listingBaseUrl,
      settings: {
        maxPages,
        startPage,
        maxVehicles,
        detailConcurrency,
        updateMode: 'replace',
      },
      vehicles,
    };

    fs.writeFileSync(OUTPUT_IMPORT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

    await listingPage.screenshot({
      path: path.join(DEBUG_DIR, 'jpauc-oneprice-listing.png'),
      fullPage: true,
    });

    console.log(`JPAUC one price (Japan) scrape completed: ${detailWorkers.length} in this batch`);
    console.log(`Import output: ${OUTPUT_IMPORT_FILE}`);
  } catch (error) {
    if (!listingPage.isClosed()) {
      try {
        fs.writeFileSync(
          path.join(DEBUG_DIR, 'jpauc-oneprice-error.html'),
          await listingPage.content(),
          'utf8'
        );
        await listingPage.screenshot({
          path: path.join(DEBUG_DIR, 'jpauc-oneprice-error.png'),
          fullPage: true,
        });
      } catch {
        // Ignore secondary debug-capture failures when browser/page already closed.
      }
    }

    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    if (context) {
      try {
        await context.close();
      } catch {
        // Ignore close race conditions on interrupted runs.
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close race conditions on interrupted runs.
      }
    }
  }
}

await main();

