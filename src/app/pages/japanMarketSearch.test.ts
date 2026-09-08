import { describe, expect, it } from 'vitest';
import type { JapanMarketVehicleSummary } from '../../data/japanMarket';
import { EMPTY_FILTERS, filterMarketVehicles, marketPage, marketSearchParams, readMarketFilters } from './japanMarketSearch';

const toyota: JapanMarketVehicleSummary = {
  id: 'toyota-1', make: 'Toyota', model: 'Alphard', variant: '2.5 Hybrid', year: 2024,
  mileage: 12000, fuelType: 'Hybrid', transmission: 'Automatic', auctionGrade: null,
  estimatedNzdPrice: 45000, bodyType: 'Van / MPV', updatedAt: '2026-09-07T12:00:00Z',
};
const vehicles: JapanMarketVehicleSummary[] = [toyota,
  { ...toyota, id: 'suzuki-1', make: 'Suzuki', model: 'Jimny', variant: '', year: 2020, mileage: 55000, estimatedNzdPrice: 28000, fuelType: 'Petrol', bodyType: 'SUV' },
  { ...toyota, id: 'unknown-price', estimatedNzdPrice: null },
];
describe('market search URL state', () => {
  it('supports make/model landing routes and explicit URL overrides', () => {
    expect(readMarketFilters(new URLSearchParams(), vehicles, 'toyota', 'alphard')).toMatchObject({ make: 'Toyota', model: 'Alphard' });
    expect(readMarketFilters(new URLSearchParams('make=Suzuki'), vehicles, 'toyota', 'alphard')).toMatchObject({ make: 'Suzuki', model: '' });
  });
  it('removes invalid brands and dependent models', () => {
    expect(readMarketFilters(new URLSearchParams('make=<garbage>&model=Alphard'), vehicles)).toMatchObject({ make: '', model: '' });
    expect(readMarketFilters(new URLSearchParams('make=Suzuki&model=Alphard'), vehicles)).toMatchObject({ make: 'Suzuki', model: '' });
  });
  it('validates unknown filter options and normalizes reversed years', () => {
    expect(readMarketFilters(new URLSearchParams('sort=evil&price=bad&yearFrom=2024&yearTo=2020&fuels=Hybrid,bad,Hybrid&mileage=NaN'), vehicles))
      .toMatchObject({ sort: 'recommended', price: '', yearFrom: '2020', yearTo: '2024', fuels: ['Hybrid'], mileage: '' });
  });
  it('round-trips search, filters and a page through a shareable URL', () => {
    const filters = { ...EMPTY_FILTERS, q: 'Toyota 2024', make: 'Toyota', model: 'Alphard', price: '40to50' };
    const params = marketSearchParams(filters, 2);
    expect(readMarketFilters(params, vehicles)).toEqual(filters);
    expect(params.get('page')).toBe('2');
    expect(marketSearchParams(EMPTY_FILTERS).toString()).toBe('');
  });
  it.each([['NaN', 1], ['-4', 1], ['2.5', 1], ['9999', 3], ['2', 2]])('bounds page %s', (value, expected) => {
    expect(marketPage(value, 55)).toBe(expected);
    expect(marketPage(value, 0)).toBe(1);
  });
});
describe('market results', () => {
  it('combines make, model, budget, fuel, year, mileage and body filters', () => {
    const filters = readMarketFilters(new URLSearchParams('make=Toyota&model=Alphard&price=40to50&yearFrom=2023&mileage=20000&fuels=Hybrid&bodies=Van+%2F+MPV'), vehicles);
    expect(filterMarketVehicles(vehicles, filters).map((v) => v.id)).toEqual(['toyota-1']);
  });
  it('makes minor brands individually searchable while retaining old Other links', () => {
    expect(filterMarketVehicles(vehicles, { ...EMPTY_FILTERS, make: 'Suzuki' }).map((v) => v.id)).toEqual(['suzuki-1']);
    expect(filterMarketVehicles(vehicles, { ...EMPTY_FILTERS, make: 'Other' }).map((v) => v.id)).toEqual(['suzuki-1']);
  });
  it('searches all keywords including year and preserves input order for recommendations', () => {
    expect(filterMarketVehicles(vehicles, { ...EMPTY_FILTERS, q: '2024 toyota hybrid' }).map((v) => v.id)).toEqual(['toyota-1', 'unknown-price']);
    expect(filterMarketVehicles(vehicles, EMPTY_FILTERS)).toEqual(vehicles);
    expect(filterMarketVehicles(vehicles, { ...EMPTY_FILTERS, q: 'no-such-car' })).toEqual([]);
  });
  it.each(['price-asc', 'price-desc'])('keeps request-only pricing last in %s without mutating source', (sort) => {
    const result = filterMarketVehicles(vehicles, { ...EMPTY_FILTERS, sort });
    expect(result.at(-1)?.id).toBe('unknown-price');
    expect(result[0].id).toBe(sort === 'price-asc' ? 'suzuki-1' : 'toyota-1');
    expect(vehicles[0].id).toBe('toyota-1');
  });
});
