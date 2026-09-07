import { describe, expect, it } from 'vitest';
import { DEFAULT_JAPAN_WEEKLY_REPORT_META } from '../hooks/useJapanSpecialOrders';
import { buildWeeklyReport, parseJapanFindSource } from './adminVehiclesModel';

describe('admin vehicle model', () => {
  it('turns pasted Japan listing text into a safe draft', () => {
    const draft = parseJapanFindSource('车型：丰田 Supra\n年份：1998\n里程：80,000 km\n价格：¥ 4,500,000');

    expect(draft.title).toContain('Toyota Supra');
    expect(draft.year).toBe('1998');
    expect(draft.mileage).toBe('80,000 km');
    expect(draft.slug).toBe('toyota-supra');
  });

  it('rejects a report whose required vehicle fields are incomplete', () => {
    const result = buildWeeklyReport(
      DEFAULT_JAPAN_WEEKLY_REPORT_META,
      [{
        slug: 'incomplete',
        title: '',
        zhTitle: '',
        image: '',
        images: [],
        imagesText: '',
        price: '',
        year: '',
        mileage: '',
        location: '',
        status: '',
        summary: '',
        zhSummary: '',
      }],
      []
    );

    expect(result.report).toBeNull();
    expect(result.error).toContain('资料尚未填写完整');
  });
});
