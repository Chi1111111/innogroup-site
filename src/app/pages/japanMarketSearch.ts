import { slugifyVehicleValue, type JapanMarketVehicleSummary, type JapanMarketFuelType, type JapanMarketBodyType } from '../../data/japanMarket';

export const PRIMARY_MAKES = ['Toyota', 'Lexus', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche'];
export const FUEL_TYPES: JapanMarketFuelType[] = ['Petrol', 'Hybrid', 'PHEV', 'EV', 'Diesel', 'Other'];
export const BODY_TYPES: JapanMarketBodyType[] = ['Sedan', 'SUV', 'Hatchback', 'Wagon', 'Coupe', 'Van / MPV', 'Sports', 'Other'];
export const PAGE_SIZE = 24;
export const PRICE_OPTIONS = [
  { value: 'under20', en: 'Under $20,000', zh: '$20,000 以下', min: 0, max: 20000 },
  { value: '20to30', en: '$20,000 – $30,000', zh: '$20,000 – $30,000', min: 20000, max: 30000 },
  { value: '30to40', en: '$30,000 – $40,000', zh: '$30,000 – $40,000', min: 30000, max: 40000 },
  { value: '40to50', en: '$40,000 – $50,000', zh: '$40,000 – $50,000', min: 40000, max: 50000 },
  { value: '50to70', en: '$50,000 – $70,000', zh: '$50,000 – $70,000', min: 50000, max: 70000 },
  { value: 'over70', en: '$70,000+', zh: '$70,000 以上', min: 70000, max: Infinity },
];
export const SORT_OPTIONS = [
  { value: 'recommended', en: 'Recommended', zh: '推荐排序' },
  { value: 'price-asc', en: 'Price: low to high', zh: '价格：从低到高' },
  { value: 'price-desc', en: 'Price: high to low', zh: '价格：从高到低' },
  { value: 'year', en: 'Year: newest first', zh: '年份：从新到旧' },
  { value: 'mileage', en: 'Mileage: low to high', zh: '里程：从低到高' },
  { value: 'newest', en: 'Recently updated', zh: '最近更新' },
];
export interface MarketFilters {
  q: string; make: string; model: string; yearFrom: string; yearTo: string;
  price: string; mileage: string; fuels: JapanMarketFuelType[]; bodies: JapanMarketBodyType[]; sort: string;
}
export const EMPTY_FILTERS: MarketFilters = { q: '', make: '', model: '', yearFrom: '', yearTo: '', price: '', mileage: '', fuels: [], bodies: [], sort: 'recommended' };
const primaryMakes = new Set(PRIMARY_MAKES);
const values = <T extends string>(value: string | null, allowed: T[]): T[] => [...new Set((value ?? '').split(',').filter((item): item is T => allowed.includes(item as T)))];
function year(value: string | null) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1900 && n <= new Date().getFullYear() + 1 ? String(n) : '';
}
export function readMarketFilters(params: URLSearchParams, vehicles?: JapanMarketVehicleSummary[], makeSlug = '', modelSlug = ''): MarketFilters {
  const pathMake = vehicles?.find((v) => slugifyVehicleValue(v.make) === makeSlug)?.make ?? '';
  let make = params.get('make') ?? pathMake;
  const invalidMake = vehicles && make && make !== 'Other' && !vehicles.some((v) => v.make === make);
  if (invalidMake) make = '';
  const pathModel = vehicles?.find((v) => v.make === make && slugifyVehicleValue(v.model) === modelSlug)?.model ?? '';
  let model = invalidMake ? '' : params.get('model') ?? pathModel;
  if (vehicles && model && !vehicles.some((v) => v.model === model && (!make || (make === 'Other' ? !primaryMakes.has(v.make) : v.make === make)))) model = '';
  let yearFrom = year(params.get('yearFrom'));
  let yearTo = year(params.get('yearTo'));
  if (yearFrom && yearTo && Number(yearFrom) > Number(yearTo)) [yearFrom, yearTo] = [yearTo, yearFrom];
  return {
    q: (params.get('q') ?? '').slice(0, 200), make, model, yearFrom, yearTo,
    price: PRICE_OPTIONS.find((option) => option.value === params.get('price'))?.value ?? '',
    mileage: ['20000', '40000', '60000', '100000'].includes(params.get('mileage') ?? '') ? params.get('mileage')! : '',
    fuels: values(params.get('fuels'), FUEL_TYPES), bodies: values(params.get('bodies'), BODY_TYPES),
    sort: SORT_OPTIONS.find((option) => option.value === params.get('sort'))?.value ?? 'recommended',
  };
}
export function marketSearchParams(filters: MarketFilters, page = 1) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const serialized = Array.isArray(value) ? value.join(',') : value;
    if (serialized && !(key === 'sort' && serialized === 'recommended')) params.set(key, serialized);
  }
  if (page > 1) params.set('page', String(page));
  return params;
}
export function filterMarketVehicles(vehicles: JapanMarketVehicleSummary[], filters: MarketFilters) {
  const tokens = filters.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const price = PRICE_OPTIONS.find((option) => option.value === filters.price);
  const matches = vehicles.filter((v) => {
    if (filters.make === 'Other' && primaryMakes.has(v.make)) return false;
    if (filters.make && filters.make !== 'Other' && v.make !== filters.make) return false;
    if (filters.model && v.model !== filters.model) return false;
    if (tokens.length && !tokens.every((token) => `${v.year} ${v.make} ${v.model} ${v.variant}`.toLowerCase().includes(token))) return false;
    if (filters.yearFrom && v.year < Number(filters.yearFrom)) return false;
    if (filters.yearTo && v.year > Number(filters.yearTo)) return false;
    if (price && (v.estimatedNzdPrice == null || v.estimatedNzdPrice < price.min || v.estimatedNzdPrice >= price.max)) return false;
    if (filters.mileage && v.mileage >= Number(filters.mileage)) return false;
    if (filters.fuels.length && !filters.fuels.includes(v.fuelType)) return false;
    return !filters.bodies.length || filters.bodies.includes(v.bodyType);
  });
  return matches.sort((a, b) => {
    if (filters.sort === 'price-asc' || filters.sort === 'price-desc') {
      if (a.estimatedNzdPrice == null) return b.estimatedNzdPrice == null ? 0 : 1;
      if (b.estimatedNzdPrice == null) return -1;
      return (a.estimatedNzdPrice - b.estimatedNzdPrice) * (filters.sort === 'price-asc' ? 1 : -1);
    }
    if (filters.sort === 'year') return b.year - a.year;
    if (filters.sort === 'mileage') return a.mileage - b.mileage;
    if (filters.sort === 'newest') return (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0);
    return 0;
  });
}
export function marketPage(value: string | null, count: number) {
  const requested = Number(value);
  return Math.min(Math.max(1, Math.ceil(count / PAGE_SIZE)), Number.isSafeInteger(requested) ? Math.max(1, requested) : 1);
}
