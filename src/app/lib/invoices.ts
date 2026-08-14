import { IS_SUPABASE_CONFIGURED } from './supabaseClient';
import { adminApiRequest } from './adminApi';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstIncluded: boolean;
}

export interface CommercialInvoice {
  id: string;
  invoiceNo: string;
  status: InvoiceStatus;
  issueDate: string;
  remark: string;
  sourceContractId?: string;
  createdAt: string;
  updatedAt: string;
  issuedAt?: string;
  paidAt?: string;
  lastSentAt?: string;
  lastSentTo?: string;
  sendCount: number;
  customer: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: string;
    vin: string;
    registration: string;
    colour: string;
    engineCapacity: string;
  };
  lineItems: InvoiceLineItem[];
}

type InvoiceRow = {
  id: string;
  invoice_no: string;
  status: InvoiceStatus;
  customer_name: string | null;
  customer_email: string | null;
  source_contract_id: string | null;
  payload: Partial<CommercialInvoice> | null;
  issued_at: string | null;
  paid_at: string | null;
  last_sent_at: string | null;
  last_sent_to: string | null;
  send_count: number | null;
  created_at: string;
  updated_at: string;
};

export const COMPANY_DETAILS = {
  name: 'INNO GROUP LTD',
  address: '1/A 331 Rosedale Road, Rosedale, Auckland 0632',
  phone: '+64 27 285 8065',
  email: 'innogroup.shawn@gmail.com',
  gstNumber: '135-362-624',
  bankName: 'ANZ Bank New Zealand Limited',
  bankAddress: '31A KILKELLY AVENUE',
  accountNumber: '06-0122-0860228-00',
  accountName: 'INNO GROUP LTD',
  swiftCode: 'ANZBNZ22',
} as const;

const configuredStorageMode = import.meta.env.VITE_INVOICE_CLOUD_ENABLED as string | undefined;
const invoiceCloudEnabled = configuredStorageMode
  ? configuredStorageMode === 'true'
  : IS_SUPABASE_CONFIGURED;
const LOCAL_INVOICES_KEY = 'inno:invoices:v1';

export const INVOICE_STORAGE_MODE = invoiceCloudEnabled ? 'cloud' : 'local-preview';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function createInvoiceNumber() {
  const now = new Date();
  const datePart = localDate().replace(/-/g, '').slice(2);
  const timePart = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join('');
  return `${datePart}-${timePart}`;
}

export function createInvoiceLineItem(description = 'CAR PRICE'): InvoiceLineItem {
  return {
    id: createId(),
    description,
    quantity: 1,
    unitPrice: 0,
    gstIncluded: true,
  };
}

export function createEmptyInvoice(): CommercialInvoice {
  const now = new Date().toISOString();

  return {
    id: createId(),
    invoiceNo: createInvoiceNumber(),
    status: 'draft',
    issueDate: localDate(),
    remark: '',
    createdAt: now,
    updatedAt: now,
    sendCount: 0,
    customer: {
      name: '',
      address: '',
      email: '',
      phone: '',
    },
    vehicle: {
      make: '',
      model: '',
      year: '',
      vin: '',
      registration: '',
      colour: '',
      engineCapacity: '',
    },
    lineItems: [createInvoiceLineItem()],
  };
}

function rowToInvoice(row: InvoiceRow): CommercialInvoice {
  const base = createEmptyInvoice();
  const payload = row.payload ?? {};

  return {
    ...base,
    ...payload,
    id: row.id,
    invoiceNo: row.invoice_no,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    issuedAt: row.issued_at ?? undefined,
    paidAt: row.paid_at ?? undefined,
    lastSentAt: row.last_sent_at ?? payload.lastSentAt,
    lastSentTo: row.last_sent_to ?? payload.lastSentTo,
    sendCount: row.send_count ?? payload.sendCount ?? 0,
    sourceContractId: row.source_contract_id ?? payload.sourceContractId,
    customer: {
      ...base.customer,
      ...payload.customer,
      name: row.customer_name ?? payload.customer?.name ?? '',
      email: row.customer_email ?? payload.customer?.email ?? '',
    },
    vehicle: { ...base.vehicle, ...payload.vehicle },
    lineItems:
      Array.isArray(payload.lineItems) && payload.lineItems.length > 0
        ? payload.lineItems
        : base.lineItems,
  };
}

export function getInvoiceTotal(invoice: CommercialInvoice) {
  return invoice.lineItems.reduce(
    (total, item) => total + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0),
    0,
  );
}

export function formatNzd(value: number) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function invoiceToRow(invoice: CommercialInvoice) {
  return {
    id: invoice.id,
    invoice_no: invoice.invoiceNo,
    status: invoice.status,
    customer_name: invoice.customer.name,
    customer_email: invoice.customer.email,
    source_contract_id: invoice.sourceContractId ?? null,
    total_nzd: getInvoiceTotal(invoice),
    payload: invoice,
    issued_at: invoice.issuedAt ?? null,
    paid_at: invoice.paidAt ?? null,
    last_sent_at: invoice.lastSentAt ?? null,
    last_sent_to: invoice.lastSentTo ?? null,
    send_count: invoice.sendCount,
    updated_at: invoice.updatedAt,
  };
}

function loadLocalInvoices() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_INVOICES_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed as CommercialInvoice[];
  } catch {
    return [];
  }
}

function saveLocalInvoices(invoices: CommercialInvoice[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_INVOICES_KEY, JSON.stringify(invoices));
  }
  return invoices;
}

export async function loadInvoices(): Promise<CommercialInvoice[]> {
  if (!invoiceCloudEnabled) return loadLocalInvoices();

  const rows = await adminApiRequest<InvoiceRow[]>('invoices.list');
  return (rows ?? []).map((row) => rowToInvoice(row));
}

export async function upsertInvoice(invoice: CommercialInvoice): Promise<CommercialInvoice[]> {
  if (!invoiceCloudEnabled) {
    const invoices = loadLocalInvoices();
    const next = [invoice, ...invoices.filter((item) => item.id !== invoice.id)]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return saveLocalInvoices(next);
  }

  await adminApiRequest('invoices.upsert', { row: invoiceToRow(invoice) });
  return loadInvoices();
}

export async function deleteInvoice(invoiceId: string): Promise<CommercialInvoice[]> {
  if (!invoiceCloudEnabled) {
    return saveLocalInvoices(loadLocalInvoices().filter((invoice) => invoice.id !== invoiceId));
  }

  await adminApiRequest('invoices.delete', { id: invoiceId });
  return loadInvoices();
}
