import { afterEach, describe, expect, it, vi } from 'vitest';
import { vehicleQualityIssue } from './japanMarketQuality.mjs';

const valid = { id: 'car-1', make: 'Toyota', model: 'Alphard', year: 2024, mileage: 18000 };
describe('Japan Market quality boundary', () => {
  it.each(['Toyota', 'Mercedes-Benz', 'Land Rover', '光岡', 'トヨタ'])('keeps real brand names: %s', (make) => {
    expect(vehicleQualityIssue({ ...valid, make })).toBeNull();
  });
  it.each([
    { make: '不是我 /*不足完全无限想象好用运用父母完成成功劳动自我无限人类数学力学不断存在' },
    { make: '<div>car</div>' }, { model: 'broken??model' },
    { year: 0 }, { year: 2090 }, { mileage: -1 },
  ])('rejects polluted fields: %j', (change) => {
    expect(vehicleQualityIssue({ ...valid, ...change })).not.toBeNull();
  });
});

afterEach(() => vi.unstubAllGlobals());
it('allows a real retry after a failed listing request', async () => {
  vi.resetModules();
  const fetcher = vi.fn().mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 1, vehicles: [valid] }) });
  vi.stubGlobal('fetch', fetcher);
  const { loadJapanMarketData } = await import('./japanMarket');
  await expect(loadJapanMarketData()).rejects.toThrow('offline');
  await expect(loadJapanMarketData()).resolves.toMatchObject({ count: 1 });
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it('filters legacy polluted snapshots and fixes the displayed count', async () => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 2, vehicles: [valid, { ...valid, id: 'bad', make: '<invalid>' }] }) }));
  const { loadJapanMarketData } = await import('./japanMarket');
  const data = await loadJapanMarketData();
  expect(data.count).toBe(1);
  expect(data.vehicles).toEqual([valid]);
});

it('does not expose a polluted vehicle through its detail URL', async () => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ vehicles: [{ ...valid, make: '<invalid>' }] }) }));
  const { loadJapanMarketVehicle } = await import('./japanMarket');
  expect(await loadJapanMarketVehicle(valid.id)).toBeNull();
});
