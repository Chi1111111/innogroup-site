import { adminApiRequest } from './adminApi';

export interface CrmLead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  contact: string;
  channel: string;
  interest: string;
  budget: string;
  status: string;
  nextFollowUp: string;
  notes: string;
}

export interface CrmOrder {
  id: string;
  sourceLeadId?: string;
  sourceContractId?: string;
  customerName: string;
  orderDate: string;
  customerPhone: string;
  vehicleModel: string;
  year: string;
  plateOrVin: string;
  vehicleImages: string[];
  paymentStage: string;
  balanceRemaining: string;
  salePrice: string;
  complianceStage: string;
  note: string;
}

export interface LoanCar {
  id: string;
  vehicle: string;
  status: string;
}

export interface CrmState {
  leads: CrmLead[];
  orders: CrmOrder[];
  loanCars: LoanCar[];
}

export interface CrmSnapshot {
  state: CrmState | null;
  version: string | null;
}

export async function loadCrmState(): Promise<CrmSnapshot> {
  const snapshot = await adminApiRequest<CrmSnapshot>('crm.get');
  if (!snapshot || !Object.hasOwn(snapshot, 'version') || !Object.hasOwn(snapshot, 'state')) {
    throw new Error('CRM 服务需要更新后才能安全保存，请联系管理员。');
  }
  return snapshot;
}

export async function saveCrmState(crm: CrmState, expectedVersion: string | null): Promise<string> {
  const result = await adminApiRequest<{ version: string }>('crm.upsert', { payload: crm, expectedVersion });
  if (!result?.version) throw new Error('保存结果缺少版本信息，请重新读取云端资料后核对。');
  return result.version;
}
