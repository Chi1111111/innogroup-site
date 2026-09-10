import { afterEach, expect, it, vi } from 'vitest';
import { trackLeadSubmitted } from './leadTracking';

afterEach(() => vi.unstubAllGlobals());

it('routes a delivered buyer enquiry to Ads and GA4 without customer details', () => {
  const gtag = vi.fn();
  vi.stubGlobal('window', { gtag });
  trackLeadSubmitted('quote', 'finance');
  expect(gtag.mock.calls).toEqual([
    ['event', 'conversion', { send_to: 'AW-18414597432/p-jECJu30_IcELjq4cxE', value: 1, currency: 'NZD' }],
    ['event', 'generate_lead', { send_to: 'G-T7DCQ8KBH3', form_name: 'quote', lead_type: 'finance' }],
  ]);
});

it.each(['sell', 'support'] as const)('does not use %s enquiries for buyer campaign bidding', (type) => {
  const gtag = vi.fn();
  vi.stubGlobal('window', { gtag });
  trackLeadSubmitted('quote', type);
  expect(gtag).toHaveBeenCalledTimes(1);
  expect(gtag.mock.calls[0][1]).toBe('generate_lead');
});

it('does not fail a delivered enquiry when analytics is unavailable or throws', () => {
  vi.stubGlobal('window', {});
  expect(() => trackLeadSubmitted('japan_market', 'japan')).not.toThrow();
  vi.stubGlobal('window', { gtag: () => { throw new Error('Blocked'); } });
  expect(() => trackLeadSubmitted('japan_market', 'japan')).not.toThrow();
});
