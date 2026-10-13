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

export async function loadCrmState(): Promise<CrmState | null> {
  return adminApiRequest<CrmState | null>('crm.get');
}

export async function saveCrmState(crm: CrmState): Promise<void> {
  await adminApiRequest('crm.upsert', { payload: crm });
}
