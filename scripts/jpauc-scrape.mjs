import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  ensureDir,
  mergeVehiclesById,
  normalizeText,
  nowIso,
  parseByPrefix,
  parseMakerModel,
  parseModelGrade,
  parsePrice,
  parseYearOnly,
  readExistingOutput,
  runWithConcurrency,
  sanitizeScrapedValue,
  toAbsoluteUrl,
} from './lib/jpauc-utils.mjs';

const ROOT = process.cwd();
const IMPORT_DIR = path.join(ROOT, 'data', 'imports');
const OUTPUT_IMPORT_FILE = path.join(IMPORT_DIR, 'jpauc-vehicles.json');
const DEBUG_DIR = path.join(ROOT, 'tmp', 'jpauc-debug');

const START_URL = 'https://jpauc.com/auction';
const DEFAULT_MAX_PAGES = 50;
const DEFAULT_START_PAGE = 1;
const DEFAULT_MAX_VEHICLES = 0;
const DEFAULT_DETAIL_CONCURRENCY = 4;
const DEFAULT_WAIT_MS = 1200;
function parseColorAndTitle(text) {
  const full = normalizeText(text);
  const match = full.match(/Color\s*:\s*(.*?)\s*Title\s*:\s*(.*)$/i);
  if (!match) {
    return { color: parseByPrefix(full, 'Color'), title: parseByPrefix(full, 'Title') };
  }

  return {
    color: normalizeText(match[1]),
    title: normalizeText(match[2]),
  };
}

async function selectAllAndNext(page, scopeSelector, inputSelector, buttonSelector) {
  await page.evaluate(
    ({ scopeSelector: scope, inputSelector: input, buttonSelector: button }) => {
      const container = document.querySelector(scope) ?? document;
      container.querySelectorAll(input).forEach((el) => {
        el.checked = true;
      });

      const submitButton = container.querySelector(button) ?? document.querySelector(button);
      if (submitButton) submitButton.click();
    },
    { scopeSelector, inputSelector, buttonSelector }
  );
}

async function openListingPage(page) {
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await selectAllAndNext(
    page,
    'form.auction-dates',
    'input[name="checkdate[]"]',
    'form.auction-dates button[name="submit"]'
  );
  await page.waitForURL('**/auction/maker**', { timeout: 30000 });

  await selectAllAndNext(
    page,
    'form',
    'input[name="mk[]"]',
    'form button[name="submit"], form .action-fixed button'
  );
  await page.waitForURL('**/auction/model**', { timeout: 30000 });

  await selectAllAndNext(
    page,
    'form',
    'input[name="md[]"]',
    'form button[name="submit"], form .action-fixed button'
  );
  await page.waitForURL('**/auction/listing**', { timeout: 120000 });
  await page.waitForTimeout(2000);
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
  const cols = (raw.cols ?? []).map(normalizeText);
  const locationLot = normalizeText(cols[3] ?? '');
  const makerModel = normalizeText(cols[4] ?? '');
  const yearGrade = normalizeText(cols[5] ?? '');
  const ccModelCode = normalizeText(cols[6] ?? '');
  const shiftMileage = normalizeText(cols[7] ?? '');
  const colorTitle = normalizeText(cols[8] ?? '');
  const gradeStart = normalizeText(cols[9] ?? '');
  const statusEnd = normalizeText(cols[10] ?? '');
  const parsedColorTitle = parseColorAndTitle(colorTitle);

  const [location, lotNo] = locationLot.split('|').map((item) => normalizeText(item));
  const parsedMakerModel = parseMakerModel(makerModel);

  return {
    id: raw.id,
    source: 'jpauc',
    scrapedAt: nowIso(),
    detailUrl: `https://jpauc.com/auction/detail/${raw.id}`,
    listingPageUrl: pageUrl,
    imageUrl: toAbsoluteUrl(raw.imageUrl, pageUrl),
    number: normalizeText(cols[0] ?? ''),
    dateTime: normalizeText(cols[2] ?? ''),
    location,
    lotNo,
    maker: parsedMakerModel.maker,
    model: parsedMakerModel.model,
    year: parseYearOnly(yearGrade),
    modelGrade: parseModelGrade(yearGrade),
    cc: normalizeText(ccModelCode.split('|')[0] ?? ''),
    modelCode: normalizeText(ccModelCode.split('|')[1] ?? ''),
    transmission: normalizeText(shiftMileage.split('|')[0] ?? ''),
    mileage: parseByPrefix(shiftMileage, '|') || normalizeText(shiftMileage.split('|')[1] ?? ''),
    color: parsedColorTitle.color,
    title: parsedColorTitle.title,
    auctionGrade: parseByPrefix(gradeStart, 'Auc.Grade'),
    startPrice: parseByPrefix(gradeStart, 'Start') || parsePrice(gradeStart),
    status: parseByPrefix(statusEnd, 'Status'),
    endPrice: parseByPrefix(statusEnd, 'End') || parsePrice(statusEnd),
    rawColumns: cols,
  };
}

async function scrapeDetail(page, record) {
  await page.goto(record.detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(600);

  const detail = await page.evaluate((current) => {
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

    const backButton = document.querySelector('.prev-next a.btn[href*="/auction/listing"]');
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
  return sanitizeScrapedValue(detail);
}

async function main() {
  const maxPages = Number(process.env.JPAUC_MAX_PAGES ?? DEFAULT_MAX_PAGES);
  const startPage = Number(process.env.JPAUC_START_PAGE ?? DEFAULT_START_PAGE);
  const maxVehicles = Number(process.env.JPAUC_MAX_VEHICLES ?? DEFAULT_MAX_VEHICLES);
  const detailConcurrency = Number(
    process.env.JPAUC_DETAIL_CONCURRENCY ?? DEFAULT_DETAIL_CONCURRENCY
  );
  const waitMs = Number(process.env.JPAUC_WAIT_MS ?? DEFAULT_WAIT_MS);
  const headless = process.env.JPAUC_HEADLESS !== 'false';
  const skipDetail = process.env.JPAUC_SKIP_DETAIL === 'true';
  const appendMode = process.env.JPAUC_APPEND_MODE !== 'false';

  ensureDir(IMPORT_DIR);
  ensureDir(DEBUG_DIR);

  console.log(
    `JPAUC scrape starting: pages ${startPage}-${maxPages}, maxVehicles=${maxVehicles || 'all'}, skipDetail=${skipDetail}, appendMode=${appendMode}`
  );

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1460, height: 920 } });
  const listingPage = await context.newPage();

  try {
    await openListingPage(listingPage);
    const listingBaseUrl = listingPage.url().split('?')[0];
    console.log(`JPAUC listing opened: ${listingBaseUrl}`);

    const seen = new Set();
    const listRecords = [];

    for (let pageIndex = Math.max(1, startPage); pageIndex <= Math.max(1, maxPages); pageIndex += 1) {
      const targetUrl =
        pageIndex === 1 ? listingBaseUrl : `${listingBaseUrl}?p=${pageIndex}`;

      await listingPage.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await listingPage.waitForTimeout(waitMs);

      const rows = await scrapeListingRows(listingPage);
      console.log(`JPAUC page ${pageIndex}: ${rows.length} rows`);
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
    if (trimmedList.length === 0) {
      throw new Error('No JPAUC vehicles found on the selected listing pages');
    }

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
    console.log(`JPAUC detail scrape finished: ${detailWorkers.length} records`);

    const existing = appendMode ? readExistingOutput(OUTPUT_IMPORT_FILE) : null;
    const vehicles = existing
      ? mergeVehiclesById(existing.vehicles, detailWorkers)
      : detailWorkers;

    const output = {
      source: 'jpauc',
      scrapedAt: nowIso(),
      count: vehicles.length,
      listingBaseUrl,
      settings: {
        maxPages,
        startPage,
        maxVehicles,
        detailConcurrency,
        appendMode,
        updateMode: appendMode ? 'append' : 'replace',
      },
      vehicles,
    };

    fs.writeFileSync(OUTPUT_IMPORT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(`JPAUC import wrote ${vehicles.length} total records`);

    await listingPage.screenshot({
      path: path.join(DEBUG_DIR, 'jpauc-listing.png'),
      fullPage: true,
    });

    console.log(`JPAUC scrape completed: ${detailWorkers.length} in this batch`);
    console.log(`Import output: ${OUTPUT_IMPORT_FILE}`);
  } catch (error) {
    if (!listingPage.isClosed()) {
      try {
        fs.writeFileSync(
          path.join(DEBUG_DIR, 'jpauc-error.html'),
          await listingPage.content(),
          'utf8'
        );
        await listingPage.screenshot({
          path: path.join(DEBUG_DIR, 'jpauc-error.png'),
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
