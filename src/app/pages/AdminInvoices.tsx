import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  LogOut,
  Mail,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { formatDateTime, getErrorMessage, loadContracts, type VehicleContract } from '../lib/contracts';
import { sendInvoiceEmail } from '../lib/invoiceEmail';
import { signOutAdmin } from '../lib/adminAuth';
import { createInvoicePdfAttachment, downloadInvoicePdf } from '../lib/invoicePdf';
import {
  COMPANY_DETAILS,
  createEmptyInvoice,
  createInvoiceLineItem,
  deleteInvoice,
  formatNzd,
  getInvoiceTotal,
  INVOICE_STORAGE_MODE,
  loadInvoices,
  upsertInvoice,
  type CommercialInvoice,
  type InvoiceLineItem,
  type InvoiceStatus,
} from '../lib/invoices';

type Notice = { type: 'success' | 'error' | 'info'; text: string } | null;

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: '草稿',
  issued: '已开具',
  paid: '已付款',
  void: '已作废',
};

function inputClass() {
  return 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70';
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
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass()}
      />
    </label>
  );
}

function statusClass(status: InvoiceStatus) {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-800';
  if (status === 'issued') return 'bg-blue-100 text-blue-800';
  if (status === 'void') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
}

function noticeClass(type: NonNullable<Notice>['type']) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function contractLabel(contract: VehicleContract) {
  const vehicle = [contract.purchasedVehicle.year, contract.purchasedVehicle.make, contract.purchasedVehicle.model]
    .filter(Boolean)
    .join(' ');
  return `${contract.client.name || '未命名客户'} · ${vehicle || contract.contractType}`;
}

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<CommercialInvoice[]>([]);
  const [contracts, setContracts] = useState<VehicleContract[]>([]);
  const [active, setActive] = useState<CommercialInvoice>(() => createEmptyInvoice());
  const [selectedContractId, setSelectedContractId] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [notice, setNotice] = useState<Notice>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    document.title = 'Inno Group Invoice Admin';
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([loadInvoices(), loadContracts()]).then(([invoiceResult, contractResult]) => {
      if (cancelled) return;

      if (invoiceResult.status === 'fulfilled') {
        setInvoices(invoiceResult.value);
      } else {
        setNotice({ type: 'error', text: `无法加载发票：${getErrorMessage(invoiceResult.reason)}` });
      }

      if (contractResult.status === 'fulfilled') {
        setContracts(contractResult.value.filter((contract) => contract.contractType === 'vehicle-purchase'));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((invoice) =>
      [invoice.invoiceNo, invoice.customer.name, invoice.vehicle.make, invoice.vehicle.model, invoice.vehicle.vin, invoice.vehicle.registration]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [invoices, search]);

  const stats = useMemo(() => ({
    draft: invoices.filter((invoice) => invoice.status === 'draft').length,
    issued: invoices.filter((invoice) => invoice.status === 'issued').length,
    paid: invoices.filter((invoice) => invoice.status === 'paid').length,
    outstanding: invoices
      .filter((invoice) => invoice.status === 'issued')
      .reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0),
  }), [invoices]);

  const handleLogout = async () => {
    setIsBusy(true);
    try {
      await signOutAdmin();
    } finally {
      setInvoices([]);
      setIsBusy(false);
    }
  };

  const createNew = () => {
    setActive(createEmptyInvoice());
    setSelectedContractId('');
    setNotice(null);
    setView('editor');
  };

  const openInvoice = (invoice: CommercialInvoice) => {
    setActive(invoice);
    setSelectedContractId(invoice.sourceContractId ?? '');
    setNotice(null);
    setView('editor');
  };

  const updateCustomer = (key: keyof CommercialInvoice['customer'], value: string) => {
    setActive((current) => ({ ...current, customer: { ...current.customer, [key]: value } }));
  };

  const updateVehicle = (key: keyof CommercialInvoice['vehicle'], value: string) => {
    setActive((current) => ({ ...current, vehicle: { ...current.vehicle, [key]: value } }));
  };

  const updateLineItem = (itemId: string, patch: Partial<InvoiceLineItem>) => {
    setActive((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  };

  const removeLineItem = (itemId: string) => {
    setActive((current) => ({
      ...current,
      lineItems: current.lineItems.length > 1 ? current.lineItems.filter((item) => item.id !== itemId) : current.lineItems,
    }));
  };

  const importContract = () => {
    const contract = contracts.find((item) => item.id === selectedContractId);
    if (!contract) {
      setNotice({ type: 'error', text: '请先选择一份车辆购买合同。' });
      return;
    }

    const salePrice = parseMoney(contract.payment.salePriceIncGst || contract.payment.netPrice);
    const vinOrRegistration = contract.purchasedVehicle.vinOrRegistration.trim();
    const looksLikeVin = /^[A-HJ-NPR-Z0-9]{17}$/i.test(vinOrRegistration);
    setActive((current) => ({
      ...current,
      sourceContractId: contract.id,
      customer: {
        name: contract.client.name,
        address: contract.client.address,
        email: contract.client.email,
        phone: contract.client.phone,
      },
      vehicle: {
        make: contract.purchasedVehicle.make,
        model: contract.purchasedVehicle.model,
        year: contract.purchasedVehicle.year,
        vin: looksLikeVin ? vinOrRegistration : '',
        registration: looksLikeVin ? '' : vinOrRegistration,
        colour: contract.purchasedVehicle.colour,
        engineCapacity: contract.purchasedVehicle.engineCapacity,
      },
      lineItems: current.lineItems.map((item, index) => index === 0 ? {
        ...item,
        description: 'CAR PRICE',
        unitPrice: salePrice,
      } : item),
    }));
    setNotice({ type: 'success', text: '客户、车辆和合同售价已带入发票。系统已自动判断 VIN 或车牌，请再核对一次。' });
  };

  const save = async (status: InvoiceStatus = active.status): Promise<CommercialInvoice | null> => {
    if (!active.invoiceNo.trim()) {
      setNotice({ type: 'error', text: '请填写 Invoice Ref No。' });
      return null;
    }
    if (status !== 'draft' && !active.issueDate) {
      setNotice({ type: 'error', text: '正式开具前请填写发票日期。' });
      return null;
    }
    if (status !== 'draft' && !active.customer.name.trim()) {
      setNotice({ type: 'error', text: '正式开具前请填写客户或公司名称。' });
      return null;
    }
    if (status !== 'draft' && getInvoiceTotal(active) <= 0) {
      setNotice({ type: 'error', text: '正式开具前请填写大于 0 的发票金额。' });
      return null;
    }
    if (status === 'paid' && active.status !== 'issued' && active.status !== 'paid') {
      setNotice({ type: 'error', text: '发票必须先开具，之后才能标记为已付款。' });
      return null;
    }
    if (status === 'void' && active.status !== 'issued' && active.status !== 'paid') {
      setNotice({ type: 'error', text: '只有已开具或已付款的发票可以作废。' });
      return null;
    }

    const now = new Date().toISOString();
    const next: CommercialInvoice = {
      ...active,
      status,
      updatedAt: now,
      issuedAt: status === 'issued' ? active.issuedAt ?? now : active.issuedAt,
      paidAt: status === 'paid' ? active.paidAt ?? now : active.paidAt,
    };

    setIsBusy(true);
    try {
      setInvoices(await upsertInvoice(next));
      setActive(next);
      setNotice({
        type: 'success',
        text: status === 'paid'
          ? '发票已标记为已付款。'
          : status === 'issued'
            ? '发票已开具并保存。'
            : status === 'void'
              ? '发票已作废并保留审计记录。'
              : '发票草稿已保存。',
      });
      return next;
    } catch (error) {
      setNotice({ type: 'error', text: `无法保存发票：${getErrorMessage(error)}` });
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const downloadPdf = async () => {
    setIsBusy(true);
    try {
      const filename = await downloadInvoicePdf(active.invoiceNo);
      setNotice({ type: 'success', text: `PDF 已生成：${filename}` });
    } catch (error) {
      setNotice({ type: 'error', text: `无法生成 PDF：${getErrorMessage(error)}` });
    } finally {
      setIsBusy(false);
    }
  };

  const sendToCustomer = async () => {
    const recipient = active.customer.email.trim();
    if (!isValidEmail(recipient)) {
      setNotice({ type: 'error', text: '请先填写一个有效的客户邮箱。' });
      return;
    }
    if (active.status === 'void') {
      setNotice({ type: 'error', text: '已作废的发票不能发送给客户。' });
      return;
    }

    const prepared = await save(active.status === 'draft' ? 'issued' : active.status);
    if (!prepared) return;

    setIsBusy(true);
    try {
      const attachment = await createInvoicePdfAttachment(prepared.invoiceNo);
      const result = await sendInvoiceEmail(prepared.id, attachment);
      const sent: CommercialInvoice = {
        ...prepared,
        lastSentAt: result.sentAt,
        lastSentTo: result.recipient,
        sendCount: result.sendCount,
        updatedAt: result.sentAt,
      };
      setActive(sent);
      setInvoices((current) => current.map((invoice) => invoice.id === sent.id ? sent : invoice));
      setNotice({ type: 'success', text: `发票 PDF 已通过 Resend 发送到 ${result.recipient}。` });
    } catch (error) {
      setNotice({ type: 'error', text: `邮件发送失败：${getErrorMessage(error)}` });
    } finally {
      setIsBusy(false);
    }
  };

  const duplicate = () => {
    const copy = createEmptyInvoice();
    setActive({
      ...active,
      id: copy.id,
      invoiceNo: copy.invoiceNo,
      status: 'draft',
      issueDate: copy.issueDate,
      createdAt: copy.createdAt,
      updatedAt: copy.updatedAt,
      issuedAt: undefined,
      paidAt: undefined,
      lastSentAt: undefined,
      lastSentTo: undefined,
      sendCount: 0,
      lineItems: active.lineItems.map((item) => ({ ...item, id: createInvoiceLineItem().id })),
    });
    setNotice({ type: 'info', text: '已复制为新的发票草稿，保存后会加入发票库。' });
  };

  const remove = async () => {
    const exists = invoices.some((invoice) => invoice.id === active.id);
    if (!exists) {
      setActive(createEmptyInvoice());
      setView('library');
      return;
    }
    if (active.status !== 'draft') {
      setNotice({ type: 'error', text: '已开具的发票不能删除，请使用“作废”保留记录。' });
      return;
    }
    if (!window.confirm(`确定删除发票 ${active.invoiceNo} 吗？`)) return;

    setIsBusy(true);
    try {
      setInvoices(await deleteInvoice(active.id));
      setActive(createEmptyInvoice());
      setView('library');
      setNotice({ type: 'success', text: '发票已删除。' });
    } catch (error) {
      setNotice({ type: 'error', text: `无法删除发票：${getErrorMessage(error)}` });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#faf4e8_0,#eef4f8_34%,#f8fafc_70%)] px-4 py-6 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1540px] space-y-5 print:max-w-none print:space-y-0">
        <header className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 backdrop-blur-xl print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7a06d]">Inno Group finance</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">发票管理</h1>
              <p className="mt-2 text-sm text-slate-600">从合同带入资料，管理 Commercial Invoice，并打印或另存为 PDF。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/contracts" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300">合同管理</Link>
              <Link to="/admin/crm" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300">CRM 管理</Link>
              <button type="button" disabled={isBusy} onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300 disabled:opacity-50">
                <LogOut size={15} />退出
              </button>
              <button type="button" onClick={createNew} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 hover:bg-black">
                <Plus size={16} />新建发票
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1.5">
              <button type="button" onClick={() => setView('library')} className={`rounded-full px-5 py-2 text-sm font-semibold ${view === 'library' ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>发票库</button>
              <button type="button" onClick={() => setView('editor')} className={`rounded-full px-5 py-2 text-sm font-semibold ${view === 'editor' ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>编辑与预览</button>
            </div>
            {notice ? <div className={`rounded-xl border px-4 py-2.5 text-sm ${noticeClass(notice.type)}`}>{notice.text}</div> : null}
          </div>
          {INVOICE_STORAGE_MODE === 'local-preview' ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              本地预览模式：发票记录只保存在当前浏览器。发送功能需要 Supabase 云端模式。
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <ShieldCheck size={16} />云端发票库与 Resend 发送接口已启用；每次发送都会写入审计记录。
            </div>
          )}
        </header>

        {view === 'library' ? (
          <main className="space-y-5 print:hidden">
            <section className="grid gap-4 md:grid-cols-4">
              {[
                ['草稿', String(stats.draft)],
                ['已开具', String(stats.issued)],
                ['已付款', String(stats.paid)],
                ['待收金额', formatNzd(stats.outstanding)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
                </div>
              ))}
            </section>

            <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Commercial Invoice 发票库</h2>
                  <p className="mt-1 text-sm text-slate-500">共 {invoices.length} 份发票</p>
                </div>
                <label className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:w-96">
                  <Search size={17} className="text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索编号、客户、车辆、VIN..." className="w-full bg-transparent text-sm outline-none" />
                </label>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <div className="p-10 text-center">
                    <FileText className="mx-auto text-slate-300" size={32} />
                    <p className="mt-3 text-sm text-slate-500">暂无匹配发票。</p>
                  </div>
                ) : filteredInvoices.map((invoice) => (
                  <button key={invoice.id} type="button" onClick={() => openInvoice(invoice)} className="grid w-full gap-3 px-6 py-5 text-left hover:bg-slate-50 lg:grid-cols-[150px_1.2fr_1fr_170px_110px] lg:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{invoice.invoiceNo}</p>
                      <p className="mt-1 text-xs text-slate-400">{invoice.issueDate}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{invoice.customer.name || '未命名客户'}</p>
                      <p className="mt-1 text-sm text-slate-500">{[invoice.vehicle.year, invoice.vehicle.make, invoice.vehicle.model].filter(Boolean).join(' ') || '未填写车辆'}</p>
                      <p className="mt-1 text-xs text-slate-400">{invoice.lastSentAt ? `已发送至 ${invoice.lastSentTo}` : '尚未发送客户'}</p>
                    </div>
                    <p className="text-sm text-slate-500">{invoice.vehicle.vin || invoice.vehicle.registration || '暂无 VIN / Rego'}</p>
                    <p className="font-semibold text-slate-950">{formatNzd(getInvoiceTotal(invoice))}</p>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(invoice.status)}`}>{STATUS_LABELS[invoice.status]}</span>
                  </button>
                ))}
              </div>
            </section>
          </main>
        ) : (
          <main className="grid gap-5 xl:grid-cols-[minmax(420px,520px)_1fr] print:block">
            <aside className="space-y-4 print:hidden">
              <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5">
                <div className="flex flex-wrap gap-2">
                  {active.status !== 'void' ? (
                    <button type="button" disabled={isBusy} onClick={() => void save(active.status)} className="rounded-full bg-[#d2a968] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">{active.status === 'draft' ? '保存草稿' : '保存修改'}</button>
                  ) : null}
                  {active.status === 'draft' ? (
                    <button type="button" disabled={isBusy} onClick={() => void save('issued')} className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">开具发票</button>
                  ) : null}
                  {active.status === 'issued' ? (
                    <button type="button" disabled={isBusy} onClick={() => void save('paid')} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15} />已付款</button>
                  ) : null}
                  {active.status === 'issued' || active.status === 'paid' ? (
                    <button type="button" disabled={isBusy} onClick={() => void save('void')} className="rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50">作废</button>
                  ) : null}
                  {active.status !== 'void' ? (
                    <button type="button" disabled={isBusy} onClick={() => void sendToCustomer()} className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/15 disabled:opacity-50"><Mail size={15} />{active.status === 'draft' ? '开具并发送' : '发送客户'}</button>
                  ) : null}
                  <button type="button" disabled={isBusy} onClick={() => void downloadPdf()} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Download size={15} />下载 PDF</button>
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><Printer size={15} />打印</button>
                  <button type="button" onClick={duplicate} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><Copy size={15} />复制</button>
                  {active.status === 'draft' ? (
                    <button type="button" disabled={isBusy} onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"><Trash2 size={15} />删除</button>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(active.status)}`}>{STATUS_LABELS[active.status]}</span>
                    {active.lastSentAt ? <p className="mt-2 text-xs text-slate-500">发送：{formatDateTime(active.lastSentAt)} · {active.lastSentTo}</p> : null}
                  </div>
                  <span className="font-semibold text-slate-950">总额 {formatNzd(getInvoiceTotal(active))}</span>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5">
                <h2 className="text-lg font-semibold text-slate-950">从合同带入资料</h2>
                <p className="mt-1 text-sm text-slate-500">自动填入客户、车辆与合同售价，之后仍可修改。</p>
                <div className="mt-4 flex gap-2">
                  <select value={selectedContractId} onChange={(event) => setSelectedContractId(event.target.value)} className={`${inputClass()} mt-0`}>
                    <option value="">选择车辆购买合同</option>
                    {contracts.map((contract) => <option key={contract.id} value={contract.id}>{contractLabel(contract)}</option>)}
                  </select>
                  <button type="button" onClick={importContract} className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">带入</button>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5">
                <h2 className="text-lg font-semibold text-slate-950">发票信息</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Invoice Ref No" value={active.invoiceNo} onChange={(invoiceNo) => setActive((current) => ({ ...current, invoiceNo }))} />
                  <Field label="Date" type="date" value={active.issueDate} onChange={(issueDate) => setActive((current) => ({ ...current, issueDate }))} />
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Remark</span>
                    <textarea value={active.remark} onChange={(event) => setActive((current) => ({ ...current, remark: event.target.value }))} rows={2} className={`${inputClass()} resize-none`} />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5">
                <h2 className="text-lg font-semibold text-slate-950">Sold to</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="客户 / 公司名称" value={active.customer.name} onChange={(value) => updateCustomer('name', value)} />
                  <Field label="Email" type="email" value={active.customer.email} onChange={(value) => updateCustomer('email', value)} />
                  <Field label="Phone" value={active.customer.phone} onChange={(value) => updateCustomer('phone', value)} />
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Address</span>
                    <textarea value={active.customer.address} onChange={(event) => updateCustomer('address', event.target.value)} rows={2} className={`${inputClass()} resize-none`} />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5">
                <h2 className="text-lg font-semibold text-slate-950">车辆信息</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Make" value={active.vehicle.make} onChange={(value) => updateVehicle('make', value)} />
                  <Field label="Model" value={active.vehicle.model} onChange={(value) => updateVehicle('model', value)} />
                  <Field label="Vehicle Year" value={active.vehicle.year} onChange={(value) => updateVehicle('year', value)} />
                  <Field label="VIN Number" value={active.vehicle.vin} onChange={(value) => updateVehicle('vin', value)} />
                  <Field label="Rego" value={active.vehicle.registration} onChange={(value) => updateVehicle('registration', value)} />
                  <Field label="Colour" value={active.vehicle.colour} onChange={(value) => updateVehicle('colour', value)} />
                  <Field label="Engine Capacity" value={active.vehicle.engineCapacity} onChange={(value) => updateVehicle('engineCapacity', value)} />
                </div>
              </section>

              <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950">收费项目</h2>
                  <button type="button" onClick={() => setActive((current) => ({ ...current, lineItems: [...current.lineItems, createInvoiceLineItem('')] }))} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"><Plus size={14} />添加</button>
                </div>
                <div className="mt-4 space-y-3">
                  {active.lineItems.map((item, index) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">项目 {index + 1}</p>
                        <button type="button" onClick={() => removeLineItem(item.id)} disabled={active.lineItems.length === 1} aria-label={`删除项目 ${index + 1}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={15} /></button>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_90px_140px]">
                        <Field label="Description" value={item.description} onChange={(description) => updateLineItem(item.id, { description })} />
                        <Field label="Qty" type="number" value={String(item.quantity)} onChange={(value) => updateLineItem(item.id, { quantity: Math.max(0, Number(value) || 0) })} />
                        <Field label="Price each (NZD)" type="number" value={String(item.unitPrice)} onChange={(value) => updateLineItem(item.id, { unitPrice: Math.max(0, Number(value) || 0) })} />
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <input type="checkbox" checked={item.gstIncluded} onChange={(event) => updateLineItem(item.id, { gstIncluded: event.target.checked })} className="accent-slate-950" />
                        金额包含 GST
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            </aside>

            <section className="min-w-0 overflow-auto rounded-[32px] border border-white/70 bg-slate-200/60 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 print:fixed print:inset-0 print:overflow-visible print:border-0 print:bg-white print:p-0 print:shadow-none print:ring-0">
              <InvoiceDocument invoice={active} />
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
