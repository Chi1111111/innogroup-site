import { createClient } from '@supabase/supabase-js';

type ContractStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'cancelled';
export type ContractType = 'vehicle-purchase' | 'deposit';

export interface VehicleContract {
  id: string;
  signingToken: string;
  contractType: ContractType;
  status: ContractStatus;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  signedIpNote?: string;
  signedUserAgent?: string;
  client: {
    name: string;
    address: string;
    email: string;
    phone: string;
    driversLicenceNo: string;
  };
  purchasedVehicle: {
    make: string;
    year: string;
    model: string;
    vinOrRegistration: string;
    odometer: string;
    fuelType: string;
    colour: string;
    engineCapacity: string;
    wofDetails: string;
    firstRegisteredNz: string;
    specialPurpose: string;
  };
  tradeIn: {
    enabled: boolean;
    registrationNo: string;
    make: string;
    year: string;
    engineCapacity: string;
    model: string;
    chassisFrameOrVin: string;
    firstRegisteredNz: string;
    vicWofDetails: string;
    colour: string;
    motivePower: string;
    odometer: string;
    purchasePrice: string;
    encumbranceBalance: string;
    netAllowance: string;
    payEncumbranceTo: string;
  };
  payment: {
    salePriceIncGst: string;
    accessoriesDescription: string;
    accessoriesValueIncGst: string;
    subtotalIncGst: string;
    lessNetTradeInAllowance: string;
    netPrice: string;
    depositOnSigning: string;
    additionalPayments: string;
    dueOnDelivery: string;
    totalPayments: string;
    balanceOutstanding: string;
    financeBy: string;
    financeTermMonths: string;
  };
  acknowledgements: {
    businessUseClauseApplies: boolean;
    termsAccepted: boolean;
    cinProvided: boolean;
    signDocumentsAccepted: boolean;
    odometerAcknowledged: boolean;
    privacyAccepted: boolean;
    depositForfeitureAccepted: boolean;
  };
  signatures: {
    purchaserName?: string;
    purchaser?: string;
    salespersonName?: string;
    salesperson?: string;
    innoGroupName?: string;
    innoGroup?: string;
  };
  depositAgreement?: {
    date: string;
    clientName: string;
    anticipationOf: string;
    applicantName: string;
    depositAmount: string;
    nextStepContactName: string;
    returnEmail: string;
    contactPersonName: string;
    contactAvailability: string;
    acknowledgementName: string;
    preOrderVehicle: string;
  };
}

type ContractRow = {
  id: string;
  contract_type: ContractType;
  status: ContractStatus;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  signing_token: string;
  payload: Partial<VehicleContract> | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  created_at: string;
};

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

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const details = error as { message?: string; code?: string; details?: string; hint?: string };
    return [details.message, details.code, details.details, details.hint].filter(Boolean).join(' - ') || JSON.stringify(error);
  }

  return String(error);
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createContractId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function createEmptyContract(contractType: ContractType = 'vehicle-purchase'): VehicleContract {
  const now = new Date().toISOString();

  return {
    id: createContractId(),
    signingToken: randomToken(),
    contractType,
    status: 'draft',
    createdAt: now,
    client: {
      name: '',
      address: '',
      email: '',
      phone: '',
      driversLicenceNo: '',
    },
    purchasedVehicle: {
      make: '',
      year: '',
      model: '',
      vinOrRegistration: '',
      odometer: '',
      fuelType: '',
      colour: '',
      engineCapacity: '',
      wofDetails: '',
      firstRegisteredNz: '',
      specialPurpose: '',
    },
    tradeIn: {
      enabled: false,
      registrationNo: '',
      make: '',
      year: '',
      engineCapacity: '',
      model: '',
      chassisFrameOrVin: '',
      firstRegisteredNz: '',
      vicWofDetails: '',
      colour: '',
      motivePower: '',
      odometer: '',
      purchasePrice: '',
      encumbranceBalance: '',
      netAllowance: '',
      payEncumbranceTo: '',
    },
    payment: {
      salePriceIncGst: '',
      accessoriesDescription: '',
      accessoriesValueIncGst: '',
      subtotalIncGst: '',
      lessNetTradeInAllowance: '',
      netPrice: '',
      depositOnSigning: '',
      additionalPayments: '',
      dueOnDelivery: '',
      totalPayments: '',
      balanceOutstanding: '',
      financeBy: 'Customer',
      financeTermMonths: '',
    },
    acknowledgements: {
      businessUseClauseApplies: false,
      termsAccepted: false,
      cinProvided: false,
      signDocumentsAccepted: false,
      odometerAcknowledged: false,
      privacyAccepted: false,
      depositForfeitureAccepted: false,
    },
    signatures: {},
    depositAgreement: {
      date: '',
      clientName: '',
      anticipationOf: '',
      applicantName: '',
      depositAmount: '',
      nextStepContactName: '',
      returnEmail: '',
      contactPersonName: '',
      contactAvailability: '',
      acknowledgementName: '',
      preOrderVehicle: '',
    },
  };
}

function rowToContract(row: ContractRow): VehicleContract {
  const base = createEmptyContract(row.contract_type);
  const payload = row.payload ?? {};
  const client = {
    ...base.client,
    ...payload.client,
    name: row.client_name ?? payload.client?.name ?? '',
    email: row.client_email ?? payload.client?.email ?? '',
    phone: row.client_phone ?? payload.client?.phone ?? '',
    address: row.client_address ?? payload.client?.address ?? '',
  };

  return {
    ...base,
    ...payload,
    id: row.id,
    signingToken: row.signing_token,
    contractType: row.contract_type,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? undefined,
    viewedAt: row.viewed_at ?? undefined,
    signedAt: row.signed_at ?? undefined,
    client,
    purchasedVehicle: { ...base.purchasedVehicle, ...payload.purchasedVehicle },
    tradeIn: { ...base.tradeIn, ...payload.tradeIn },
    payment: { ...base.payment, ...payload.payment },
    acknowledgements: { ...base.acknowledgements, ...payload.acknowledgements },
    signatures: { ...base.signatures, ...payload.signatures },
    depositAgreement: { ...base.depositAgreement!, ...payload.depositAgreement },
  };
}

function contractToRow(contract: VehicleContract) {
  return {
    id: contract.id,
    contract_type: contract.contractType,
    status: contract.status,
    client_name: contract.client.name,
    client_email: contract.client.email,
    client_phone: contract.client.phone,
    client_address: contract.client.address,
    signing_token: contract.signingToken,
    payload: contract,
    sent_at: contract.sentAt ?? null,
    viewed_at: contract.viewedAt ?? null,
    signed_at: contract.signedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function loadContracts(): Promise<VehicleContract[]> {
  const client = assertSupabase();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToContract(row as ContractRow));
}

export async function upsertContract(contract: VehicleContract): Promise<VehicleContract[]> {
  const client = assertSupabase();
  const { error } = await client.from('contracts').upsert(contractToRow(contract), { onConflict: 'id' });
  if (error) throw error;

  return loadContracts();
}

export async function deleteContract(contractId: string): Promise<VehicleContract[]> {
  const client = assertSupabase();
  const { error } = await client.from('contracts').delete().eq('id', contractId);
  if (error) throw error;

  return loadContracts();
}

export async function getContractBySigningToken(signingToken: string): Promise<VehicleContract | null> {
  const client = assertSupabase();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('signing_token', signingToken)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToContract(data as ContractRow) : null;
}

export async function recordContractEvent(contractId: string, eventType: string, note?: string) {
  const client = assertSupabase();
  const { error } = await client.from('contract_events').insert({
    contract_id: contractId,
    event_type: eventType,
    user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent,
    note: note ?? null,
  });

  if (error) throw error;
}

export async function saveSignature(contract: VehicleContract, signerName: string, signatureData: string) {
  const client = assertSupabase();
  const { error } = await client.from('contract_signatures').insert({
    contract_id: contract.id,
    signer_name: signerName,
    signature_data: signatureData,
    user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent,
  });

  if (error) throw error;
}

export function formatDateTime(value?: string) {
  if (!value) return '-';

  try {
    return new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function money(value: string) {
  return value?.trim() ? `$${value.trim()} NZD` : '$________ NZD';
}
