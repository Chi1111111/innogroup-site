import { load } from 'cheerio';
import { vehicleQualityIssue } from '../../src/data/japanMarketQuality.mjs';

export const ORIGIN = 'https://www.japancars.co.jp';
export const SOURCE = 'Japan Cars';
export function applyResponseCookies(jar, headers, now = Date.now()) {
  for (const cookie of headers) {
    const pair = cookie.split(';')[0]; const i = pair.indexOf('=');
    if (i <= 0) continue;
    const key = pair.slice(0,i);
    const expires = cookie.match(/;\s*expires=([^;]+)/i)?.[1];
    const maxAge = cookie.match(/;\s*max-age=(-?\d+)/i)?.[1];
    if ((maxAge != null && Number(maxAge) <= 0) || (maxAge == null && expires && Date.parse(expires) <= now)) jar.delete(key);
    else jar.set(key, pair.slice(i+1));
  }
}
const clean = (s) => String(s ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const numeric = (s) => /^\d[\d,.]*(?:\s*(?:KM|CC))?$/i.test(clean(s)) ? Number(clean(s).replace(/[^\d.]/g, '')) : null;
const missing = (s) => !s || /^[-–\s]+$/.test(s);
export function sourceUrl(value) {
  try { const url = new URL(value, ORIGIN); return url.origin === ORIGIN && url.pathname.startsWith('/stock-detail/') ? url.href : null; } catch { return null; }
}
export function photoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !/loading|no[-_]?image|placeholder/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
export function readRates(html) {
  const $ = load(html); const rates = {};
  $('#changeCurrId option, #changeCurr option').each((_, option) => {
    const code = clean($(option).text()); const rate = Number($(option).attr('value'));
    if (/^[A-Z]{3}$/.test(code) && rate > 0) rates[code] = rate;
  });
  if (!(rates.NZD > 0)) throw new Error('Source NZD exchange rate is missing.');
  return rates;
}
export function readListing(html) {
  const $ = load(html); const rows = [];
  $('.stock_list.vehicle_redirect').each((_, el) => {
    const card = $(el); const url = sourceUrl(card.find('.vehicle_detail_url').attr('value'));
    const code = clean(card.find('.listingStock--number a').first().text());
    const location = clean(card.find('.listingStock--number .font_normal').text());
    const status = clean(card.find('[class*="ribbon"] span').first().text());
    const heading = clean(card.find('.stockListHeading').text());
    const image = card.find('.list_images img').first();
    if (url && code) rows.push({ sourceUrl: url, stockNumber: code, location, status, heading, imageUrl: photoUrl(image.attr('data-src') || image.attr('src')) });
  });
  const count = numeric($('.total_stock_count').first().text());
  return { rows, count };
}
export function readFob($, rates) {
  const price = $('.stock-price.mainPrice').first();
  const kind = clean(price.attr('data-pricetype') || $('.fob_resp').first().text().replace(/[:：]/g, '')).toUpperCase();
  const raw = numeric(price.attr('data-price'));
  const conversion = Number(price.attr('data-conversion-rate'));
  const currency = clean(price.attr('data-vehiclecurrency'));
  const ask = price.attr('data-isask') === '1' || /\bASK\b/i.test(price.text());
  // Owner's pricing policy: display source vehicle-only prices as FOB, retaining the original type for audit.
  // Never use CIF/CFR totals as vehicle-only FOB prices.
  const valid = ['FOB', 'CAR PRICE', 'CARPRICE', 'BODY'].includes(kind) && !ask && raw > 0 && conversion > 0 && rates.NZD > 0;
  // Match the source detail page: round to an integer, then to the nearest ten.
  const fobPriceNzd = valid ? Math.round(Math.round(Number((raw / conversion * rates.NZD).toFixed(4))) / 10) * 10 : null;
  return { fobPriceNzd: fobPriceNzd > 0 ? fobPriceNzd : null, sourcePriceType: kind || 'Unknown', sourcePriceAmount: raw, sourcePriceCurrency: currency || null, sourceConversionRate: conversion > 0 ? conversion : null, nzdExchangeRate: rates.NZD };
}
const bodyType = (s) => {
  if (/SUV|pickup/i.test(s)) return 'SUV';
  if (/van|bus/i.test(s)) return 'Van / MPV';
  if (/hatch/i.test(s)) return 'Hatchback';
  if (/wagon/i.test(s)) return 'Wagon';
  if (/coupe|convertible/i.test(s)) return 'Coupe';
  if (/sport/i.test(s)) return 'Sports';
  return /sedan/i.test(s) ? 'Sedan' : 'Other';
};
export function readDetail(html, row, refreshedAt) {
  const $ = load(html); const specs = {};
  $('tr').each((_, tr) => {
    const cells = $(tr).children('td,th');
    if (cells.length === 2) specs[clean(cells.eq(0).text()).replace(/:$/, '').toLowerCase()] = clean(cells.eq(1).text());
  });
  $('li:has(.stockdetailInfo)').each((_, li) => { specs[clean($(li).find('strong').text()).toLowerCase()] = clean($(li).find('.stockdetailInfo').text()); });
  const value = (...keys) => keys.map((key) => specs[key]).find((v) => !missing(v)) || 'Not listed';
  const stockNumber = value('stock no.', 'stock no');
  if (stockNumber !== row.stockNumber) throw new Error('Vehicle identity mismatch.');
  const yearText = value('reg. year/m', 'mfg. year/m');
  const year = Number(yearText.match(/\b(19|20)\d{2}\b/)?.[0]);
  const fuel = value('fuel');
  const fuelType = /plug|phev/i.test(fuel) ? 'PHEV' : /hybrid/i.test(fuel) ? 'Hybrid' : /electric|^EV$/i.test(fuel) ? 'EV' : /diesel/i.test(fuel) ? 'Diesel' : /petrol|gasoline/i.test(fuel) ? 'Petrol' : 'Other';
  let images = [];
  const array = html.match(/window\.allImages\s*=\s*(\[[^;]*\]);/);
  if (array) {
    try { images = JSON.parse(array[1]).map((image) => photoUrl(image.l || image.s)).filter(Boolean); } catch { throw new Error('Malformed gallery data.'); }
  }
  if (!images.length) $('img[data-magnify-src]').each((_, image) => { const url = photoUrl($(image).attr('data-magnify-src')); if (url) images.push(url); });
  images = [...new Set(images)];
  const pricing = readFob($, readRates(html));
  const status = clean($('[class*="ribbon"] span').first().text()) || row.status;
  const heading = clean($('h1').first().text());
  const locationText = clean($('.top_location li').first().text());
  const vehicle = {
    id: `JPJC-${stockNumber.toUpperCase()}`, source: SOURCE, sourceCode: 'japancars', stockNumber,
    sourceUrl: row.sourceUrl, make: value('make'), model: value('model'), variant: value('grade') === 'Not listed' ? '' : value('grade'),
    year, mileage: numeric(value('mileage')), fuelType, transmission: value('transmission'),
    auctionGrade: null, estimatedNzdPrice: null, sourcePriceUsd: null, ...pricing, priceBasis: 'FOB', priceCurrency: 'NZD', priceCheckedAt: refreshedAt,
    bodyType: bodyType(value('type')), imageUrl: images[0] || row.imageUrl || null, imageUrls: images,
    photoCount: images.length, photoGallerySyncedAt: refreshedAt, hasAccident: null, isNewVehicle: null, isVerified: null,
    updatedAt: refreshedAt, lastSeenAt: refreshedAt, engine: value('engine').replace(/\s*CC$/i, ''), driveType: value('wheel drive'),
    colour: value('color'), interiorGrade: value('int. grade') === 'Not listed' ? null : value('int. grade'), chassisCode: value('model code'),
    japanPrice: null, location: 'Japan', status: /sold|reserved|pending|unavailable|on order/i.test(status) ? 'Unavailable' : 'Available',
  };
  if (row.location !== 'Japan') return { vehicle, issue: 'outside_japan' };
  if (!heading || !specs.make || !specs.model) return { vehicle, issue: 'invalid_detail' };
  // Location is selected on the listing and identity checked on the detail; don't infer it from the site name.
  if (locationText && !/^Japan\b/i.test(locationText)) return { vehicle, issue: 'outside_japan' };
  const issue = vehicleQualityIssue(vehicle) || (vehicle.make === 'Not listed' || vehicle.model === 'Not listed' ? 'invalid_detail' : null)
    || (vehicle.status !== 'Available' ? 'unavailable' : null);
  return { vehicle, issue };
}
export function summary(vehicle) {
  const { imageUrls, engine, driveType, colour, interiorGrade, chassisCode, japanPrice, location, status, lastSeenAt, photoGallerySyncedAt, ...rest } = vehicle;
  return rest;
}
export function shardFor(id) { let hash = 0; for (const c of id.toUpperCase()) hash = (hash * 31 + c.charCodeAt(0)) % 128; return String(hash).padStart(3, '0'); }
