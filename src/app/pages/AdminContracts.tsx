import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import emailjs from '@emailjs/browser';
import { Link } from 'react-router';
import { ContractDocument } from '../components/ContractDocument';
import {
  ContractType,
  VehicleContract,
  createEmptyContract,
  deleteContract,
  formatDateTime,
  getErrorMessage,
  loadContracts,
  parseEmailRecipients,
  upsertContract,
} from '../lib/contracts';
import { EMAILJS_CONFIG } from '../../config/emailConfig';

const CONTRACT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CONTRACT_TEMPLATE_ID ?? EMAILJS_CONFIG.templateId;

type WorkspaceTab = 'status' | 'library' | 'editor';
type Section = 'client' | 'vehicle' | 'trade' | 'payment' | 'checks' | 'deposit' | 'consignment';
type Notice = { type: 'success' | 'error' | 'info'; text: string } | null;

const UI_LABELS: Record<string, string> = {
  Client: '客户',
  Password: '密码',
  'Deposit Form': '订金表格',
  Consignment: '寄售',
  Vehicle: '车辆',
  Checks: '确认项',
  Payment: '付款',
  Name: '姓名',
  'Driver Licence No.': '驾照号',
  Address: '地址',
  'Email(s)': '邮箱（可多个）',
  Phone: '电话',
  Date: '日期',
  'In anticipation of': '预定/意向事项',
  'Applicant name': '申请人姓名',
  'Refundable deposit amount': '可退订金金额',
  'Next step contact name': '下一步联系人',
  'Return email': '回传邮箱',
  'Contact person': '联系人',
  'Contact availability': '可联系时间',
  'Acknowledgement name': '确认人姓名',
  'Pre-order vehicle': '预定车辆',
  'Inno Group signer': 'Inno Group 签署人',
  'Agreement date': '协议日期',
  'Owner name': '车主姓名',
  'Owner ID / company no.': '车主 ID / 公司号',
  'Owner bank account': '车主银行账户',
  'Listing / target price': '挂牌/目标价格',
  'Minimum sale price': '最低成交价',
  'Term end date': '期限结束日期',
  'Commission rate %': '服务费比例 %',
  'Settlement business days': '结算工作日',
  'Additional costs / notes': '额外费用/备注',
  'Owner email(s)': '车主邮箱（可多个）',
  'Owner phone': '车主电话',
  'Owner address': '车主地址',
  Make: '品牌',
  'Vehicle Year': '车辆年份',
  Model: '型号',
  'VIN or Registration No.': 'VIN 或车牌号',
  Odometer: '公里数',
  'Fuel Type': '燃油类型',
  Colour: '颜色',
  'Engine Capacity': '排量',
  'WOF Details': 'WOF 信息',
  'First Registered NZ': '新西兰首次注册',
  'Special Purpose': '特殊用途',
  Year: '年份',
  'Sale Price inc GST': '含 GST 售价',
  Accessories: '配件',
  'Accessories Value': '配件金额',
  Subtotal: '小计',
  'Net Price': '净价',
  Deposit: '订金',
  'Due on Delivery': '交付时应付',
  'Balance Outstanding': '剩余尾款',
  'Finance By': '金融机构',
  'Finance Term Months': '贷款期数（月）',
  'Salesperson Name': '销售姓名',
  'Inno Group Signer': 'Inno Group 签署人',
};

function uiLabel(label: string) {
  return UI_LABELS[label] ?? label;
}

const CONTRACT_TYPES: Array<{
  id: ContractType | 'consignment' | 'finance';
  name: string;
  description: string;
  available: boolean;
}> = [
  {
    id: 'vehicle-purchase',
    name: '车辆购买合同',
    description: '车辆信息、付款、确认事项和买方签名。',
    available: true,
  },
  {
    id: 'deposit',
    name: '订金协议',
    description: '用于预定和意向订金的表格。',
    available: true,
  },
  {
    id: 'consignment',
    name: '寄售协议',
    description: '车主寄售、成交服务费、销售授权和结算安排。',
    available: true,
  },
  {
    id: 'finance',
    name: '金融授权',
    description: '后续开放：金融授权、资料收集和贷款机构授权。',
    available: false,
  },
];

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{uiLabel(label)}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-950 shadow-inner shadow-slate-100/60 outline-none transition-all duration-200 placeholder:text-slate-300 focus:border-slate-400 focus:bg-white focus:shadow-sm focus:ring-4 focus:ring-slate-200/70"
      />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`flex gap-3 rounded-2xl border p-4 text-sm text-slate-700 transition-all duration-200 ${checked ? 'border-emerald-200 bg-emerald-50/80 shadow-sm' : 'border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-white'}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 accent-slate-950" />
      <span>{uiLabel(label)}</span>
    </label>
  );
}

function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!value) return;

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = value;
  }, [value]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
    setIsDrawing(true);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) saveCanvasSignature();
    setIsDrawing(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released by the browser.
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-inner shadow-slate-100/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <button
          type="button"
          onClick={clearSignature}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-200 hover:border-slate-300 hover:text-slate-950"
        >
          清除
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={240}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onPointerLeave={() => setIsDrawing(false)}
        className="mt-3 h-36 w-full touch-none rounded-2xl border border-slate-200 bg-white shadow-inner shadow-slate-100"
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">在这里签名，然后点击保存草稿或发送邮件保存。</p>
    </div>
  );
}

function noticeClass(type: NonNullable<Notice>['type']) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function statusLabel(status: VehicleContract['status']) {
  if (status === 'draft') return '草稿';
  if (status === 'sent') return '已发送 / 待签';
  if (status === 'viewed') return '已查看';
  if (status === 'signed') return '已签署';
  return '已取消';
}

function statusClass(status: VehicleContract['status']) {
  if (status === 'signed') return 'bg-emerald-100 text-emerald-800';
  if (status === 'viewed') return 'bg-blue-100 text-blue-800';
  if (status === 'sent') return 'bg-amber-100 text-amber-800';
  if (status === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
}

function contractTitle(contract: VehicleContract) {
  if (contract.contractType === 'deposit') {
    const vehicle = contract.depositAgreement?.preOrderVehicle?.trim();
    return vehicle ? `订金协议 - ${vehicle}` : '订金协议';
  }

  if (contract.contractType === 'consignment') {
    const vehicle = [contract.purchasedVehicle.year, contract.purchasedVehicle.make, contract.purchasedVehicle.model]
      .filter(Boolean)
      .join(' ');
    return vehicle ? `寄售协议 - ${vehicle}` : '寄售协议';
  }

  const vehicle = [contract.purchasedVehicle.year, contract.purchasedVehicle.make, contract.purchasedVehicle.model]
    .filter(Boolean)
    .join(' ');
  return vehicle || '车辆购买合同';
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="group rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

export function AdminContracts() {
  const [contracts, setContracts] = useState<VehicleContract[]>([]);
  const [active, setActive] = useState<VehicleContract>(() => createEmptyContract());
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('status');
  const [section, setSection] = useState<Section>('client');
  const [notice, setNotice] = useState<Notice>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    loadContracts()
      .then(setContracts)
      .catch((error) => setNotice({ type: 'error', text: `无法加载合同：${getErrorMessage(error)}` }));
    document.title = 'Inno Group Contract Admin';
  }, []);

  const signingLink = useMemo(
    () => (typeof window === 'undefined' ? `/sign/${active.signingToken}` : `${window.location.origin}/sign/${active.signingToken}`),
    [active.signingToken]
  );

  const stats = useMemo(
    () => ({
      draft: contracts.filter((item) => item.status === 'draft').length,
      sent: contracts.filter((item) => item.status === 'sent').length,
      viewed: contracts.filter((item) => item.status === 'viewed').length,
      signed: contracts.filter((item) => item.status === 'signed').length,
    }),
    [contracts]
  );

  const activateContract = (contract: VehicleContract, nextTab: WorkspaceTab = 'editor') => {
    setActive(contract);
    setWorkspaceTab(nextTab);
    setSection(contract.contractType === 'deposit' ? 'deposit' : contract.contractType === 'consignment' ? 'consignment' : 'client');
    setNotice(null);
  };

  const createNewContract = async (contractType: ContractType = 'vehicle-purchase') => {
    const next = createEmptyContract(contractType);
    setIsBusy(true);
    try {
      setContracts(await upsertContract(next));
      setActive(next);
      setWorkspaceTab('editor');
      setSection(contractType === 'deposit' ? 'deposit' : contractType === 'consignment' ? 'consignment' : 'client');
      setNotice(null);
    } catch (error) {
      setNotice({ type: 'error', text: `无法创建合同：${getErrorMessage(error)}` });
    } finally {
      setIsBusy(false);
    }
  };

  const save = async (status: VehicleContract['status'] = active.status) => {
    const next: VehicleContract = {
      ...active,
      status,
      sentAt: status === 'sent' && !active.sentAt ? new Date().toISOString() : active.sentAt,
    };
    setIsBusy(true);
    try {
      const nextContracts = await upsertContract(next);
      setContracts(nextContracts);
      setActive(next);
      setNotice({ type: 'success', text: status === 'sent' ? '合同已保存为已发送。' : '合同草稿已保存。' });
      return next;
    } catch (error) {
      setNotice({ type: 'error', text: `无法保存合同：${getErrorMessage(error)}` });
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(signingLink);
    await save('sent');
  };

  const sendEmail = async () => {
    const emails = parseEmailRecipients(active.client.email);
    if (emails.length === 0) {
      setSection('client');
      setWorkspaceTab('editor');
      setNotice({ type: 'error', text: '发送前请至少填写一个客户邮箱。' });
      return;
    }

    const next: VehicleContract = {
      ...active,
      status: 'sent',
      sentAt: active.sentAt || new Date().toISOString(),
    };
    setIsBusy(true);
    try {
      const nextContracts = await upsertContract(next);
      setContracts(nextContracts);
      setActive(next);
      setWorkspaceTab('status');

      await Promise.all(
        emails.map((email) =>
          emailjs.send(
            EMAILJS_CONFIG.serviceId,
            CONTRACT_TEMPLATE_ID,
            {
              to_email: email,
              to_emails: emails.join(', '),
              recipient_count: String(emails.length),
              to_name: next.client.name || 'Customer',
              client_name: next.client.name || 'Customer',
              contract_title: contractTitle(next),
              contract_type: next.contractType === 'deposit' ? 'Deposit Agreement' : next.contractType === 'consignment' ? 'Consignment Agreement' : 'Vehicle Agreement',
              signing_url: signingLink,
              company_name: 'Inno Group Ltd',
            },
            EMAILJS_CONFIG.publicKey
          )
        )
      );

      setNotice({ type: 'success', text: `合同已保存，并通过 EmailJS 发送到 ${emails.length} 个邮箱。` });
      return;
    } catch (error) {
      setNotice({
        type: 'error',
        text: `合同已保存，但 EmailJS 未发送成功：${getErrorMessage(error)}`,
      });
      setIsBusy(false);
      return;
    } finally {
      setIsBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('确定删除当前合同吗？')) return;
    setIsBusy(true);
    try {
      setContracts(await deleteContract(active.id));
      setActive(createEmptyContract());
      setWorkspaceTab('library');
      setNotice({ type: 'success', text: '合同已删除。' });
    } catch (error) {
      setNotice({ type: 'error', text: `无法删除合同：${getErrorMessage(error)}` });
    } finally {
      setIsBusy(false);
    }
  };

  const updateClient = (key: keyof VehicleContract['client'], value: string) => setActive((current) => ({ ...current, client: { ...current.client, [key]: value } }));
  const updateVehicle = (key: keyof VehicleContract['purchasedVehicle'], value: string) => setActive((current) => ({ ...current, purchasedVehicle: { ...current.purchasedVehicle, [key]: value } }));
  const updateTrade = (key: keyof VehicleContract['tradeIn'], value: string | boolean) => setActive((current) => ({ ...current, tradeIn: { ...current.tradeIn, [key]: value } }));
  const updatePayment = (key: keyof VehicleContract['payment'], value: string) => setActive((current) => ({ ...current, payment: { ...current.payment, [key]: value } }));
  const updateAck = (key: keyof VehicleContract['acknowledgements'], value: boolean) => setActive((current) => ({ ...current, acknowledgements: { ...current.acknowledgements, [key]: value } }));
  const updateSig = (key: keyof VehicleContract['signatures'], value: string) => setActive((current) => ({ ...current, signatures: { ...current.signatures, [key]: value } }));
  const updateDeposit = (key: keyof NonNullable<VehicleContract['depositAgreement']>, value: string) => setActive((current) => ({
    ...current,
    depositAgreement: {
      ...(current.depositAgreement ?? createEmptyContract('deposit').depositAgreement!),
      [key]: value,
    },
  }));
  const updateConsignment = (key: keyof NonNullable<VehicleContract['consignmentAgreement']>, value: string) => setActive((current) => ({
    ...current,
    consignmentAgreement: {
      ...(current.consignmentAgreement ?? createEmptyContract('consignment').consignmentAgreement!),
      [key]: value,
    },
  }));

  const isDepositContract = active.contractType === 'deposit';
  const isConsignmentContract = active.contractType === 'consignment';

  const navButton = (id: WorkspaceTab, label: string) => (
    <button
      type="button"
      onClick={() => setWorkspaceTab(id)}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
        workspaceTab === id ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'text-slate-500 hover:bg-white hover:text-slate-950'
      }`}
    >
      {uiLabel(label)}
    </button>
  );

  const sectionButton = (id: Section, label: string) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
        section === id ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10' : 'border border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-950'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#faf4e8_0,#eef4f8_34%,#f8fafc_70%)] px-4 py-6 text-slate-900 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-7xl space-y-5 print:hidden">
        <header className="animate-[fadeIn_0.45s_ease-out] rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7a06d]">Inno Group e-sign</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">合同管理后台</h1>
              <p className="mt-2 text-sm text-slate-600">管理合同草稿、发送邮件、复制签署链接和查看签署状态。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin" className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">内容管理</Link>
              <Link to="/admin/crm" className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">CRM 管理</Link>
              <Link to="/admin/invoices" className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">发票管理</Link>
              <button onClick={() => createNewContract()} disabled={isBusy} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">新建合同</button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 rounded-full border border-slate-200/80 bg-slate-100/70 p-1.5">
            {navButton('status', '状态看板')}
            {navButton('library', '合同库')}
            {navButton('editor', '编辑与发送')}
          </div>

          {notice ? <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${noticeClass(notice.type)}`}>{notice.text}</div> : null}
        </header>

        {workspaceTab === 'status' ? (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="草稿" value={stats.draft} />
              <StatCard label="已发送 / 待签" value={stats.sent} />
              <StatCard label="已查看" value={stats.viewed} />
              <StatCard label="已签署" value={stats.signed} />
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 backdrop-blur-xl">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-950">合同发送状态</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {contracts.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">暂无合同。</p>
                ) : (
                  contracts.map((contract) => (
                    <div key={contract.id} className="grid gap-3 p-6 transition-all duration-200 hover:bg-slate-50/80 lg:grid-cols-[1.2fr_160px_1fr_auto] lg:items-center">
                      <div>
                        <p className="font-semibold text-slate-950">{contract.client.name || '未命名客户'}</p>
                        <p className="mt-1 text-sm text-slate-500">{contractTitle(contract)}</p>
                        <p className="mt-1 text-xs text-slate-400">{contract.client.email || '暂无邮箱'}</p>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(contract.status)}`}>{statusLabel(contract.status)}</span>
                      <p className="text-xs leading-5 text-slate-500">
                        发送：{formatDateTime(contract.sentAt)}<br />
                        查看：{formatDateTime(contract.viewedAt)}<br />
                        签署：{formatDateTime(contract.signedAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => activateContract(contract, 'editor')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">打开</button>
                        <a href={`/sign/${contract.signingToken}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-all duration-200 hover:-translate-y-0.5">签署页</a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {workspaceTab === 'library' ? (
          <section className="grid animate-[fadeIn_0.35s_ease-out] gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              {CONTRACT_TYPES.map((type) => (
                <div key={type.id} className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{type.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{type.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${type.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {type.available ? '可使用' : '即将开放'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => type.available && createNewContract(type.id as ContractType)}
                    disabled={!type.available || isBusy}
                    className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    使用这个合同
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-slate-950">已有文件</h2>
              <div className="mt-4 space-y-3">
                {contracts.length === 0 ? (
                  <p className="text-sm text-slate-500">暂无已保存合同。</p>
                ) : (
                  contracts.map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => activateContract(contract, 'editor')}
                      className={`w-full rounded-3xl border p-4 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 ${contract.id === active.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{contract.client.name || '未命名客户'}</p>
                          <p className="mt-1 text-slate-500">{contractTitle(contract)}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(contract.status)}`}>{statusLabel(contract.status)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {workspaceTab === 'editor' ? (
          <section className="grid animate-[fadeIn_0.35s_ease-out] gap-5 lg:grid-cols-[minmax(360px,520px)_1fr]">
            <div className="space-y-5">
              <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 backdrop-blur-xl">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => save()} disabled={isBusy} className="rounded-full bg-[#d2a968] px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#d2a968]/20 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300">保存草稿</button>
                  <button onClick={sendEmail} disabled={isBusy} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">发送邮件</button>
                  <button onClick={copyLink} disabled={isBusy} className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/15 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300">复制链接</button>
                  <button onClick={remove} disabled={isBusy} className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">删除</button>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                  签署链接：<span className="break-all font-medium text-slate-950">{signingLink}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className={`rounded-full px-3 py-1 font-semibold ${statusClass(active.status)}`}>{statusLabel(active.status)}</span>
                  <span>查看：{formatDateTime(active.viewedAt)}</span>
                  <span>签署：{formatDateTime(active.signedAt)}</span>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 backdrop-blur-xl">
                <div className="flex flex-wrap gap-2">
                  {sectionButton('client', 'Client')}
                  {isDepositContract ? (
                    sectionButton('deposit', 'Deposit Form')
                  ) : isConsignmentContract ? (
                    <>
                      {sectionButton('consignment', 'Consignment')}
                      {sectionButton('vehicle', 'Vehicle')}
                      {sectionButton('checks', 'Checks')}
                    </>
                  ) : (
                    <>
                      {sectionButton('vehicle', 'Vehicle')}
                      {sectionButton('trade', 'Trade-In')}
                      {sectionButton('payment', 'Payment')}
                      {sectionButton('checks', 'Checks')}
                    </>
                  )}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {section === 'client' && <>
                    <TextInput label="Name" value={active.client.name} onChange={(v) => updateClient('name', v)} />
                    <TextInput label="Driver Licence No." value={active.client.driversLicenceNo} onChange={(v) => updateClient('driversLicenceNo', v)} />
                    <TextInput label="Address" value={active.client.address} onChange={(v) => updateClient('address', v)} />
                    <TextInput label="Email(s)" value={active.client.email} onChange={(v) => updateClient('email', v)} />
                    <TextInput label="Phone" value={active.client.phone} onChange={(v) => updateClient('phone', v)} />
                  </>}
                  {isDepositContract && section === 'deposit' && <>
                    <TextInput label="Date" value={active.depositAgreement?.date ?? ''} onChange={(v) => updateDeposit('date', v)} />
                    <TextInput label="Client" value={active.depositAgreement?.clientName ?? ''} onChange={(v) => updateDeposit('clientName', v)} />
                    <TextInput label="In anticipation of" value={active.depositAgreement?.anticipationOf ?? ''} onChange={(v) => updateDeposit('anticipationOf', v)} />
                    <TextInput label="Applicant name" value={active.depositAgreement?.applicantName ?? ''} onChange={(v) => updateDeposit('applicantName', v)} />
                    <TextInput label="Refundable deposit amount" value={active.depositAgreement?.depositAmount ?? ''} onChange={(v) => updateDeposit('depositAmount', v)} />
                    <TextInput label="Next step contact name" value={active.depositAgreement?.nextStepContactName ?? ''} onChange={(v) => updateDeposit('nextStepContactName', v)} />
                    <TextInput label="Return email" value={active.depositAgreement?.returnEmail ?? ''} onChange={(v) => updateDeposit('returnEmail', v)} />
                    <TextInput label="Contact person" value={active.depositAgreement?.contactPersonName ?? ''} onChange={(v) => updateDeposit('contactPersonName', v)} />
                    <TextInput label="Contact availability" value={active.depositAgreement?.contactAvailability ?? ''} onChange={(v) => updateDeposit('contactAvailability', v)} />
                    <TextInput label="Acknowledgement name" value={active.depositAgreement?.acknowledgementName ?? ''} onChange={(v) => updateDeposit('acknowledgementName', v)} />
                    <TextInput label="Pre-order vehicle" value={active.depositAgreement?.preOrderVehicle ?? ''} onChange={(v) => updateDeposit('preOrderVehicle', v)} />
                    <TextInput label="Inno Group signer" value={active.signatures.innoGroupName ?? ''} onChange={(v) => updateSig('innoGroupName', v)} />
                    <SignaturePad label="Inno Group signature" value={active.signatures.innoGroup} onChange={(v) => updateSig('innoGroup', v)} />
                  </>}
                  {isConsignmentContract && section === 'consignment' && <>
                    <TextInput label="Agreement date" value={active.consignmentAgreement?.date ?? ''} onChange={(v) => updateConsignment('date', v)} />
                    <TextInput label="Owner name" value={active.consignmentAgreement?.ownerName || active.client.name} onChange={(v) => { updateConsignment('ownerName', v); updateClient('name', v); }} />
                    <TextInput label="Owner ID / company no." value={active.consignmentAgreement?.ownerId ?? ''} onChange={(v) => updateConsignment('ownerId', v)} />
                    <TextInput label="Owner bank account" value={active.consignmentAgreement?.ownerBankAccount ?? ''} onChange={(v) => updateConsignment('ownerBankAccount', v)} />
                    <TextInput label="Listing / target price" value={active.consignmentAgreement?.listingPrice ?? ''} onChange={(v) => updateConsignment('listingPrice', v)} />
                    <TextInput label="Minimum sale price" value={active.consignmentAgreement?.minimumSalePrice ?? ''} onChange={(v) => updateConsignment('minimumSalePrice', v)} />
                    <TextInput label="Term end date" value={active.consignmentAgreement?.termEndDate ?? ''} onChange={(v) => updateConsignment('termEndDate', v)} />
                    <TextInput label="Commission rate %" value={active.consignmentAgreement?.commissionRate ?? '7'} onChange={(v) => updateConsignment('commissionRate', v)} />
                    <TextInput label="Settlement business days" value={active.consignmentAgreement?.settlementBusinessDays ?? '5'} onChange={(v) => updateConsignment('settlementBusinessDays', v)} />
                    <TextInput label="Additional costs / notes" value={active.consignmentAgreement?.additionalCosts ?? ''} onChange={(v) => updateConsignment('additionalCosts', v)} />
                    <TextInput label="Owner email(s)" value={active.client.email} onChange={(v) => updateClient('email', v)} />
                    <TextInput label="Owner phone" value={active.client.phone} onChange={(v) => updateClient('phone', v)} />
                    <TextInput label="Owner address" value={active.client.address} onChange={(v) => updateClient('address', v)} />
                    <TextInput label="Inno Group signer" value={active.signatures.innoGroupName ?? ''} onChange={(v) => updateSig('innoGroupName', v)} />
                    <SignaturePad label="Inno Group signature" value={active.signatures.innoGroup} onChange={(v) => updateSig('innoGroup', v)} />
                  </>}
                  {!isDepositContract && section === 'vehicle' && <>
                    <TextInput label="Make" value={active.purchasedVehicle.make} onChange={(v) => updateVehicle('make', v)} />
                    <TextInput label="Vehicle Year" value={active.purchasedVehicle.year} onChange={(v) => updateVehicle('year', v)} />
                    <TextInput label="Model" value={active.purchasedVehicle.model} onChange={(v) => updateVehicle('model', v)} />
                    <TextInput label="VIN or Registration No." value={active.purchasedVehicle.vinOrRegistration} onChange={(v) => updateVehicle('vinOrRegistration', v)} />
                    <TextInput label="Odometer" value={active.purchasedVehicle.odometer} onChange={(v) => updateVehicle('odometer', v)} />
                    <TextInput label="Fuel Type" value={active.purchasedVehicle.fuelType} onChange={(v) => updateVehicle('fuelType', v)} />
                    <TextInput label="Colour" value={active.purchasedVehicle.colour} onChange={(v) => updateVehicle('colour', v)} />
                    <TextInput label="Engine Capacity" value={active.purchasedVehicle.engineCapacity} onChange={(v) => updateVehicle('engineCapacity', v)} />
                    <TextInput label="WOF Details" value={active.purchasedVehicle.wofDetails} onChange={(v) => updateVehicle('wofDetails', v)} />
                    <TextInput label="First Registered NZ" value={active.purchasedVehicle.firstRegisteredNz} onChange={(v) => updateVehicle('firstRegisteredNz', v)} />
                    <TextInput label="Special Purpose" value={active.purchasedVehicle.specialPurpose} onChange={(v) => updateVehicle('specialPurpose', v)} />
                  </>}
                  {!isDepositContract && !isConsignmentContract && section === 'trade' && <>
                    <Check label="Trade-in applies" checked={active.tradeIn.enabled} onChange={(v) => updateTrade('enabled', v)} />
                    <TextInput label="Registration No." value={active.tradeIn.registrationNo} onChange={(v) => updateTrade('registrationNo', v)} />
                    <TextInput label="Make" value={active.tradeIn.make} onChange={(v) => updateTrade('make', v)} />
                    <TextInput label="Year" value={active.tradeIn.year} onChange={(v) => updateTrade('year', v)} />
                    <TextInput label="Model" value={active.tradeIn.model} onChange={(v) => updateTrade('model', v)} />
                    <TextInput label="VIN" value={active.tradeIn.chassisFrameOrVin} onChange={(v) => updateTrade('chassisFrameOrVin', v)} />
                    <TextInput label="Odometer" value={active.tradeIn.odometer} onChange={(v) => updateTrade('odometer', v)} />
                    <TextInput label="Net Allowance" value={active.tradeIn.netAllowance} onChange={(v) => updateTrade('netAllowance', v)} />
                  </>}
                  {!isDepositContract && !isConsignmentContract && section === 'payment' && <>
                    <TextInput label="Sale Price inc GST" value={active.payment.salePriceIncGst} onChange={(v) => updatePayment('salePriceIncGst', v)} />
                    <TextInput label="Accessories" value={active.payment.accessoriesDescription} onChange={(v) => updatePayment('accessoriesDescription', v)} />
                    <TextInput label="Accessories Value" value={active.payment.accessoriesValueIncGst} onChange={(v) => updatePayment('accessoriesValueIncGst', v)} />
                    <TextInput label="Subtotal" value={active.payment.subtotalIncGst} onChange={(v) => updatePayment('subtotalIncGst', v)} />
                    <TextInput label="Net Price" value={active.payment.netPrice} onChange={(v) => updatePayment('netPrice', v)} />
                    <TextInput label="Deposit" value={active.payment.depositOnSigning} onChange={(v) => updatePayment('depositOnSigning', v)} />
                    <TextInput label="Due on Delivery" value={active.payment.dueOnDelivery} onChange={(v) => updatePayment('dueOnDelivery', v)} />
                    <TextInput label="Balance Outstanding" value={active.payment.balanceOutstanding} onChange={(v) => updatePayment('balanceOutstanding', v)} />
                    <TextInput label="Finance By" value={active.payment.financeBy} onChange={(v) => updatePayment('financeBy', v)} />
                    <TextInput label="Finance Term Months" value={active.payment.financeTermMonths} onChange={(v) => updatePayment('financeTermMonths', v)} />
                  </>}
                  {!isDepositContract && section === 'checks' && <>
                    <Check label="Terms accepted" checked={active.acknowledgements.termsAccepted} onChange={(v) => updateAck('termsAccepted', v)} />
                    <Check label="CIN provided" checked={active.acknowledgements.cinProvided} onChange={(v) => updateAck('cinProvided', v)} />
                    <Check label="Document signing accepted" checked={active.acknowledgements.signDocumentsAccepted} onChange={(v) => updateAck('signDocumentsAccepted', v)} />
                    <Check label="Odometer acknowledged" checked={active.acknowledgements.odometerAcknowledged} onChange={(v) => updateAck('odometerAcknowledged', v)} />
                    <Check label="Privacy accepted" checked={active.acknowledgements.privacyAccepted} onChange={(v) => updateAck('privacyAccepted', v)} />
                    <Check label="Business-use clause applies" checked={active.acknowledgements.businessUseClauseApplies} onChange={(v) => updateAck('businessUseClauseApplies', v)} />
                    <TextInput label="Salesperson Name" value={active.signatures.salespersonName ?? ''} onChange={(v) => updateSig('salespersonName', v)} />
                    <TextInput label="Inno Group Signer" value={active.signatures.innoGroupName ?? ''} onChange={(v) => updateSig('innoGroupName', v)} />
                    <SignaturePad label="Inno Group signature" value={active.signatures.innoGroup} onChange={(v) => updateSig('innoGroup', v)} />
                  </>}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/5">
              <ContractDocument contract={active} />
            </div>
          </section>
        ) : null}
      </div>

      <div className="mx-auto mt-8 hidden max-w-7xl print:block print:mt-0"><ContractDocument contract={active} /></div>
    </div>
  );
}
