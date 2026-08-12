import { type ClipboardEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import {
  CarFront,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react';
import {
  loadCrmState,
  saveCrmState,
  type CrmLead,
  type CrmOrder,
  type CrmState,
  type LoanCar,
} from '../lib/crm';
import { getErrorMessage, loadContracts, type VehicleContract } from '../lib/contracts';
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

const CRM_STORAGE_KEY = 'inno:crm:v2';

type LeadStatus = string;
type LeadFilter = string;
type CrmView = 'leads' | 'orders' | 'loanCars';

const LEAD_CHANNEL_OPTIONS = ['Ivan 小红书', 'Shawn 小红书', '网站', '介绍', 'Facebook', 'yuki'];
const CONTACT_METHOD_OPTIONS = [
  'Ivan 小红书',
  'Shawn 小红书',
  '邮件',
  '电话',
  'Facebook',
  'Ivan 微信',
  'Shawn 微信',
  '微信群',
];
const SALES_STAGE_OPTIONS = ['了解', '感兴趣', '选车', '定金', '完结'];
const PAYMENT_STAGE_OPTIONS = ['已付半款', '已付全款'];
const ARRIVED_COMPLIANCE_STAGE = '已到港／合规处理中';
const COMPLIANCE_STAGE_OPTIONS = ['未到港', '运输中', ARRIVED_COMPLIANCE_STAGE, 'MR2A已出', '罚款已交', '已上牌'];
const LOAN_CAR_STATUS_OPTIONS = ['借出', '在店'];

const CRM_ORDER_CONTRACT_TYPE = 'vehicle-purchase';
const COMPLETED_COMPLIANCE_STAGE = '已上牌';

const STAGES: Array<{ id: LeadFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'followup', label: '待跟进' },
  ...SALES_STAGE_OPTIONS.map((stage) => ({ id: stage, label: stage })),
];

const EMPTY_LEAD: Omit<CrmLead, 'id'> = {
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

const EMPTY_ORDER: Omit<CrmOrder, 'id'> = {
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

function createId(prefix: string) {
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

function loadCrm(): CrmState {
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

function normalizeCrmState(crm: CrmState | null | undefined): CrmState {
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

function isCrmOrderContract(contract: VehicleContract) {
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

function orderFromSignedContract(contract: VehicleContract): CrmOrder {
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

async function syncArrivedOrderToWeeklyReport(order: CrmOrder) {
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

function contractTitleFromContract(contract: VehicleContract) {
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

function mergeContractOrders(current: CrmState, contractOrders: CrmOrder[]) {
  if (contractOrders.length === 0) return current;

  let changed = false;
  const contractOrderIds = new Set(contractOrders.map((order) => order.sourceContractId));
  const mergedOrders = current.orders.map((order) => {
    if (!order.sourceContractId || !contractOrderIds.has(order.sourceContractId)) return order;

    const fromContract = contractOrders.find(
      (contractOrder) => contractOrder.sourceContractId === order.sourceContractId
    );
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

function statusClass(status: LeadStatus) {
  if (status === 'ordered') return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  if (status === '定金' || status === '完结') return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  if (status === 'lost') return 'bg-red-100 text-red-700 ring-red-200';
  if (status === '选车') return 'bg-blue-100 text-blue-800 ring-blue-200';
  if (status === 'interested') return 'bg-amber-100 text-amber-800 ring-amber-200';
  if (status === '感兴趣') return 'bg-amber-100 text-amber-800 ring-amber-200';
  if (status === 'contacted') return 'bg-blue-100 text-blue-800 ring-blue-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-NZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
      />
    </label>
  );
}

function ComboField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative block">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <input
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
        />
      </label>
      {isOpen ? (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-slate-400 hover:bg-slate-50"
          >
            空白
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left hover:bg-slate-50 ${
                option === value ? 'font-semibold text-slate-950' : 'text-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StatButton({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-slate-950 ring-2 ring-slate-950/10' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
    </button>
  );
}

async function automaticallyOrderVehicleImages(urls: string[]) {
  const scored = await Promise.all(
    urls.map(
      (url, index) =>
        new Promise<{ url: string; index: number; score: number }>((resolve) => {
          const image = new Image();
          const finish = (score: number) => resolve({ url, index, score });
          image.onload = () => {
            const ratio = image.naturalWidth / Math.max(image.naturalHeight, 1);
            const landscapePriority = ratio >= 1.2 ? 2_000_000_000 : ratio >= 0.9 ? 1_000_000_000 : 0;
            finish(landscapePriority + image.naturalWidth * image.naturalHeight);
          };
          image.onerror = () => finish(-index);
          image.src = url;
        })
    )
  );

  return scored
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.url);
}

function OrderVehiclePhotos({
  order,
  onChange,
}: {
  order: CrmOrder;
  onChange: (images: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const images = order.vehicleImages ?? [];

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= images.length) return;
    const nextImages = [...images];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, movedImage);
    onChange(nextImages);
  };

  const addImages = async (files: FileList | File[] | null) => {
    const selected = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!selected.length) return;
    setIsUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(selected.map((file) => uploadImageToCloudinary(file)));
      const ordered = await automaticallyOrderVehicleImages(
        Array.from(new Set([...images, ...uploaded]))
      );
      onChange(ordered);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedImages = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (!pastedImages.length) return;
    event.preventDefault();
    void addImages(pastedImages);
  };

  return (
    <div
      className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 outline-none transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">车辆照片</p>
          <p className="mt-1 text-xs text-slate-500">Ctrl + V 粘贴或选择图片，数量不限；可拖动照片调整顺序，第一张为客户页主图。</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black">
          {isUploading ? '上传中…' : '选择图片'}
          <input
            type="file"
            accept="image/*,.webp,.avif,.heic,.heif"
            multiple
            disabled={isUploading}
            className="hidden"
            onChange={(event) => {
              void addImages(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">上传失败：{error}</p> : null}
      {images.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((image, index) => (
            <div
              key={image}
              draggable
              onDragStart={() => setDraggedImageIndex(index)}
              onDragEnd={() => setDraggedImageIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedImageIndex !== null) moveImage(draggedImageIndex, index);
                setDraggedImageIndex(null);
              }}
              className={`relative overflow-hidden rounded-xl border bg-slate-100 transition ${draggedImageIndex === index ? 'border-blue-500 opacity-50' : index === 0 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
            >
              <img src={image} alt={`${order.vehicleModel || '车辆'} ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              {index === 0 ? <span className="absolute left-1.5 top-1.5 rounded-full bg-blue-700 px-2 py-1 text-[10px] font-bold text-white shadow">主图</span> : null}
              <button
                type="button"
                onClick={() => onChange(images.filter((item) => item !== image))}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 text-sm font-bold text-white shadow"
                aria-label={`删除第 ${index + 1} 张车辆照片`}
              >
                ×
              </button>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveImage(index, index - 1)}
                  className="flex h-7 flex-1 items-center justify-center rounded-md bg-black/70 text-xs font-bold text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`将第 ${index + 1} 张照片前移`}
                >
                  ← 前移
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => moveImage(index, index + 1)}
                  className="flex h-7 flex-1 items-center justify-center rounded-md bg-black/70 text-xs font-bold text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`将第 ${index + 1} 张照片后移`}
                >
                  后移 →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-4 py-7 text-center">
          <p className="text-sm font-bold text-blue-700">Ctrl + V 直接粘贴车辆截图</p>
          <p className="mt-1 text-xs text-slate-500">先点击这个区域，再粘贴；支持 JPG、PNG、WEBP</p>
        </div>
      )}
    </div>
  );
}

export function AdminCrm() {
  const initialCrm = useMemo(() => loadCrm(), []);
  const [crm, setCrm] = useState<CrmState>(initialCrm);
  const [leadDraft, setLeadDraft] = useState(EMPTY_LEAD);
  const [activeView, setActiveView] = useState<CrmView>('leads');
  const [activeStatus, setActiveStatus] = useState<LeadFilter>('all');
  const [activeLeadId, setActiveLeadId] = useState(initialCrm.leads[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const [cloudSyncNotice, setCloudSyncNotice] = useState('等待登录后同步 Supabase');
  const [hasLoadedCloudCrm, setHasLoadedCloudCrm] = useState(false);
  const [isSavingCloudCrm, setIsSavingCloudCrm] = useState(false);
  const [contractSyncNotice, setContractSyncNotice] = useState('');
  const [availableContracts, setAvailableContracts] = useState<VehicleContract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [contractImportNotice, setContractImportNotice] = useState('');
  const [arrivalSyncNotice, setArrivalSyncNotice] = useState<Record<string, string>>({});
  const [syncingArrivalOrderId, setSyncingArrivalOrderId] = useState('');

  useEffect(() => {
    document.title = 'Inno Group CRM Admin';
    let robotsMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    const previous = robotsMeta.content;
    robotsMeta.content = 'noindex, nofollow';
    return () => {
      robotsMeta.content = previous || 'index, follow';
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(crm));
    }

    if (!hasLoadedCloudCrm) return;

    let isMounted = true;
    setIsSavingCloudCrm(true);

    saveCrmState(crm)
      .then(() => {
        if (!isMounted) return;
        const nextSavedAt = new Date().toLocaleTimeString('en-NZ', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setSavedAt(nextSavedAt);
        setCloudSyncNotice(`Supabase 已保存 ${nextSavedAt}`);
      })
      .catch((error) => {
        if (!isMounted) return;
        setCloudSyncNotice(`Supabase 保存失败，本机已缓存：${getErrorMessage(error)}`);
      })
      .finally(() => {
        if (isMounted) setIsSavingCloudCrm(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crm, hasLoadedCloudCrm]);

  useEffect(() => {
    let isMounted = true;

    const loadCloudCrm = async () => {
      setCloudSyncNotice('正在从 Supabase 同步 CRM...');
      try {
        const cloudCrm = await loadCrmState();
        if (!isMounted) return;
        const nextCrm = normalizeCrmState(cloudCrm ?? loadCrm());
        setCrm(nextCrm);
        setActiveLeadId(nextCrm.leads[0]?.id ?? '');
        setHasLoadedCloudCrm(true);
        setCloudSyncNotice(cloudCrm ? '已从 Supabase 同步 CRM' : 'Supabase 暂无 CRM 数据，已使用本机缓存');
      } catch (error) {
        if (!isMounted) return;
        const localCrm = loadCrm();
        setCrm(localCrm);
        setActiveLeadId(localCrm.leads[0]?.id ?? '');
        setHasLoadedCloudCrm(true);
        setCloudSyncNotice(`Supabase 读取失败，暂用本机缓存：${getErrorMessage(error)}`);
      }
    };

    loadCloudCrm();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedCloudCrm) return;

    let isMounted = true;

    const syncSignedContracts = async () => {
      try {
        const contracts = await loadContracts();
        const signedOrders = contracts
          .filter((contract) => isCrmOrderContract(contract) && contract.status === 'signed')
          .map(orderFromSignedContract);

        if (!isMounted) return;
        setCrm((current) => mergeContractOrders(current, signedOrders));
        setContractSyncNotice(
          signedOrders.length > 0
            ? `已同步 ${signedOrders.length} 份已签合同`
            : '暂无已签合同可同步'
        );
      } catch (error) {
        if (!isMounted) return;
        setContractSyncNotice(`合同同步失败：${getErrorMessage(error)}`);
      }
    };

    syncSignedContracts();
    const intervalId = window.setInterval(syncSignedContracts, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [hasLoadedCloudCrm]);

  const filteredLeads = useMemo(() => {
    const text = query.trim().toLowerCase();
    return crm.leads.filter((lead) => {
      const matchesStage =
        activeStatus === 'all' ||
        (activeStatus === 'followup' ? Boolean(lead.nextFollowUp) : lead.status === activeStatus);
      const matchesSearch =
        !text ||
        [
          lead.createdAt,
          lead.name,
          lead.phone,
          lead.email,
          lead.contact,
          lead.channel,
          lead.interest,
          lead.budget,
          lead.notes,
        ]
          .join(' ')
          .toLowerCase()
          .includes(text);
      return matchesStage && matchesSearch;
    });
  }, [crm.leads, query, activeStatus]);

  const activeLead =
    crm.leads.find((lead) => lead.id === activeLeadId) ?? filteredLeads[0] ?? crm.leads[0] ?? null;
  const activeOrders = useMemo(
    () => crm.orders.filter((order) => order.complianceStage !== COMPLETED_COMPLIANCE_STAGE),
    [crm.orders]
  );
  const completedOrders = useMemo(
    () => crm.orders.filter((order) => order.complianceStage === COMPLETED_COMPLIANCE_STAGE),
    [crm.orders]
  );

  const addLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leadDraft.name.trim()) return;
    const nextLead = { ...leadDraft, id: createId('lead'), name: leadDraft.name.trim() };
    setCrm((current) => ({ ...current, leads: [nextLead, ...current.leads] }));
    setLeadDraft(EMPTY_LEAD);
    setActiveLeadId(nextLead.id);
    setActiveStatus('all');
    setActiveView('leads');
  };

  const addOrder = () => {
    setCrm((current) => ({
      ...current,
      orders: [{ ...EMPTY_ORDER, id: createId('order') }, ...current.orders],
    }));
  };

  const loadAvailableContracts = async () => {
    setIsLoadingContracts(true);
    setContractImportNotice('');
    try {
      const contracts = await loadContracts();
      const crmOrderContracts = contracts.filter(isCrmOrderContract);
      setAvailableContracts(crmOrderContracts);
      setSelectedContractId((current) => {
        if (crmOrderContracts.some((contract) => contract.id === current)) return current;
        return crmOrderContracts[0]?.id || '';
      });
      setContractImportNotice(
        crmOrderContracts.length > 0
          ? `已读取 ${crmOrderContracts.length} 份买车合同`
          : '当前没有可读取的买车合同'
      );
    } catch (error) {
      setContractImportNotice(`读取合同失败：${getErrorMessage(error)}`);
    } finally {
      setIsLoadingContracts(false);
    }
  };

  const importSelectedContract = () => {
    const contract = availableContracts.find((item) => item.id === selectedContractId);
    if (!contract) {
      setContractImportNotice('请先选择一份合同。');
      return;
    }
    if (!isCrmOrderContract(contract)) {
      setContractImportNotice('这份合同不是买车合同，不能导入 CRM 订单。');
      return;
    }

    setCrm((current) => mergeContractOrders(current, [orderFromSignedContract(contract)]));
    setActiveView('orders');
    setContractImportNotice(`已导入：${contractTitleFromContract(contract)}`);
  };

  const addLoanCar = () => {
    setCrm((current) => ({
      ...current,
      loanCars: [{ id: createId('loan'), vehicle: '', status: '在店' }, ...current.loanCars],
    }));
  };

  const updateLead = (id: string, patch: Partial<CrmLead>) => {
    setCrm((current) => ({
      ...current,
      leads: current.leads.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
      orders: current.orders.map((order) =>
        order.sourceLeadId === id
          ? {
              ...order,
              customerName: patch.name ?? order.customerName,
              customerPhone: patch.phone ?? order.customerPhone,
              vehicleModel: patch.interest ?? order.vehicleModel,
              salePrice: patch.budget ?? order.salePrice,
              note: patch.notes ?? order.note,
            }
          : order
      ),
    }));
  };

  const convertLeadToOrder = (id: string) => {
    setCrm((current) => {
      const lead = current.leads.find((item) => item.id === id);
      if (!lead) return current;

      const nextLeads = current.leads.map((item) =>
        item.id === id ? { ...item, status: '定金' } : item
      );
      const hasLinkedOrder = current.orders.some((order) => order.sourceLeadId === id);

      if (hasLinkedOrder) {
        return { ...current, leads: nextLeads };
      }

      return {
        ...current,
        leads: nextLeads,
        orders: [
          {
            id: createId('order'),
            sourceLeadId: id,
            customerName: lead.name,
            orderDate: new Date().toISOString().slice(0, 10),
            customerPhone: lead.phone,
            vehicleModel: lead.interest,
            year: '',
            plateOrVin: '',
            vehicleImages: [],
            paymentStage: '',
            balanceRemaining: '',
            salePrice: lead.budget,
            complianceStage: '未到港',
            note: lead.notes,
          },
          ...current.orders,
        ],
      };
    });
    setActiveStatus('定金');
    setActiveView('orders');
  };

  const handleLeadStatusChange = (id: string, status: LeadStatus) => {
    if (status === '定金') {
      convertLeadToOrder(id);
      return;
    }
    updateLead(id, { status });
  };

  const updateOrder = (id: string, patch: Partial<CrmOrder>) => {
    setCrm((current) => ({
      ...current,
      orders: current.orders.map((order) => (order.id === id ? { ...order, ...patch } : order)),
    }));
  };

  const syncOrderArrival = async (order: CrmOrder) => {
    setSyncingArrivalOrderId(order.id);
    setArrivalSyncNotice((current) => ({ ...current, [order.id]: '正在同步到本期周报…' }));
    try {
      const issueNumber = await syncArrivedOrderToWeeklyReport(order);
      setArrivalSyncNotice((current) => ({
        ...current,
        [order.id]: `已同步到 Inno Auto Weekly 第 ${issueNumber} 期的“本周实际到港”。`,
      }));
    } catch (error) {
      setArrivalSyncNotice((current) => ({
        ...current,
        [order.id]: getErrorMessage(error),
      }));
    } finally {
      setSyncingArrivalOrderId('');
    }
  };

  const updateOrderCompliance = (order: CrmOrder, complianceStage: string) => {
    const nextOrder = { ...order, complianceStage };
    updateOrder(order.id, { complianceStage });
    if (complianceStage === ARRIVED_COMPLIANCE_STAGE && (order.vehicleImages?.length ?? 0) > 0) {
      void syncOrderArrival(nextOrder);
    } else if (complianceStage === ARRIVED_COMPLIANCE_STAGE) {
      setArrivalSyncNotice((current) => ({
        ...current,
        [order.id]: '已标记为到港。请先上传至少一张车辆照片，然后点击“同步到本周到港”。',
      }));
    }
  };

  const updateOrderImages = (order: CrmOrder, vehicleImages: string[]) => {
    const nextOrder = { ...order, vehicleImages };
    updateOrder(order.id, { vehicleImages });
    if (order.complianceStage === ARRIVED_COMPLIANCE_STAGE && vehicleImages.length > 0) {
      void syncOrderArrival(nextOrder);
    }
  };

  const updateLoanCar = (id: string, patch: Partial<LoanCar>) => {
    setCrm((current) => ({
      ...current,
      loanCars: current.loanCars.map((car) => (car.id === id ? { ...car, ...patch } : car)),
    }));
  };

  const deleteLead = (id: string) => {
    if (!window.confirm('Delete this customer?')) return;
    setCrm((current) => ({ ...current, leads: current.leads.filter((lead) => lead.id !== id) }));
    setActiveLeadId((current) => (current === id ? '' : current));
  };

  const deleteOrder = (id: string) => {
    if (!window.confirm('Delete this order?')) return;
    setCrm((current) => ({ ...current, orders: current.orders.filter((order) => order.id !== id) }));
  };

  const deleteLoanCar = (id: string) => {
    if (!window.confirm('Delete this loan car?')) return;
    setCrm((current) => ({
      ...current,
      loanCars: current.loanCars.filter((car) => car.id !== id),
    }));
  };

  const exportCrm = () => {
    const blob = new Blob([JSON.stringify(crm, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `inno-crm-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Inno Group 后台
                </p>
                <h1 className="mt-2 text-3xl font-semibold">CRM 客户管理</h1>
                <p className="mt-2 text-sm text-slate-300">
                  按阶段筛选客户、管理跟进、订单和借车记录。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/admin"
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  内容管理
                </Link>
                <Link
                  to="/admin/contracts"
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  合同管理
                </Link>
                <Link
                  to="/admin/invoices"
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  发票管理
                </Link>
                <button
                  type="button"
                  onClick={exportCrm}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  <Download size={16} />
                  导出
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} />
              已自动保存{savedAt ? ` ${savedAt}` : ''}
            </p>
            {contractSyncNotice ? (
              <p className="text-sm font-medium text-slate-500">{contractSyncNotice}</p>
            ) : null}
            <p className="text-sm font-medium text-slate-500">
              {cloudSyncNotice}
              {isSavingCloudCrm ? '，保存中...' : ''}
            </p>
            <label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:w-96">
              <Search size={17} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索客户、车型、备注"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <StatButton
            label="客户线索"
            value={crm.leads.length}
            icon={UsersRound}
            active={activeView === 'leads'}
            onClick={() => setActiveView('leads')}
          />
          <StatButton
            label="已下单"
            value={crm.orders.length}
            icon={FileText}
            active={activeView === 'orders'}
            onClick={() => setActiveView('orders')}
          />
          <StatButton
            label="代步车"
            value={crm.loanCars.length}
            icon={CarFront}
            active={activeView === 'loanCars'}
            onClick={() => setActiveView('loanCars')}
          />
        </section>

        <section className="space-y-5">
          <form
            onSubmit={addLead}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">新增线索</h2>
                <p className="mt-1 text-sm text-slate-500">横向录入，保存后进入客户列表。</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Plus size={18} />
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Field
                label="创建日期"
                type="date"
                value={leadDraft.createdAt}
                onChange={(value) =>
                  setLeadDraft((current) => ({ ...current, createdAt: value }))
                }
              />
              <Field
                label="客户姓名"
                value={leadDraft.name}
                onChange={(value) => setLeadDraft((current) => ({ ...current, name: value }))}
              />
              <Field
                label="电话"
                value={leadDraft.phone}
                onChange={(value) => setLeadDraft((current) => ({ ...current, phone: value }))}
              />
              <Field
                label="Email"
                type="email"
                value={leadDraft.email}
                onChange={(value) => setLeadDraft((current) => ({ ...current, email: value }))}
              />
              <ComboField
                label="负责人"
                value={leadDraft.contact}
                onChange={(value) => setLeadDraft((current) => ({ ...current, contact: value }))}
                options={LEAD_CHANNEL_OPTIONS}
              />
              <ComboField
                label="渠道"
                value={leadDraft.channel}
                onChange={(value) => setLeadDraft((current) => ({ ...current, channel: value }))}
                options={CONTACT_METHOD_OPTIONS}
              />
              <Field
                label="目标车型"
                value={leadDraft.interest}
                onChange={(value) => setLeadDraft((current) => ({ ...current, interest: value }))}
              />
              <Field
                label="预算"
                value={leadDraft.budget}
                onChange={(value) => setLeadDraft((current) => ({ ...current, budget: value }))}
              />
              <Field
                label="最后联系日期"
                type="date"
                value={leadDraft.nextFollowUp}
                onChange={(value) =>
                  setLeadDraft((current) => ({ ...current, nextFollowUp: value }))
                }
              />
              <button
                type="submit"
                className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                保存线索
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {activeView === 'leads'
                    ? '客户线索'
                    : activeView === 'orders'
                      ? '订单管理'
                      : '代步车管理'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeView === 'leads'
                    ? '用阶段筛选查看客户，选中后在右侧编辑详情。'
                    : activeView === 'orders'
                      ? '订单独立维护，不和线索混在一起。'
                      : '车辆和状态独立维护。'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['leads', 'orders', 'loanCars'] as CrmView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveView(view)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      activeView === view
                        ? 'bg-slate-950 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {view === 'leads' ? '客户' : view === 'orders' ? '已下单' : '代步车'}
                  </button>
                ))}
              </div>
            </div>

            {activeView === 'leads' ? (
              <div className="p-5">
                <div className="mb-4 flex flex-wrap gap-2">
                  {STAGES.map((stage) => {
                    const count =
                      stage.id === 'all'
                        ? crm.leads.length
                        : stage.id === 'followup'
                          ? crm.leads.filter((lead) => lead.nextFollowUp).length
                        : crm.leads.filter((lead) => lead.status === stage.id).length;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setActiveStatus(stage.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          activeStatus === stage.id
                            ? 'bg-slate-950 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {stage.label} {count}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  {filteredLeads.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                      没有符合条件的客户。
                    </div>
                  ) : (
                    filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          <Field
                            label="创建日期"
                            type="date"
                            value={lead.createdAt}
                            onChange={(value) => updateLead(lead.id, { createdAt: value })}
                          />
                          <Field
                            label="客户姓名"
                            value={lead.name}
                            onChange={(value) => updateLead(lead.id, { name: value })}
                          />
                          <Field
                            label="电话"
                            value={lead.phone}
                            onChange={(value) => updateLead(lead.id, { phone: value })}
                          />
                          <Field
                            label="Email"
                            type="email"
                            value={lead.email}
                            onChange={(value) => updateLead(lead.id, { email: value })}
                          />
                          <ComboField
                            label="负责人"
                            value={lead.contact}
                            onChange={(value) => updateLead(lead.id, { contact: value })}
                            options={LEAD_CHANNEL_OPTIONS}
                          />
                          <Field
                            label="目标车型"
                            value={lead.interest}
                            onChange={(value) => updateLead(lead.id, { interest: value })}
                          />
                          <Field
                            label="预算"
                            value={lead.budget}
                            onChange={(value) => updateLead(lead.id, { budget: value })}
                          />
                          <Field
                            label="最后联系日期"
                            type="date"
                            value={lead.nextFollowUp}
                            onChange={(value) => updateLead(lead.id, { nextFollowUp: value })}
                          />
                          <button
                            type="button"
                            onClick={() => deleteLead(lead.id)}
                            className="mt-5 h-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete customer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 grid gap-3 xl:grid-cols-[150px_170px_1fr]">
                          <ComboField
                            label="渠道"
                            value={lead.channel}
                            onChange={(value) => updateLead(lead.id, { channel: value })}
                            options={CONTACT_METHOD_OPTIONS}
                          />
                          <ComboField
                            label="销售阶段"
                            value={lead.status}
                            onChange={(value) => handleLeadStatusChange(lead.id, value)}
                            options={SALES_STAGE_OPTIONS}
                          />
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              备注
                            </span>
                            <textarea
                              value={lead.notes}
                              onChange={(event) => updateLead(lead.id, { notes: event.target.value })}
                              rows={2}
                              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
                            />
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {activeView === 'orders' ? (
              <div className="space-y-3 p-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <button
                      type="button"
                      onClick={addOrder}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                    >
                      <Plus size={16} />
                      添加订单
                    </button>
                    <button
                      type="button"
                      onClick={loadAvailableContracts}
                      disabled={isLoadingContracts}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileText size={16} />
                      {isLoadingContracts ? '读取中...' : '读取合同'}
                    </button>

                    {availableContracts.length > 0 ? (
                      <>
                        <label className="min-w-[280px] flex-1">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            选择合同
                          </span>
                          <select
                            value={selectedContractId}
                            onChange={(event) => setSelectedContractId(event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
                          >
                            {availableContracts.map((contract) => (
                              <option key={contract.id} value={contract.id}>
                                {contractTitleFromContract(contract)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={importSelectedContract}
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          加载到已下单
                        </button>
                      </>
                    ) : null}
                  </div>
                  {contractImportNotice ? (
                    <p className="mt-3 text-sm font-medium text-slate-500">{contractImportNotice}</p>
                  ) : null}
                </div>
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    {order.sourceLeadId ? (
                      <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        已从客户线索转入
                      </div>
                    ) : null}
                    {order.sourceContractId ? (
                      <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        已从已签合同同步
                      </div>
                    ) : null}
                    <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_1fr_100px_150px_40px]">
                      <Field
                        label="客户姓名"
                        value={order.customerName}
                        onChange={(value) => updateOrder(order.id, { customerName: value })}
                      />
                      <Field
                        label="下单日期"
                        type="date"
                        value={order.orderDate}
                        onChange={(value) => updateOrder(order.id, { orderDate: value })}
                      />
                      <Field
                        label="电话"
                        value={order.customerPhone}
                        onChange={(value) => updateOrder(order.id, { customerPhone: value })}
                      />
                      <Field
                        label="车型"
                        value={order.vehicleModel}
                        onChange={(value) => updateOrder(order.id, { vehicleModel: value })}
                      />
                      <Field
                        label="年份"
                        value={order.year}
                        onChange={(value) => updateOrder(order.id, { year: value })}
                      />
                      <Field
                        label="Plate / VIN"
                        value={order.plateOrVin}
                        onChange={(value) => updateOrder(order.id, { plateOrVin: value })}
                      />
                      <button
                        type="button"
                        onClick={() => deleteOrder(order.id)}
                        className="mt-5 h-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-[150px_150px_150px_170px_1fr]">
                      <ComboField
                        label="款项阶段"
                        value={order.paymentStage}
                        onChange={(value) => updateOrder(order.id, { paymentStage: value })}
                        options={PAYMENT_STAGE_OPTIONS}
                      />
                      <Field
                        label="剩余款项"
                        value={order.balanceRemaining}
                        onChange={(value) => updateOrder(order.id, { balanceRemaining: value })}
                      />
                      <Field
                        label="成交价"
                        value={order.salePrice}
                        onChange={(value) => updateOrder(order.id, { salePrice: value })}
                      />
                      <ComboField
                        label="Compliance"
                        value={order.complianceStage}
                        onChange={(value) => updateOrderCompliance(order, value)}
                        options={COMPLIANCE_STAGE_OPTIONS}
                      />
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          NOTE
                        </span>
                        <textarea
                          value={order.note}
                          onChange={(event) => updateOrder(order.id, { note: event.target.value })}
                          rows={2}
                          className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
                        />
                      </label>
                    </div>
                    <OrderVehiclePhotos
                      order={order}
                      onChange={(vehicleImages) => updateOrderImages(order, vehicleImages)}
                    />
                    {order.complianceStage === ARRIVED_COMPLIANCE_STAGE ? (
                      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-sky-900">{arrivalSyncNotice[order.id] || '这台车已标记到港，可以同步到本期客户周报。'}</p>
                        <button
                          type="button"
                          disabled={syncingArrivalOrderId === order.id || !(order.vehicleImages?.length ?? 0)}
                          onClick={() => void syncOrderArrival(order)}
                          className="shrink-0 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {syncingArrivalOrderId === order.id ? '同步中…' : '同步到本周到港'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {completedOrders.length > 0 ? (
                  <details className="rounded-2xl border border-slate-200 bg-white">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                      处理完 ({completedOrders.length})
                    </summary>
                    <div className="space-y-3 border-t border-slate-100 p-4">
                      {completedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          {order.sourceLeadId ? (
                            <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              已从客户线索转入
                            </div>
                          ) : null}
                          {order.sourceContractId ? (
                            <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                              已从已签合同同步
                            </div>
                          ) : null}
                          <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_1fr_100px_150px_40px]">
                            <Field
                              label="客户姓名"
                              value={order.customerName}
                              onChange={(value) => updateOrder(order.id, { customerName: value })}
                            />
                            <Field
                              label="下单日期"
                              type="date"
                              value={order.orderDate}
                              onChange={(value) => updateOrder(order.id, { orderDate: value })}
                            />
                            <Field
                              label="电话"
                              value={order.customerPhone}
                              onChange={(value) => updateOrder(order.id, { customerPhone: value })}
                            />
                            <Field
                              label="车型"
                              value={order.vehicleModel}
                              onChange={(value) => updateOrder(order.id, { vehicleModel: value })}
                            />
                            <Field
                              label="年份"
                              value={order.year}
                              onChange={(value) => updateOrder(order.id, { year: value })}
                            />
                            <Field
                              label="Plate / VIN"
                              value={order.plateOrVin}
                              onChange={(value) => updateOrder(order.id, { plateOrVin: value })}
                            />
                            <button
                              type="button"
                              onClick={() => deleteOrder(order.id)}
                              className="mt-5 h-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete order"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-[150px_150px_150px_170px_1fr]">
                            <ComboField
                              label="款项阶段"
                              value={order.paymentStage}
                              onChange={(value) => updateOrder(order.id, { paymentStage: value })}
                              options={PAYMENT_STAGE_OPTIONS}
                            />
                            <Field
                              label="剩余款项"
                              value={order.balanceRemaining}
                              onChange={(value) => updateOrder(order.id, { balanceRemaining: value })}
                            />
                            <Field
                              label="成交价"
                              value={order.salePrice}
                              onChange={(value) => updateOrder(order.id, { salePrice: value })}
                            />
                            <ComboField
                              label="Compliance"
                              value={order.complianceStage}
                              onChange={(value) => updateOrderCompliance(order, value)}
                              options={COMPLIANCE_STAGE_OPTIONS}
                            />
                            <label className="block">
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                NOTE
                              </span>
                              <textarea
                                value={order.note}
                                onChange={(event) => updateOrder(order.id, { note: event.target.value })}
                                rows={2}
                                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
                              />
                            </label>
                          </div>
                          <OrderVehiclePhotos
                            order={order}
                            onChange={(vehicleImages) => updateOrderImages(order, vehicleImages)}
                          />
                          {order.complianceStage === ARRIVED_COMPLIANCE_STAGE ? (
                            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-medium text-sky-900">{arrivalSyncNotice[order.id] || '这台车已标记到港，可以同步到本期客户周报。'}</p>
                              <button
                                type="button"
                                disabled={syncingArrivalOrderId === order.id || !(order.vehicleImages?.length ?? 0)}
                                onClick={() => void syncOrderArrival(order)}
                                className="shrink-0 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                {syncingArrivalOrderId === order.id ? '同步中…' : '同步到本周到港'}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}

            {activeView === 'loanCars' ? (
              <div className="space-y-3 p-5">
                <button
                  type="button"
                  onClick={addLoanCar}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                >
                  <Plus size={16} />
                  添加代步车
                </button>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {crm.loanCars.map((car) => (
                    <div key={car.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <CarFront className="mt-2 text-slate-400" size={20} />
                        <button
                          type="button"
                          onClick={() => deleteLoanCar(car.id)}
                          className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete loan car"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-4 space-y-3">
                        <Field
                          label="车型"
                          value={car.vehicle}
                          onChange={(value) => updateLoanCar(car.id, { vehicle: value })}
                        />
                        <ComboField
                          label="状态"
                          value={car.status}
                          onChange={(value) => updateLoanCar(car.id, { status: value })}
                          options={LOAN_CAR_STATUS_OPTIONS}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
