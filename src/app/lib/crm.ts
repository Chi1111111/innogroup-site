import { createClient } from '@supabase/supabase-js';

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

type CrmStateRow = {
  id: string;
  payload: CrmState | null;
};

const CRM_STATE_ID = 'main';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function assertSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }

  return supabase;
}

export async function loadCrmState(): Promise<CrmState | null> {
  const client = assertSupabase();
  const { data, error } = await client
    .from('crm_state')
    .select('id,payload')
    .eq('id', CRM_STATE_ID)
    .maybeSingle();

  if (error) throw error;
  return (data as CrmStateRow | null)?.payload ?? null;
}

export async function saveCrmState(crm: CrmState): Promise<void> {
  const client = assertSupabase();
  const { error } = await client.from('crm_state').upsert(
    {
      id: CRM_STATE_ID,
      payload: crm,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) throw error;
}
