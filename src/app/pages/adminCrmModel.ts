import {
  type CrmLead,
  type CrmOrder,
  type CrmState,
} from '../lib/crm';
import type { VehicleContract } from '../lib/contracts';
import {
  loadJapanSpecialOrdersState,
  saveJapanSpecialOrdersState,
  type JapanWeeklyReportsPayload,
} from '../lib/japanSpecialOrders';
import {
  DEFAULT_JAPAN_WEEKLY_REPORT_META,
  type JapanSpecialOrderVehicle,
  type JapanWeeklyReportState,
} from '../hooks/useJapanSpecialOrders';

export const CRM_STORAGE_KEY = 'inno:crm:v2';

export type LeadStatus = string;
export type LeadFilter = string;
export type CrmView = 'leads' | 'orders' | 'loanCars';

export const LEAD_CHANNEL_OPTIONS = ['Ivan 小红书', 'Shawn 小红书', '网站', '介绍', 'Facebook', 'yuki'];
export const CONTACT_METHOD_OPTIONS = [
  'Ivan 小红书',
  'Shawn 小红书',
  '邮件',
  '电话',
  'Facebook',
  'Ivan 微信',
  'Shawn 微信',
  '微信群',
];
export const SALES_STAGE_OPTIONS = ['了解', '感兴趣', '选车', '定金', '完结'];
export const PAYMENT_STAGE_OPTIONS = ['已付半款', '已付全款'];
export const ARRIVED_COMPLIANCE_STAGE = '已到港／合规处理中';
export const COMPLIANCE_STAGE_OPTIONS = ['未到港', '运输中', ARRIVED_COMPLIANCE_STAGE, 'MR2A已出', '罚款已交', '已上牌'];
export const LOAN_CAR_STATUS_OPTIONS = ['借出', '在店'];

const CRM_ORDER_CONTRACT_TYPE = 'vehicle-purchase';
export const COMPLETED_COMPLIANCE_STAGE = '已上牌';

export const STAGES: Array<{ id: LeadFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'followup', label: '待跟进' },
  ...SALES_STAGE_OPTIONS.map((stage) => ({ id: stage, label: stage })),
];

export const EMPTY_LEAD: Omit<CrmLead, 'id'> = {
  createdAt: new Date().toISOString().slice(0, 10),
  name: '',
  phone: '',
  email: '',
  contact: '',
  channel: '',
  interest: '',
  budget: '',
  status: '了解',
  nextFollowUp: '',
  notes: '',
};

export const EMPTY_ORDER: Omit<CrmOrder, 'id'> = {
  customerName: '',
  orderDate: new Date().toISOString().slice(0, 10),
  customerPhone: '',
  vehicleModel: '',
  year: '',
  plateOrVin: '',
  vehicleImages: [],
  paymentStage: '',
  balanceRemaining: '',
  salePrice: '',
  complianceStage: '未到港',
  note: '',
};

const EXCEL_SEED_CRM: CrmState = {
  leads: [
    {
      id: 'lead-excel-liaoyu',
      createdAt: '2026-05-21',
      name: 'Liaoyu',
      phone: '',
      email: '',
      contact: 'yuki',
      channel: '微信群',
      interest: '本地现车',
      budget: '15000',
      status: '感兴趣',
      nextFollowUp: '2026-05-21',
      notes: '想要本地现车，正在约时间，带去ming或者其他车行看车',
    },
  ],
  orders: [
    {
      id: 'order-excel-cici',
      customerName: 'Cici',
      orderDate: '2026-05-20',
      customerPhone: '',
      vehicleModel: 'Toyota Noah',
      year: '',
      plateOrVin: '',
      vehicleImages: [],
      paymentStage: '已付全款',
      balanceRemaining: '0',
      salePrice: '19800',
      complianceStage: '未到港',
      note: '',
    },
  ],
  loanCars: [{ id: 'loan-excel-i3', vehicle: 'i3', status: '在店' }],
};

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

function normalizeLeadStatus(status: string): LeadStatus {
  if (SALES_STAGE_OPTIONS.includes(status as LeadStatus)) {
    return status as LeadStatus;
  }
  if (status === 'interested') return '感兴趣';
  if (status === 'ordered') return '定金';
  if (status === 'lost') return '完结';
  return '了解';
}

function normalizeComplianceStage(status?: string) {
  if (status === '已到港' || status === '合规处理中' || status === '处理中') {
    return ARRIVED_COMPLIANCE_STAGE;
  }
  return status || '未到港';
}

export function loadCrm(): CrmState {
  if (typeof window === 'undefined') return EXCEL_SEED_CRM;
  const raw = window.localStorage.getItem(CRM_STORAGE_KEY);
  if (!raw) return EXCEL_SEED_CRM;
  try {
    const parsed = JSON.parse(raw) as CrmState;
    return {
      leads: Array.isArray(parsed.leads)
        ? parsed.leads.map((lead) => ({
            ...lead,
            createdAt: lead.createdAt ?? '',
            email: lead.email ?? '',
            status: normalizeLeadStatus(String(lead.status)),
          }))
        : EXCEL_SEED_CRM.leads,
      orders: Array.isArray(parsed.orders)
        ? parsed.orders.map((order) => ({
            ...order,
            sourceContractId: order.sourceContractId ?? '',
            customerPhone: order.customerPhone ?? '',
            year: order.year ?? '',
            plateOrVin: order.plateOrVin ?? '',
            vehicleImages: order.vehicleImages ?? [],
            complianceStage: normalizeComplianceStage(order.complianceStage),
            balanceRemaining: order.balanceRemaining ?? '',
            note: order.note ?? '',
          }))
        : EXCEL_SEED_CRM.orders,
      loanCars: Array.isArray(parsed.loanCars) ? parsed.loanCars : EXCEL_SEED_CRM.loanCars,
    };
  } catch {
    return EXCEL_SEED_CRM;
  }
}

export function normalizeCrmState(crm: CrmState | null | undefined): CrmState {
  if (!crm) return EXCEL_SEED_CRM;

  return {
    leads: Array.isArray(crm.leads)
      ? crm.leads.map((lead) => ({
          ...lead,
          createdAt: lead.createdAt ?? '',
          email: lead.email ?? '',
          status: normalizeLeadStatus(String(lead.status)),
        }))
      : EXCEL_SEED_CRM.leads,
    orders: Array.isArray(crm.orders)
      ? crm.orders.map((order) => ({
          ...order,
          sourceContractId: order.sourceContractId ?? '',
          customerPhone: order.customerPhone ?? '',
          year: order.year ?? '',
          plateOrVin: order.plateOrVin ?? '',
          vehicleImages: order.vehicleImages ?? [],
          complianceStage: normalizeComplianceStage(order.complianceStage),
          balanceRemaining: order.balanceRemaining ?? '',
          note: order.note ?? '',
        }))
      : EXCEL_SEED_CRM.orders,
    loanCars: Array.isArray(crm.loanCars) ? crm.loanCars : EXCEL_SEED_CRM.loanCars,
  };
}

function formatContractDate(value?: string) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function isCrmOrderContract(contract: VehicleContract) {
  return contract.contractType === CRM_ORDER_CONTRACT_TYPE;
}

function vehicleNameFromContract(contract: VehicleContract) {
  if (contract.contractType === 'deposit') {
    return contract.depositAgreement?.preOrderVehicle?.trim() || 'Pre-order vehicle';
  }

  return [contract.purchasedVehicle.make, contract.purchasedVehicle.model]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function salePriceFromContract(contract: VehicleContract) {
  if (contract.contractType === 'deposit') {
    return contract.depositAgreement?.depositAmount?.trim() ?? '';
  }

  return (
    contract.payment.salePriceIncGst ||
    contract.payment.netPrice ||
    contract.payment.totalPayments ||
    contract.consignmentAgreement?.listingPrice ||
    ''
  );
}

function paymentStageFromContract(contract: VehicleContract) {
  const balance = contract.payment.balanceOutstanding?.trim();
  if (balance === '0' || balance === '$0') return '已付全款';
  if (contract.payment.depositOnSigning?.trim() || contract.depositAgreement?.depositAmount?.trim()) {
    return '已付半款';
  }
  return '';
}

function noteFromContract(contract: VehicleContract) {
  const typeLabel =
    contract.contractType === 'deposit'
      ? 'Deposit contract'
      : contract.contractType === 'consignment'
        ? 'Consignment contract'
        : 'Vehicle purchase contract';
  const signedAt = contract.signedAt ? `Signed ${formatContractDate(contract.signedAt)}` : 'Signed';
  const parts = [
    `${signedAt} from ${typeLabel}.`,
    contract.client.email ? `Email: ${contract.client.email}` : '',
    contract.client.address ? `Address: ${contract.client.address}` : '',
    contract.payment.financeBy ? `Finance: ${contract.payment.financeBy}` : '',
    contract.depositAgreement?.nextStepContactName
      ? `Next contact: ${contract.depositAgreement.nextStepContactName}`
      : '',
  ];

  return parts.filter(Boolean).join(' ');
}

export function orderFromSignedContract(contract: VehicleContract): CrmOrder {
  return {
    id: `contract-${contract.id}`,
    sourceContractId: contract.id,
    customerName: contract.client.name || contract.depositAgreement?.clientName || '',
    orderDate: formatContractDate(contract.signedAt || contract.sentAt || contract.createdAt),
    customerPhone: contract.client.phone,
    vehicleModel: vehicleNameFromContract(contract),
    year: contract.purchasedVehicle.year,
    plateOrVin: contract.purchasedVehicle.vinOrRegistration,
    vehicleImages: [],
    paymentStage: paymentStageFromContract(contract),
    balanceRemaining: contract.payment.balanceOutstanding,
    salePrice: salePriceFromContract(contract),
    complianceStage: '未到港',
    note: noteFromContract(contract),
  };
}

function isWeeklyReportsPayload(payload: unknown): payload is JapanWeeklyReportsPayload {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'reports' in payload &&
      Array.isArray((payload as JapanWeeklyReportsPayload).reports)
  );
}

export async function syncArrivedOrderToWeeklyReport(order: CrmOrder) {
  const images = order.vehicleImages ?? [];
  if (!images.length) {
    throw new Error('请先上传至少一张车辆照片，再同步到本周到港。');
  }

  const cloudPayload = await loadJapanSpecialOrdersState();
  const reports: JapanWeeklyReportState[] = isWeeklyReportsPayload(cloudPayload)
    ? cloudPayload.reports
    : [{
        ...DEFAULT_JAPAN_WEEKLY_REPORT_META,
        vehicles: Array.isArray(cloudPayload) ? cloudPayload : [],
      }];
  const currentReport = reports[0] ?? { ...DEFAULT_JAPAN_WEEKLY_REPORT_META, vehicles: [] };
  const slug = `crm-arrival-${order.id}`;
  const currentArrivedVehicles = currentReport.arrivedVehicles ?? [];
  const existingIndex = currentArrivedVehicles.findIndex((vehicle) => vehicle.slug === slug);

  const vehicle: JapanSpecialOrderVehicle = {
    slug,
    title: order.vehicleModel || `${order.year} arrived vehicle`,
    zhTitle: order.vehicleModel || `${order.year} 到港车辆`,
    image: images[0],
    images,
    price: order.salePrice || 'Contact Inno',
    year: order.year || 'Confirm',
    mileage: 'Confirm with Inno',
    location: 'New Zealand',
    status: 'Arrived in New Zealand',
    summary: order.note || `This customer-ordered ${order.vehicleModel} has arrived in New Zealand and is moving through local compliance and handover preparation.`,
    zhSummary: order.note || `这台客户订购的 ${order.vehicleModel} 已抵达新西兰，目前正在进行本地合规及交付准备。`,
    japanPrice: '',
    landedEstimate: order.salePrice || 'Contact Inno',
    recommendation: 'A real customer order progressing from overseas sourcing and shipping into New Zealand compliance and handover.',
    zhRecommendation: '真实客户订单，已完成海外找车及运输，现进入新西兰本地合规和交付流程。',
    risk: 'This vehicle has already been ordered by a customer and is not available for sale.',
    zhRisk: '该车辆已有客户订购，并非在售现车。',
    recommendedFor: '',
    zhRecommendedFor: '',
    updatedAt: new Date().toISOString(),
  };

  const nextVehicles =
    existingIndex >= 0
      ? currentArrivedVehicles.map((item, index) => (index === existingIndex ? vehicle : item))
      : [...currentArrivedVehicles, vehicle];
  const arrivalLabel = `${vehicle.year} ${vehicle.title} · Arrived in New Zealand · ${order.complianceStage}`;
  const zhArrivalLabel = `${vehicle.year} ${vehicle.zhTitle} · 已抵达新西兰 · ${order.complianceStage}`;
  const nextReport: JapanWeeklyReportState = {
    ...currentReport,
    arrivedVehicles: nextVehicles,
    arrivals: Array.from(new Set([...(currentReport.arrivals ?? []), arrivalLabel])),
    zhArrivals: Array.from(new Set([...(currentReport.zhArrivals ?? []), zhArrivalLabel])),
    arrivalImages: Array.from(new Set([...(currentReport.arrivalImages ?? []), ...images])),
  };
  const nextReports = [nextReport, ...reports.slice(1)];
  await saveJapanSpecialOrdersState({ version: 2, reports: nextReports });
  return nextReport.issueNumber;
}

export function contractTitleFromContract(contract: VehicleContract) {
  const vehicle = vehicleNameFromContract(contract);
  const customer = contract.client.name || contract.depositAgreement?.clientName || 'Unnamed customer';
  const type =
    contract.contractType === 'deposit'
      ? 'Deposit'
      : contract.contractType === 'consignment'
        ? 'Consignment'
        : 'Purchase';

  return `${customer} - ${vehicle || type} (${contract.status})`;
}

export function mergeContractOrders(current: CrmState, contractOrders: CrmOrder[]) {
  if (contractOrders.length === 0) return current;

  let changed = false;
  const contractOrdersById = new Map(
    contractOrders
      .filter((order) => order.sourceContractId)
      .map((order) => [order.sourceContractId, order])
  );
  const mergedOrders = current.orders.map((order) => {
    if (!order.sourceContractId) return order;
    const fromContract = contractOrdersById.get(order.sourceContractId);
    if (!fromContract) return order;

    changed = true;
    return {
      ...order,
      ...fromContract,
      id: order.id,
      sourceLeadId: order.sourceLeadId,
      vehicleImages: order.vehicleImages ?? fromContract.vehicleImages,
      paymentStage: order.paymentStage || fromContract.paymentStage,
      complianceStage: order.complianceStage || fromContract.complianceStage,
      note: order.note || fromContract.note,
    };
  });

  const existingContractIds = new Set(
    mergedOrders.map((order) => order.sourceContractId).filter(Boolean)
  );
  const newOrders = contractOrders.filter(
    (order) => order.sourceContractId && !existingContractIds.has(order.sourceContractId)
  );

  if (newOrders.length > 0) changed = true;
  if (!changed) return current;

  return {
    ...current,
    orders: [...newOrders, ...mergedOrders],
  };
}
