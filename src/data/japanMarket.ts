export type JapanMarketFuelType = 'Petrol' | 'Hybrid' | 'PHEV' | 'EV' | 'Diesel';
export type JapanMarketBodyType = 'Sedan' | 'SUV' | 'Hatchback' | 'Wagon' | 'Coupe' | 'Van / MPV' | 'Sports';

export interface JapanMarketVehicleSummary {
  id: string;
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
  updatedAt: string;
}

export interface JapanMarketVehicle extends JapanMarketVehicleSummary {
  engine: string;
  driveType: string;
  colour: string;
  interiorGrade: string | null;
  chassisCode: string;
  japanPrice: number | null;
  location: string;
  status: 'Available' | 'Unavailable';
  lastSeenAt: string;
}

export interface JapanMarketPricing {
  nzdPerJpy: number;
  serviceFeeNzd: number;
  shippingNzd: number;
  complianceNzd: number;
  registrationNzd: number;
  emissionsNzd: number;
  gstRate: number;
}

export interface JapanMarketPayload {
  count: number;
  refreshedAt: string;
  pricing: JapanMarketPricing;
  vehicles: JapanMarketVehicleSummary[];
}

interface JapanMarketDetailPayload {
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
  japanVehiclePriceNzd: number;
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

export function vehicleFullName(vehicle: JapanMarketVehicleSummary) {
  return `${vehicle.year} ${vehicleName(vehicle)}${vehicle.variant ? ` ${vehicle.variant}` : ''}`;
}

export function japanMarketVehiclePath(vehicle: JapanMarketVehicleSummary) {
  return `/japan-market/${encodeURIComponent(vehicle.id)}`;
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

export function slugifyVehicleValue(value: string) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getCostBreakdown(vehicle: JapanMarketVehicle, pricing: JapanMarketPricing): JapanMarketCostBreakdown | null {
  if (!vehicle.japanPrice || vehicle.estimatedNzdPrice == null) return null;
  const japanVehiclePriceNzd = Math.round(vehicle.japanPrice * pricing.nzdPerJpy);
  const gstNzd = Math.round((japanVehiclePriceNzd + pricing.shippingNzd) * pricing.gstRate);
  return {
    japanVehiclePriceNzd,
    serviceFeeNzd: pricing.serviceFeeNzd,
    shippingNzd: pricing.shippingNzd,
    gstNzd,
    complianceNzd: pricing.complianceNzd,
    registrationNzd: pricing.registrationNzd,
    emissionsNzd: pricing.emissionsNzd,
    estimatedTotalNzd: vehicle.estimatedNzdPrice,
  };
}
