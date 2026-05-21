import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowDown,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSignature,
  PenLine,
  ShieldCheck,
} from 'lucide-react';
import { Link, useParams } from 'react-router';
import { ContractDocument } from '../components/ContractDocument';
import {
  VehicleContract,
  formatDateTime,
  getContractBySigningToken,
  getErrorMessage,
  recordContractEvent,
  saveSignature,
  upsertContract,
} from '../lib/contracts';

type AckKey = 'terms' | 'cin' | 'docs' | 'odometer' | 'privacy' | 'deposit';

const ACKNOWLEDGEMENTS: Array<{ key: AckKey; label: string }> = [
  { key: 'terms', label: 'I have read and accept the terms and conditions.' },
  { key: 'cin', label: 'I acknowledge the Consumer Information Notice has been provided.' },
  { key: 'docs', label: 'I agree to sign all required documents for this agreement.' },
  { key: 'odometer', label: 'I acknowledge the odometer statement shown in this agreement.' },
  { key: 'privacy', label: 'I accept the privacy and personal information handling statement.' },
  { key: 'deposit', label: 'I understand the deposit may be forfeited if I fail to complete the purchase.' },
];

function StepItem({
  done,
  label,
  detail,
  onClick,
}: {
  done: boolean;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
        done ? 'border-emerald-200 bg-emerald-50/90 shadow-sm' : 'border-slate-200 bg-white/90 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white'
      }`}
    >
      <CheckCircle2 className={`mt-0.5 h-5 w-5 flex-none ${done ? 'text-emerald-600' : 'text-slate-300'}`} />
      <span>
        <span className="block text-sm font-semibold text-slate-950">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
      </span>
    </button>
  );
}

function Notice({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/90 px-4 py-3 text-sm text-blue-800 shadow-sm">
      {message}
    </div>
  );
}

export function SignContract() {
  const { contractId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contract, setContract] = useState<VehicleContract | null>(null);
  const [purchaserName, setPurchaserName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showSigningPanel, setShowSigningPanel] = useState(false);
  const [accepted, setAccepted] = useState<Record<AckKey, boolean>>({
    terms: false,
    cin: false,
    docs: false,
    odometer: false,
    privacy: false,
    deposit: false,
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!contractId) return;

    let isMounted = true;

    async function loadContract() {
      setIsLoading(true);
      try {
        const found = await getContractBySigningToken(contractId!);
        const nextFound =
          found && found.status === 'sent'
            ? { ...found, status: 'viewed' as const, viewedAt: found.viewedAt || new Date().toISOString() }
            : found;

        if (nextFound && found?.status === 'sent') {
          await upsertContract(nextFound);
          await recordContractEvent(nextFound.id, 'viewed');
        }

        if (!isMounted) return;
        setContract(nextFound);
        setPurchaserName(nextFound?.signatures.purchaserName || nextFound?.client.name || '');
        setAccepted({
          terms: Boolean(nextFound?.acknowledgements.termsAccepted),
          cin: Boolean(nextFound?.acknowledgements.cinProvided),
          docs: Boolean(nextFound?.acknowledgements.signDocumentsAccepted),
          odometer: Boolean(nextFound?.acknowledgements.odometerAcknowledged),
          privacy: Boolean(nextFound?.acknowledgements.privacyAccepted),
          deposit: Boolean(nextFound?.acknowledgements.depositForfeitureAccepted),
        });
        setHasSignature(Boolean(nextFound?.signatures.purchaser));
        document.title = nextFound ? 'Sign Agreement' : 'Contract Not Found';
      } catch (error) {
        if (!isMounted) return;
        setMessage(`Could not load contract: ${getErrorMessage(error)}`);
        document.title = 'Contract Not Found';
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadContract();

    return () => {
      isMounted = false;
    };
  }, [contractId]);

  const signed = contract?.status === 'signed';
  const allAccepted = ACKNOWLEDGEMENTS.every((item) => accepted[item.key]);
  const canSubmit = Boolean(purchaserName.trim()) && hasSignature && allAccepted && !signed;
  const completedSteps = [
    Boolean(purchaserName.trim()),
    allAccepted,
    hasSignature,
    Boolean(signed),
  ].filter(Boolean).length;
  const progress = signed ? 100 : Math.round((completedSteps / 4) * 100);

  const contractTitle = useMemo(() => {
    if (!contract) return 'Vehicle Purchase Agreement';
    const vehicle = [contract.purchasedVehicle.year, contract.purchasedVehicle.make, contract.purchasedVehicle.model]
      .filter(Boolean)
      .join(' ');
    return vehicle || 'Vehicle Purchase Agreement';
  }, [contract]);

  const scrollToSection = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    if (!canvas || !context || signed) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
    setIsDrawing(true);
    setHasSignature(true);
    setMessage('');
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signed) return;

    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
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
    if (!canvas || !context || signed) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const updateAccepted = (key: AckKey, value: boolean) => {
    setAccepted((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const goToNextRequired = () => {
    setShowSigningPanel(true);
    if (!purchaserName.trim()) {
      scrollToSection('name');
      return;
    }
    if (!allAccepted) {
      scrollToSection('acknowledgements');
      return;
    }
    if (!hasSignature) {
      scrollToSection('signature');
      return;
    }
    scrollToSection('submit');
  };

  const submit = async () => {
    if (!contract) return;
    if (!purchaserName.trim()) {
      setMessage('Please enter your full legal name before signing.');
      scrollToSection('name');
      return;
    }
    if (!allAccepted) {
      setMessage('Please complete every required acknowledgement.');
      scrollToSection('acknowledgements');
      return;
    }
    if (!hasSignature || !canvasRef.current) {
      setMessage('Please draw your signature before submitting.');
      scrollToSection('signature');
      return;
    }

    const signature = canvasRef.current.toDataURL('image/png');
    const signedContract: VehicleContract = {
      ...contract,
      status: 'signed',
      signedAt: new Date().toISOString(),
      signedIpNote: 'Captured in browser signing session',
      signedUserAgent: navigator.userAgent,
      acknowledgements: {
        ...contract.acknowledgements,
        termsAccepted: true,
        cinProvided: true,
        signDocumentsAccepted: true,
        odometerAcknowledged: true,
        privacyAccepted: true,
        depositForfeitureAccepted: true,
      },
      signatures: {
        ...contract.signatures,
        purchaserName: purchaserName.trim(),
        purchaser: signature,
      },
    };

    setIsSubmitting(true);
    try {
      await saveSignature(signedContract, purchaserName.trim(), signature);
      await upsertContract(signedContract);
      await recordContractEvent(signedContract.id, 'signed', 'Captured in browser signing session');
      setContract(signedContract);
      setMessage('Signed successfully. You can now print or save the completed agreement as a PDF.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage(`Could not submit signature: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8f4ec_0,#eef3f8_42%,#f8fafc_100%)] px-4 py-12">
        <div className="max-w-lg animate-[fadeIn_0.45s_ease-out] rounded-[32px] border border-white/70 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-slate-900">Loading contract</h1>
          <p className="mt-3 text-sm text-slate-600">Please wait while we open your secure signing link.</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8f4ec_0,#eef3f8_42%,#f8fafc_100%)] px-4 py-12">
        <div className="max-w-lg animate-[fadeIn_0.45s_ease-out] rounded-[32px] border border-white/70 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-slate-900">Contract not found</h1>
          <p className="mt-3 text-sm text-slate-600">
            This signing link is not available. Please ask Inno Group to resend the contract link.
          </p>
          <Link to="/" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5">
            Back to website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#faf4e8_0,#eef4f8_34%,#f8fafc_72%)] text-slate-900 print:bg-white">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 shadow-sm shadow-slate-900/5 backdrop-blur-2xl print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7a06d]">Inno Group e-sign</p>
            <h1 className="mt-1 text-xl font-semibold text-slate-950">{contractTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {signed ? `Completed ${formatDateTime(contract.signedAt)}` : 'Review, complete required fields, then submit your signature.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!signed ? (
              <button
                type="button"
                onClick={goToNextRequired}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-black"
              >
                <ArrowDown className="h-4 w-4" />
                Sign document
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="h-4 w-4" />
              Print / PDF
            </button>
          </div>
        </div>
        <div className="h-1 bg-slate-200/80">
          <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 print:block print:px-0 print:py-0">
        <aside className="hidden print:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-950">Signing progress</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {progress}%
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <StepItem
                done={Boolean(purchaserName.trim())}
                label="Your name"
                detail={purchaserName.trim() || 'Required'}
                onClick={() => scrollToSection('name')}
              />
              <StepItem
                done={allAccepted}
                label="Acknowledgements"
                detail={`${ACKNOWLEDGEMENTS.filter((item) => accepted[item.key]).length}/${ACKNOWLEDGEMENTS.length} completed`}
                onClick={() => scrollToSection('acknowledgements')}
              />
              <StepItem
                done={hasSignature}
                label="Signature"
                detail={hasSignature ? 'Signature captured' : 'Draw or sign with touch'}
                onClick={() => scrollToSection('signature')}
              />
              <StepItem
                done={Boolean(signed)}
                label="Finish"
                detail={signed ? 'Agreement signed' : 'Submit once ready'}
                onClick={() => scrollToSection('submit')}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Electronic signature record</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  The signed copy records the completion time, typed name, drawn signature, and browser device
                  details for audit reference.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="animate-[fadeIn_0.45s_ease-out] rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/5 backdrop-blur-xl print:hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-200/70">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  {signed ? 'Completed' : 'Action required'}
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  {signed ? 'Agreement signed' : 'Complete your signature'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Use the required fields below, then review the generated agreement. The document preview updates
                  after submission.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-600">
                Contract ID
                <span className="block max-w-[260px] truncate font-semibold text-slate-950">{contract.id}</span>
              </div>
            </div>
            <div className="mt-4">
              <Notice message={message} />
            </div>
          </div>

          {!signed ? (
            <div className="space-y-5 print:hidden">
              <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white/80 p-4 shadow-[0_30px_100px_rgba(15,23,42,0.25)] backdrop-blur-2xl transition-transform duration-500 ease-out ${
                  showSigningPanel ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <div className="mb-4 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c7a06d]">Required fields</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">Finish signing</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSigningPanel(false)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300"
                  >
                    Close
                  </button>
                </div>
                <div
                  ref={(node) => {
                    sectionRefs.current.name = node;
                  }}
                  className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5"
                >
                  <div className="flex items-center gap-3">
                    <FileSignature className="h-5 w-5 text-[#c7a06d]" />
                    <h3 className="text-lg font-semibold text-slate-950">1. Confirm signer</h3>
                  </div>
                  <label className="mt-4 block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Full legal name</span>
                    <input
                      value={purchaserName}
                      onChange={(event) => {
                        setPurchaserName(event.target.value);
                        setMessage('');
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[#c7a06d] focus:ring-4 focus:ring-[#c7a06d]/15"
                    />
                  </label>
                </div>

                <div
                  ref={(node) => {
                    sectionRefs.current.acknowledgements = node;
                  }}
                  className="mt-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-5 w-5 text-[#c7a06d]" />
                    <h3 className="text-lg font-semibold text-slate-950">2. Required acknowledgements</h3>
                  </div>
                  <div className="mt-4 space-y-2">
                    {ACKNOWLEDGEMENTS.map((item) => (
                      <label
                        key={item.key}
                        className={`flex gap-3 rounded-2xl border p-3 text-sm leading-6 text-slate-700 transition-all duration-200 ${accepted[item.key] ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <input
                          type="checkbox"
                          checked={accepted[item.key]}
                          onChange={(event) => updateAccepted(item.key, event.target.checked)}
                          className="mt-1 accent-slate-950"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div
                  ref={(node) => {
                    sectionRefs.current.signature = node;
                  }}
                  className="mt-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5"
                >
                  <div className="flex items-center gap-3">
                    <PenLine className="h-5 w-5 text-[#c7a06d]" />
                    <h3 className="text-lg font-semibold text-slate-950">3. Draw signature</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Sign inside the box using a mouse, trackpad, stylus, or finger.
                  </p>
                  <canvas
                    ref={canvasRef}
                    width={900}
                    height={260}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                    onPointerLeave={() => setIsDrawing(false)}
                    className="mt-4 h-44 w-full touch-none rounded-2xl border border-slate-200 bg-white shadow-inner shadow-slate-100"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-all duration-200 hover:border-slate-300"
                    >
                      Clear signature
                    </button>
                  </div>
                </div>

                <div
                  ref={(node) => {
                    sectionRefs.current.submit = node;
                  }}
                  className="mt-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5"
                >
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? 'Submitting...' : 'Finish signing'}
                  </button>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    By selecting finish signing, your typed name, signature, acknowledgements, completion time, and
                    browser details will be saved with this agreement.
                  </p>
                </div>
              </div>

              {showSigningPanel ? (
                <button
                  type="button"
                  onClick={() => setShowSigningPanel(false)}
                  className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition-opacity duration-300"
                  aria-label="Close signing panel"
                />
              ) : null}

              <div className="animate-[fadeIn_0.5s_ease-out] overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/5">
                <ContractDocument contract={contract} />
              </div>
              <div className="sticky bottom-4 z-30 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSigningPanel(true)}
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-black"
                >
                  Sign document
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.10)] print:hidden">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-950">Signing completed</h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Signed by {contract.signatures.purchaserName || contract.client.name || 'the purchaser'} on{' '}
                      {formatDateTime(contract.signedAt)}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/15 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" />
                  Print / PDF
                </button>
              </div>
            </div>
          )}

          <div className={signed ? '' : 'hidden print:block'}>
            <ContractDocument contract={contract} />
          </div>
        </section>
      </main>
    </div>
  );
}
