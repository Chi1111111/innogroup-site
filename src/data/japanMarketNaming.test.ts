import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeVehicleIdentity, vehicleModelLabel } from './japanMarketNaming';
import { loadJapanMarketPage, loadJapanMarketVehicle, publicJapanMarketVehicle, vehicleFullName, vehicleName, vehicleVariant, type JapanMarketVehicleSummary } from './japanMarket';

const base: JapanMarketVehicleSummary = {
  id: 'JPJC-NAMING', make: 'Toyota', model: 'Alphard', variant: '', year: 2023,
  mileage: 12000, fuelType: 'Hybrid', transmission: 'Automatic', auctionGrade: null,
  bodyType: 'SUV', updatedAt: '2026-10-29', sourceCode: 'japancars',
  fobPriceNzd: 28400, sourcePriceType: 'FOB', priceBasis: 'FOB', priceCurrency: 'NZD',
};

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('source vehicle names', () => {
  it.each([
    ['Toyota', 'Lexus Rx350h', 'Lexus', 'RX350h'],
    ['Toyota', 'Toyota Lexus Rx350h F Sport', 'Lexus', 'RX350h F Sport'],
    ['Lexus', 'Lexus NX 450H+ F Sport', 'Lexus', 'NX450h+ F Sport'],
    ['Audi', 'Audi A4 Avant', 'Audi', 'A4 Avant'],
    ['BMW', 'Bmw Other', 'BMW', ''],
    ['BMW', 'Mini Cooper D Crossover', 'MINI', 'Cooper D Crossover'],
    ['Mercedes Benz', 'Mercedes Benz B Class', 'Mercedes-Benz', 'B Class'],
    ['mercedes-benz', 'Mercedes-Benz B180 AMG Line', 'Mercedes-Benz', 'B180 AMG Line'],
    ['bmw', 'BMW 320i M Sport', 'BMW', '320i M Sport'],
  ])('normalizes %s / %s without losing the series or trim', (make, model, expectedMake, expectedModel) => {
    const original = { ...base, make, model };
    const result = publicJapanMarketVehicle(original);
    expect(result).toMatchObject({ make: expectedMake, model: expectedModel, sourceMake: make, sourceModel: model,
      id: original.id, fobPriceNzd: original.fobPriceNzd, sourceCode: original.sourceCode });
    expect(original).toMatchObject({ make, model });
    expect(publicJapanMarketVehicle(result)).toEqual(result);
  });

  it.each([
    ['Mitsubishi', 'Minicab Truck'],
    ['Toyota', 'Alphard Lexus-style body kit'],
    ['Toyota', 'LexusEdition'],
    ['BMW', 'Miniature'],
    ['Honda', 'Lexus RX350h'],
    ['Mercedes-Benz', 'AMG GT 43 4MATIC+'],
    ['Nissan', 'GT-R Premium Edition T-spec'],
    ['光岡', 'ビュート'],
  ])('does not guess an identity from a partial or conflicting name: %s / %s', (make, model) => {
    expect(normalizeVehicleIdentity({ make, model })).toMatchObject({ make, model });
  });

  it('uses an honest localized label for unknown models, without putting a fake model into metadata', () => {
    const vehicle = publicJapanMarketVehicle({ ...base, make: 'BMW', model: 'Bmw Other' });
    expect(vehicle.model).toBe('');
    expect(vehicleName(vehicle)).toBe('BMW · Model to confirm');
    expect(vehicleModelLabel(vehicle, 'zh')).toBe('车型待确认');
    expect(vehicleFullName(vehicle, 'zh')).toBe('2023 BMW · 车型待确认');
  });

  it('removes repeated brand/model variants but preserves a meaningful trim', () => {
    const vehicle = { ...base, make: 'Audi', model: 'Audi A4 Avant', variant: 'Audi A4 Avant' };
    expect(vehicleVariant(vehicle)).toBe('');
    expect(vehicleFullName(vehicle)).toBe('2023 Audi A4 Avant');
    expect(vehicleFullName({ ...vehicle, variant: '35 TFSI S line' })).toBe('2023 Audi A4 Avant 35 TFSI S line');
  });
});

it('normalizes page and detail names while keeping backend filter values and facets unchanged', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://catalog.example');
  const raw = { ...base, make: 'Toyota', model: 'Lexus Rx350h' };
  const facets = [{ make: raw.make, model: raw.model, year: raw.year }];
  const payload = { count: 2, totalCount: 2, page: 1, pageSize: 24, facets,
    vehicles: [raw, { ...base, id: 'JPJC-OTHER', make: 'BMW', model: 'Bmw Other' }] };
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
  vi.stubGlobal('fetch', fetcher);
  const filters = { make: 'Toyota', model: 'Lexus Rx350h', page: 1 };
  const page = await loadJapanMarketPage(filters);
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ ...filters, action: 'catalog-page' });
  expect(page.facets).toEqual(facets);
  expect(page.count).toBe(2);
  expect(page.vehicles.map((vehicle) => vehicleName(vehicle))).toEqual(['Lexus RX350h', 'BMW · Model to confirm']);
  expect((await loadJapanMarketVehicle(raw.id))?.vehicle).toEqual(page.vehicles[0]);
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ action: 'catalog', id: raw.id });
  expect(payload.vehicles[0]).toEqual(raw);
});
