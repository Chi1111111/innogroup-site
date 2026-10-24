import { describe, expect, it } from 'vitest';
import { combineQuoteMessage, formatQuoteEstimate, type QuoteEstimate } from './quoteEstimate';

const estimate: QuoteEstimate = {
  vehiclePriceJPY: 3000000, exchangeRate: 84.95, rateDate: '2026-10-22',
  rateStatus: 'live', landedPriceNZD: 47844.15832842849,
};

describe('calculator estimate in a quote enquiry', () => {
  it('carries the vehicle price, calculation rate, date and rounded NZD result', () => {
    const note = formatQuoteEstimate(estimate, 'en');
    expect(note).toContain('¥3,000,000 JPY');
    expect(note).toContain('Reference rate (2026-10-22): 1 NZD = 84.95 JPY');
    expect(note).toContain('$47,844.16 NZD');
    expect(note).toContain('Estimate only.');
  });

  it('labels a fallback rate honestly in either language, including while loading', () => {
    expect(formatQuoteEstimate({ ...estimate, rateStatus: 'loading', rateDate: '' }, 'en')).toContain('Fallback reference rate:');
    const note = formatQuoteEstimate({ ...estimate, rateStatus: 'fallback', rateDate: '' }, 'zh');
    expect(note).toContain('备用参考汇率：1 NZD = 84.95 JPY');
    expect(note).toContain('仅供估算');
  });

  it('keeps customer preferences and the edited estimate in the existing message field', () => {
    const edited = 'Edited estimate: please confirm shipping.';
    expect(combineQuoteMessage('Blue, automatic, under 80,000 km', edited))
      .toBe(`Blue, automatic, under 80,000 km\n\n${edited}`);
    expect(combineQuoteMessage('Keep my preferences', null)).toBe('Keep my preferences');
    expect(combineQuoteMessage('Keep my preferences', '  ')).toBe('Keep my preferences');
    expect(combineQuoteMessage('', null)).toBe('No additional details provided');
  });
});
