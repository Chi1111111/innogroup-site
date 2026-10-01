import { describe, expect, it, vi } from 'vitest';
import { acquisitionBalance, acquisitionCents, acquisitionErrors, emptyAcquisition } from './acquisitionAgreement';
import { createEmptyContract, loadContracts, upsertContract } from './contracts';
import { adminApiRequest } from './adminApi';
vi.mock('./adminApi', () => ({ adminApiRequest: vi.fn() }));
describe('vehicle acquisition', () => {
  it('calculates seller proceeds in cents without double counting the lender payout', () => {
    expect(acquisitionBalance({ ...emptyAcquisition(), purchasePrice: '68,000.01', depositPaid: '1000.10', financeSettlement: '12000.20' })).toBe(5499971);
    expect(acquisitionBalance({ ...emptyAcquisition(), purchasePrice: '500', depositPaid: '600' })).toBe(-10000);
  });
  it('rejects ambiguous, negative and non-finite amounts instead of silently coercing them', () => {
    for (const value of ['', '-1', '1,23', '1e3', 'Infinity', '12.345', '$123']) expect(acquisitionCents(value)).toBeNull();
    expect(acquisitionCents('1,234.50')).toBe(123450);
  });
  it('keeps acquisition direction on save/reload through the existing purchase storage category', async () => {
    const contract = createEmptyContract('vehicle-acquisition');
    contract.client.name = 'Example Seller';
    contract.acquisitionAgreement!.purchasePrice = '68000';
    let stored: Record<string, unknown> = {};
    vi.mocked(adminApiRequest).mockImplementation(async (action, payload) => {
      if (action === 'contracts.upsert') { stored = payload!.row as Record<string, unknown>; return undefined; }
      return [{ ...stored, created_at: contract.createdAt }];
    });
    const saved = await upsertContract(contract);
    expect(stored.contract_type).toBe('vehicle-purchase');
    expect(saved[0].contractType).toBe('vehicle-acquisition');
    expect(saved[0].acquisitionAgreement?.purchasePrice).toBe('68000');
    expect((await loadContracts()).filter(c=>c.contractType === 'vehicle-purchase')).toHaveLength(0);
  });
  it('preserves ordinary purchase contracts and requires acquisition details before sending', () => {
    expect(createEmptyContract('vehicle-purchase').acquisitionAgreement).toBeUndefined();
    expect(acquisitionErrors(createEmptyContract('vehicle-purchase'))).toEqual([]);
    expect(acquisitionErrors(createEmptyContract('vehicle-acquisition')).length).toBeGreaterThan(0);
  });
});
