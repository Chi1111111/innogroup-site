export type JapanMarketFuelType = 'Petrol' | 'Hybrid' | 'PHEV' | 'EV' | 'Diesel' | 'Other';
export type JapanMarketBodyType = 'Sedan' | 'SUV' | 'Hatchback' | 'Wagon' | 'Coupe' | 'Van / MPV' | 'Sports' | 'Other';

export interface JapanMarketVehicleSummary {
  id: string;
  source?: string;
  sourceCode?: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  mileage: number;
  fuelType: JapanMarketFuelType;
  transmission: string;
  auctionGrade: '3.5' | '4' | '4.5' | '5' | null;
  estimatedNzdPrice: number | null;
  bodyType: JapanMarketBodyType;
  sourcePriceUsd?: number | null;
  imageUrl?: string | null;
  photoCount?: number;
  hasAccident?: boolean | null;
  isNewVehicle?: boolean | null;
  isVerified?: boolean | null;
  updatedAt: string;
}

export interface JapanMarketVehicle extends JapanMarketVehicleSummary {
  engine: string;
  driveType: string;
  colour: string;
  interiorGrade: string | null;
  chassisCode: string;
  japanPrice: number | null;
  imageUrls?: string[];
  photoGallerySyncedAt?: string;
  location: string;
  status: 'Available' | 'Unavailable';
  lastSeenAt: string;
}

export interface JapanMarketPricing {
  nzdPerJpy: number;
  nzdPerUsd?: number;
  serviceFeeNzd: number;
  shippingNzd: number;
  complianceNzd: number;
  registrationNzd: number;
  emissionsNzd: number;
  gstRate: number;
}

export interface JapanMarketPayload {
  source?: string;
  count: number;
  refreshedAt: string;
  pricing: JapanMarketPricing;
  vehicles: JapanMarketVehicleSummary[];
}

interface JapanMarketDetailPayload {
  source?: string;
  refreshedAt: string;
  pricing: JapanMarketPricing;
  vehicles: JapanMarketVehicle[];
}

export interface JapanMarketVehicleResult {
  refreshedAt: string;
  pricing: JapanMarketPricing;
  vehicle: JapanMarketVehicle;
}

export interface JapanMarketCostBreakdown {
  vehiclePriceNzd: number;
  serviceFeeNzd: number;
  shippingNzd: number;
  gstNzd: number;
  complianceNzd: number;
  registrationNzd: number;
  emissionsNzd: number;
  estimatedTotalNzd: number;
}

let marketPromise: Promise<JapanMarketPayload> | null = null;
let featuredPromise: Promise<JapanMarketPayload> | null = null;
const detailPromises = new Map<string, Promise<JapanMarketDetailPayload>>();

async function fetchMarketPayload(path: string) {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Japan Market vehicles are temporarily unavailable.');
  return response.json() as Promise<JapanMarketPayload>;
}

export function loadJapanMarketData() {
  marketPromise ??= fetchMarketPayload('/data/japan-market/index.json');
  return marketPromise;
}

export function loadJapanMarketFeatured() {
  featuredPromise ??= fetchMarketPayload('/data/japan-market/featured.json');
  return featuredPromise;
}

function detailShardFor(id: string) {
  let hash = 0;
  for (const character of id.toUpperCase()) hash = (hash * 31 + character.charCodeAt(0)) % 128;
  return String(hash).padStart(3, '0');
}

export async function loadJapanMarketVehicle(id: string): Promise<JapanMarketVehicleResult | null> {
  const normalizedId = id.toUpperCase();
  const shard = detailShardFor(normalizedId);
  let promise = detailPromises.get(shard);
  if (!promise) {
    promise = fetch(`/data/japan-market/details/${shard}.json`, { headers: { Accept: 'application/json' } }).then((response) => {
      if (!response.ok) throw new Error('This vehicle is temporarily unavailable.');
      return response.json() as Promise<JapanMarketDetailPayload>;
    });
    detailPromises.set(shard, promise);
  }
  const payload = await promise;
  const vehicle = payload.vehicles.find((item) => item.id.toUpperCase() === normalizedId);
  return vehicle ? { refreshedAt: payload.refreshedAt, pricing: payload.pricing, vehicle } : null;
}

export function vehicleName(vehicle: JapanMarketVehicleSummary) {
  return `${vehicle.make} ${vehicle.model}`;
}

export function vehicleVariant(vehicle: JapanMarketVehicleSummary) {
  const variant = vehicle.variant.trim();
  if (!variant) return '';
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const model = normalize(vehicle.model);
  const normalizedVariant = normalize(variant);
  return model === normalizedVariant || model.endsWith(` ${normalizedVariant}`) ? '' : variant;
}

export function vehicleFullName(vehicle: JapanMarketVehicleSummary) {
  const variant = vehicleVariant(vehicle);
  return `${vehicle.year} ${vehicleName(vehicle)}${variant ? ` ${variant}` : ''}`;
}

export function japanMarketVehiclePath(vehicle: JapanMarketVehicleSummary) {
  return `/japan-market/${encodeURIComponent(vehicle.id)}`;
}

export function isJapanMarketVehicleId(value: string) {
  return /^JP[\w-]+$/i.test(value)
    || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function formatNzd(value: number | null | undefined, language: 'en' | 'zh' = 'en') {
  return value == null
    ? language === 'zh' ? '联系确认价格' : 'Estimate on request'
    : new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 }).format(value);
}

export function formatMileage(value: number, language: 'en' | 'zh' = 'en') {
  if (value < 1_000) return language === 'zh' ? '1,000 公里以下' : 'Under 1,000 km';
  return `${new Intl.NumberFormat('en-NZ').format(value)} km`;
}

export function formatVehicleUpdatedAt(value: string, language: 'en' | 'zh' = 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === 'zh' ? '更新时间待确认' : 'Update time pending';
  const formatted = new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-NZ', {
    day: 'numeric',
    month: language === 'zh' ? 'long' : 'short',
    year: 'numeric',
  }).format(date);
  return language === 'zh' ? `数据更新：${formatted}` : `Data updated ${formatted}`;
}

export function formatFuelType(value: JapanMarketFuelType, language: 'en' | 'zh' = 'en') {
  if (language === 'en') return value;
  return ({ Petrol: '汽油', Hybrid: '混合动力', PHEV: '插电混动', EV: '纯电', Diesel: '柴油', Other: '其他' } as const)[value];
}

export function formatTransmission(value: string, language: 'en' | 'zh' = 'en') {
  if (language === 'en') return value;
  const translations: Record<string, string> = {
    Automatic: '自动挡',
    Manual: '手动挡',
    CVT: 'CVT 无级变速',
    'Dual-clutch automatic': '双离合自动挡',
    'Semi-automatic': '半自动变速箱',
    'Not listed': '暂无信息',
  };
  return translations[value] ?? value;
}

export function formatBodyType(value: JapanMarketBodyType, language: 'en' | 'zh' = 'en') {
  if (language === 'en') return value;
  return ({
    Sedan: '轿车',
    SUV: 'SUV',
    Hatchback: '掀背车',
    Wagon: '旅行车',
    Coupe: '双门轿跑',
    'Van / MPV': '厢式车 / MPV',
    Sports: '跑车',
    Other: '其他',
  } as const)[value];
}

export function formatDriveType(value: string, language: 'en' | 'zh' = 'en') {
  if (language === 'en') return value;
  const translations: Record<string, string> = {
    '4WD / AWD': '四驱 / 全轮驱动',
    '2WD': '两驱',
    'Not listed': '暂无信息',
  };
  return translations[value] ?? value;
}

export function slugifyVehicleValue(value: string) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getCostBreakdown(vehicle: JapanMarketVehicle, pricing: JapanMarketPricing): JapanMarketCostBreakdown | null {
  if (vehicle.estimatedNzdPrice == null) return null;
  const vehiclePriceNzd = vehicle.sourcePriceUsd && pricing.nzdPerUsd
    ? Math.round(vehicle.sourcePriceUsd * pricing.nzdPerUsd)
    : vehicle.japanPrice
      ? Math.round(vehicle.japanPrice * pricing.nzdPerJpy)
      : null;
  if (vehiclePriceNzd == null) return null;
  const gstNzd = Math.round((vehiclePriceNzd + pricing.shippingNzd) * pricing.gstRate);
  return {
    vehiclePriceNzd,
    serviceFeeNzd: pricing.serviceFeeNzd,
    shippingNzd: pricing.shippingNzd,
    gstNzd,
    complianceNzd: pricing.complianceNzd,
    registrationNzd: pricing.registrationNzd,
    emissionsNzd: pricing.emissionsNzd,
    estimatedTotalNzd: vehicle.estimatedNzdPrice,
  };
}
