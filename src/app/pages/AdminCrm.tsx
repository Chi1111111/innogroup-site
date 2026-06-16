import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
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

const ADMIN_SESSION_KEY = 'inno:admin:session:v1';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'innogroup2026';
const CRM_STORAGE_KEY = 'inno:crm:v2';

type LeadStatus = string;
type LeadFilter = string;
type CrmView = 'leads' | 'orders' | 'loanCars';

interface CrmLead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  contact: string;
  channel: string;
  interest: string;
  budget: string;
  status: LeadStatus;
  nextFollowUp: string;
  notes: string;
}

interface CrmOrder {
  id: string;
  sourceLeadId?: string;
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

interface LoanCar {
  id: string;
  vehicle: string;
  status: string;
}

interface CrmState {
  leads: CrmLead[];
  orders: CrmOrder[];
  loanCars: LoanCar[];
}

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
const COMPLIANCE_STAGE_OPTIONS = ['未到港', '处理中', 'MR2A已出', '罚款已交', '已上牌'];
const LOAN_CAR_STATUS_OPTIONS = ['借出', '在店'];

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
  paymentStage: '',
  balanceRemaining: '',
  salePrice: '',
  complianceStage: '',
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
            customerPhone: order.customerPhone ?? '',
            year: order.year ?? '',
            plateOrVin: order.plateOrVin ?? '',
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

export function AdminCrm() {
  const initialCrm = useMemo(() => loadCrm(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated'
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [crm, setCrm] = useState<CrmState>(initialCrm);
  const [leadDraft, setLeadDraft] = useState(EMPTY_LEAD);
  const [activeView, setActiveView] = useState<CrmView>('leads');
  const [activeStatus, setActiveStatus] = useState<LeadFilter>('all');
  const [activeLeadId, setActiveLeadId] = useState(initialCrm.leads[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [savedAt, setSavedAt] = useState('');

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
      setSavedAt(new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [crm]);

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
            paymentStage: '',
            balanceRemaining: '',
            salePrice: lead.budget,
            complianceStage: '',
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

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.trim() !== ADMIN_PASSWORD) {
      setLoginError('Password not correct, please try again.');
      return;
    }
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    setIsAuthenticated(true);
    setPassword('');
    setLoginError('');
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

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-600">CRM Workspace</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Field label="Password" type="password" value={password} onChange={setPassword} />
            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Sign In
            </button>
          </form>
          <Link to="/" className="mt-4 inline-flex text-sm text-slate-700 hover:text-slate-900">
            Back to website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Inno Group Admin
                </p>
                <h1 className="mt-2 text-3xl font-semibold">CRM 客户管理</h1>
                <p className="mt-2 text-sm text-slate-300">
                  阶段用筛选管理，客户资料用宽卡片展示，避免文字被压缩。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/admin"
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Supplier
                </Link>
                <Link
                  to="/admin/contracts"
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Contracts
                </Link>
                <button
                  type="button"
                  onClick={exportCrm}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} />
              已自动保存{savedAt ? ` ${savedAt}` : ''}
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
                <button
                  type="button"
                  onClick={addOrder}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
                >
                  <Plus size={16} />
                  添加订单
                </button>
                {crm.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    {order.sourceLeadId ? (
                      <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        已从客户线索转入
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
                        onChange={(value) => updateOrder(order.id, { complianceStage: value })}
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
                  </div>
                ))}
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
