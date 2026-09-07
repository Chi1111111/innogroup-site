import { describe, expect, it } from 'vitest';
import type { CrmOrder, CrmState } from '../lib/crm';
import { mergeContractOrders } from './adminCrmModel';

function order(overrides: Partial<CrmOrder>): CrmOrder {
  return {
    id: 'order-1',
    customerName: 'Customer',
    orderDate: '2026-09-04',
    customerPhone: '',
    vehicleModel: 'Old model',
    year: '',
    plateOrVin: '',
    vehicleImages: [],
    paymentStage: '',
    balanceRemaining: '',
    salePrice: '',
    complianceStage: '运输中',
    note: '',
    ...overrides,
  };
}

describe('admin CRM model', () => {
  it('merges contract data while preserving locally managed workflow fields', () => {
    const current: CrmState = {
      leads: [],
      loanCars: [],
      orders: [order({
        sourceContractId: 'contract-1',
        vehicleImages: ['saved.jpg'],
        paymentStage: '已付半款',
        note: 'Local note',
      })],
    };
    const fromContract = order({
      id: 'contract-order',
      sourceContractId: 'contract-1',
      vehicleModel: 'Updated model',
      complianceStage: '未到港',
      paymentStage: '',
      note: '',
    });

    const result = mergeContractOrders(current, [fromContract]);

    expect(result.orders[0]).toMatchObject({
      id: 'order-1',
      vehicleModel: 'Updated model',
      vehicleImages: ['saved.jpg'],
      paymentStage: '已付半款',
      complianceStage: '运输中',
      note: 'Local note',
    });
  });
});
