import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ContractDocument } from '../components/ContractDocument';
import {
  ContractType,
  VehicleContract,
  createEmptyContract,
  formatDateTime,
  loadContracts,
  saveContracts,
  upsertContract,
} from '../lib/contracts';

const ADMIN_SESSION_KEY = 'inno:admin:session:v1';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'innogroup2026';

type WorkspaceTab = 'status' | 'library' | 'editor';
type Section = 'client' | 'vehicle' | 'trade' | 'payment' | 'checks' | 'deposit';
type Notice = { type: 'success' | 'error' | 'info'; text: string } | null;

const CONTRACT_TYPES: Array<{
  id: ContractType | 'consignment' | 'finance';
  name: string;
  description: string;
  available: boolean;
}> = [
  {
    id: 'vehicle-purchase',
    name: 'Vehicle Purchase Agreement',
    description: 'Motor vehicle offer, payment, acknowledgements, and purchaser signature.',
    available: true,
  },
  {
    id: 'deposit',
    name: 'Deposit Agreement',
    description: 'Expression of interest / pre-order deposit form based on the Inno Group deposit template.',
    available: true,
  },
  {
    id: 'consignment',
    name: 'Consignment Agreement',
    description: 'Coming next: owner consignment terms, sale authority, and settlement.',
    available: false,
  },
  {
    id: 'finance',
    name: 'Finance Authority',
    description: 'Coming next: finance consent, document collection, and lender authority.',
    available: false,
  },
];

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function noticeClass(type: NonNullable<Notice>['type']) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function statusLabel(status: VehicleContract['status']) {
  if (status === 'draft') return 'Draft';
  if (status === 'sent') return 'Sent / pending';
  if (status === 'viewed') return 'Viewed';
  if (status === 'signed') return 'Signed';
  return 'Cancelled';
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
    return vehicle ? `Deposit Agreement - ${vehicle}` : 'Deposit Agreement';
  }

  const vehicle = [contract.purchasedVehicle.year, contract.purchasedVehicle.make, contract.purchasedVehicle.model]
    .filter(Boolean)
    .join(' ');
  return vehicle || 'Vehicle Purchase Agreement';
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function AdminContracts() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => typeof window !== 'undefined' && window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [contracts, setContracts] = useState<VehicleContract[]>([]);
  const [active, setActive] = useState<VehicleContract>(() => createEmptyContract());
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('status');
  const [section, setSection] = useState<Section>('client');
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    setContracts(loadContracts());
    document.title = 'Inno Group Contract Admin';
  }, []);

  const signingLink = useMemo(
    () => (typeof window === 'undefined' ? `/sign/${active.id}` : `${window.location.origin}/sign/${active.id}`),
    [active.id]
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

  const activateContract = (contract: VehicleContract, nextTab: WorkspaceTab = 'editor') => {
    setActive(contract);
    setWorkspaceTab(nextTab);
    setSection(contract.contractType === 'deposit' ? 'deposit' : 'client');
    setNotice(null);
  };

  const createNewContract = (contractType: ContractType = 'vehicle-purchase') => {
    const next = createEmptyContract(contractType);
    setActive(next);
    setContracts(upsertContract(next));
    setWorkspaceTab('editor');
    setSection(contractType === 'deposit' ? 'deposit' : 'client');
    setNotice(null);
  };

  const save = (status: VehicleContract['status'] = active.status) => {
    const next: VehicleContract = {
      ...active,
      status,
      sentAt: status === 'sent' && !active.sentAt ? new Date().toISOString() : active.sentAt,
    };
    const nextContracts = upsertContract(next);
    setContracts(nextContracts);
    setActive(next);
    setNotice({ type: 'success', text: status === 'sent' ? 'Contract saved as sent.' : 'Contract draft saved.' });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(signingLink);
    save('sent');
  };

  const sendEmail = () => {
    const email = active.client.email.trim();
    if (!email) {
      setSection('client');
      setWorkspaceTab('editor');
      setNotice({ type: 'error', text: 'Add the customer email before sending.' });
      return;
    }

    const next: VehicleContract = {
      ...active,
      status: 'sent',
      sentAt: active.sentAt || new Date().toISOString(),
    };
    const nextContracts = upsertContract(next);
    setContracts(nextContracts);
    setActive(next);
    setWorkspaceTab('status');
    setNotice({ type: 'success', text: 'Contract marked as sent. Your email app will open with the signing link.' });

    const subject = encodeURIComponent(`Inno Group ${next.contractType === 'deposit' ? 'deposit agreement' : 'vehicle agreement'} for signing`);
    const body = encodeURIComponent(
      [
        `Hi ${next.client.name || ''},`,
        '',
        `Please review and sign your Inno Group ${next.contractType === 'deposit' ? 'deposit agreement' : 'vehicle agreement'} using the link below:`,
        signingLink,
        '',
        `Contract: ${contractTitle(next)}`,
        '',
        'Thank you,',
        'Inno Group Ltd',
      ].join('\n')
    );
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  };

  const remove = () => {
    if (!window.confirm('Delete current contract?')) return;
    const next = contracts.filter((item) => item.id !== active.id);
    saveContracts(next);
    setContracts(next);
    setActive(createEmptyContract());
    setWorkspaceTab('library');
    setNotice({ type: 'success', text: 'Contract deleted.' });
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

  const isDepositContract = active.contractType === 'deposit';

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-600">Contract Workspace</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <TextInput label="Password" value={password} onChange={setPassword} />
            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              Sign In
            </button>
          </form>
          <Link to="/" className="mt-4 inline-flex text-sm text-slate-700 hover:text-slate-900">Back to website</Link>
        </div>
      </div>
    );
  }

  const navButton = (id: WorkspaceTab, label: string) => (
    <button
      type="button"
      onClick={() => setWorkspaceTab(id)}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
        workspaceTab === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
      }`}
    >
      {label}
    </button>
  );

  const sectionButton = (id: Section, label: string) => (
    <button
      type="button"
      onClick={() => setSection(id)}
      className={`rounded-xl px-4 py-2 text-sm font-medium ${
        section === id ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-7xl space-y-5 print:hidden">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c7a06d]">Inno Group e-sign</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Contract Workspace</h1>
              <p className="mt-2 text-sm text-slate-600">Track sent agreements, manage contract types, and prepare signing links.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium">Content Admin</Link>
              <button onClick={() => createNewContract()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">New Contract</button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
            {navButton('status', 'Status Board')}
            {navButton('library', 'Contract Library')}
            {navButton('editor', 'Prepare & Send')}
          </div>

          {notice ? <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${noticeClass(notice.type)}`}>{notice.text}</div> : null}
        </header>

        {workspaceTab === 'status' ? (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Drafts" value={stats.draft} />
              <StatCard label="Sent / pending" value={stats.sent} />
              <StatCard label="Viewed" value={stats.viewed} />
              <StatCard label="Signed" value={stats.signed} />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-950">Sent contract status</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {contracts.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">No contracts yet.</p>
                ) : (
                  contracts.map((contract) => (
                    <div key={contract.id} className="grid gap-3 p-5 lg:grid-cols-[1.2fr_160px_1fr_auto] lg:items-center">
                      <div>
                        <p className="font-semibold text-slate-950">{contract.client.name || 'Unnamed client'}</p>
                        <p className="mt-1 text-sm text-slate-500">{contractTitle(contract)}</p>
                        <p className="mt-1 text-xs text-slate-400">{contract.client.email || 'No email'}</p>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(contract.status)}`}>{statusLabel(contract.status)}</span>
                      <p className="text-xs leading-5 text-slate-500">
                        Sent {formatDateTime(contract.sentAt)}<br />
                        Viewed {formatDateTime(contract.viewedAt)}<br />
                        Signed {formatDateTime(contract.signedAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => activateContract(contract, 'editor')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">Open</button>
                        <a href={`/sign/${contract.id}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Signing page</a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {workspaceTab === 'library' ? (
          <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              {CONTRACT_TYPES.map((type) => (
                <div key={type.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{type.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{type.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${type.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {type.available ? 'Ready' : 'Soon'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => type.available && createNewContract(type.id as ContractType)}
                    disabled={!type.available}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Use this contract
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Existing documents</h2>
              <div className="mt-4 space-y-3">
                {contracts.length === 0 ? (
                  <p className="text-sm text-slate-500">No saved contracts yet.</p>
                ) : (
                  contracts.map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => activateContract(contract, 'editor')}
                      className={`w-full rounded-2xl border p-4 text-left text-sm ${contract.id === active.id ? 'border-primary bg-primary/10' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{contract.client.name || 'Unnamed client'}</p>
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
          <section className="grid gap-5 lg:grid-cols-[minmax(360px,520px)_1fr]">
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => save()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black">Save Draft</button>
                  <button onClick={sendEmail} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Send Email</button>
                  <button onClick={copyLink} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Copy Link</button>
                  <button onClick={remove} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">Delete</button>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  Signing link: <span className="break-all font-medium text-slate-950">{signingLink}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className={`rounded-full px-3 py-1 font-semibold ${statusClass(active.status)}`}>{statusLabel(active.status)}</span>
                  <span>Viewed {formatDateTime(active.viewedAt)}</span>
                  <span>Signed {formatDateTime(active.signedAt)}</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {sectionButton('client', 'Client')}
                  {isDepositContract ? (
                    sectionButton('deposit', 'Deposit Form')
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
                    <TextInput label="Email" value={active.client.email} onChange={(v) => updateClient('email', v)} />
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
                  {!isDepositContract && section === 'trade' && <>
                    <Check label="Trade-in applies" checked={active.tradeIn.enabled} onChange={(v) => updateTrade('enabled', v)} />
                    <TextInput label="Registration No." value={active.tradeIn.registrationNo} onChange={(v) => updateTrade('registrationNo', v)} />
                    <TextInput label="Make" value={active.tradeIn.make} onChange={(v) => updateTrade('make', v)} />
                    <TextInput label="Year" value={active.tradeIn.year} onChange={(v) => updateTrade('year', v)} />
                    <TextInput label="Model" value={active.tradeIn.model} onChange={(v) => updateTrade('model', v)} />
                    <TextInput label="VIN" value={active.tradeIn.chassisFrameOrVin} onChange={(v) => updateTrade('chassisFrameOrVin', v)} />
                    <TextInput label="Odometer" value={active.tradeIn.odometer} onChange={(v) => updateTrade('odometer', v)} />
                    <TextInput label="Net Allowance" value={active.tradeIn.netAllowance} onChange={(v) => updateTrade('netAllowance', v)} />
                  </>}
                  {!isDepositContract && section === 'payment' && <>
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
                  </>}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <ContractDocument contract={active} />
            </div>
          </section>
        ) : null}
      </div>

      <div className="mx-auto mt-8 hidden max-w-7xl print:block print:mt-0"><ContractDocument contract={active} /></div>
    </div>
  );
}
