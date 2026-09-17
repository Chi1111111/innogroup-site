import { describe, expect, it } from 'vitest';
import type { JapanMarketVehicleSummary } from './japanMarket';
import { dailyFeaturedVehicles, hasVehiclePhoto, newZealandDay } from './japanMarketFeatured';

const vehicle = (id: string, imageUrl = `https://example.com/${id}.jpg`) => ({ id, imageUrl, photoCount: 1 } as JapanMarketVehicleSummary);
describe('homepage daily vehicles', () => {
  it('excludes missing photos and the source coming-soon placeholder', () => {
    expect(hasVehiclePhoto(vehicle('bad', 'https://site.gabs.biz/stock/public/images/coming_soon_new.png'))).toBe(false);
    expect(hasVehiclePhoto({ ...vehicle('bad'), photoCount: 0 })).toBe(false);
    expect(hasVehiclePhoto(vehicle('bad', ''))).toBe(false);
    expect(hasVehiclePhoto(vehicle('good'))).toBe(true);
  });
  it('keeps a day stable despite source ordering, changes the next day and supplies reserves', () => {
    const fleet = Array.from({ length: 40 }, (_, i) => vehicle(String(i)));
    const today = dailyFeaturedVehicles(fleet, '2026-09-18');
    expect(dailyFeaturedVehicles([...fleet].reverse(), '2026-09-18')).toEqual(today);
    const tomorrow = dailyFeaturedVehicles(fleet, '2026-09-19').slice(0, 8);
    expect(tomorrow.every((v) => !today.slice(0, 8).includes(v))).toBe(true);
    expect(today).toHaveLength(40);
    expect(dailyFeaturedVehicles([], '2026-09-18')).toEqual([]);
  });
  it('switches at NZ midnight including daylight saving', () => {
    expect(newZealandDay(new Date('2026-09-18T11:59:59Z'))).toBe('2026-09-18');
    expect(newZealandDay(new Date('2026-09-18T12:00:00Z'))).toBe('2026-09-19');
    expect(newZealandDay(new Date('2026-12-01T11:00:00Z'))).toBe('2026-12-02');
  });
});
