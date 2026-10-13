import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

it('retries the live catalog after a failed detail request without caching the failure', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://catalog.example');
  const vehicle = { id: 'JPJC-TEST', make: 'Toyota', model: 'Test', year: 2020, mileage: 100,
    fobPriceNzd: 10000, sourcePriceType: 'FOB', priceBasis: 'FOB', priceCurrency: 'NZD' };
  const fetch = vi.fn().mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ok: true, json: async () => ({ vehicles: [vehicle] }) });
  vi.stubGlobal('fetch', fetch);
  const { loadJapanMarketVehicle } = await import('./japanMarket');
  await expect(loadJapanMarketVehicle(vehicle.id)).rejects.toThrow('offline');
  expect((await loadJapanMarketVehicle(vehicle.id))?.vehicle.id).toBe(vehicle.id);
  expect(fetch).toHaveBeenCalledTimes(2);
});
