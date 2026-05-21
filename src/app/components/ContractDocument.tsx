import type { ReactNode } from 'react';
import type { VehicleContract } from '../lib/contracts';
import { formatDateTime, money } from '../lib/contracts';
import logo from '../../data/pic/logo.png';

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b border-slate-200/90 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <p className="mt-1 min-h-6 text-sm font-semibold text-slate-950">{value?.trim() || '-'}</p>
    </div>
  );
}

function SignatureBlock({ label, name, signature }: { label: string; name?: string; signature?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-3 flex min-h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
        {signature ? (
          <img src={signature} alt={`${label} signature`} className="max-h-20 max-w-full object-contain" />
        ) : (
          <span className="text-sm text-slate-400">Signature pending</span>
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-950">{name || 'Name: __________________'}</p>
    </div>
  );
}

function ContractHeader({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle: string;
  meta: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-t-3xl bg-[linear-gradient(135deg,#d6b078_0%,#c7a06d_52%,#a87d4b_100%)] px-8 py-9 text-white print:rounded-none">
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="inline-flex rounded-2xl bg-white/90 px-4 py-2 shadow-[0_14px_40px_rgba(35,25,12,0.16)] ring-1 ring-white/70">
            <img src={logo} alt="Inno Group" className="h-8 w-auto object-contain" />
          </div>
          <h1 className="mt-8 text-4xl font-light tracking-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-1 text-2xl font-semibold text-white/78">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/12 px-5 py-4 text-right text-sm leading-7 text-white/82 backdrop-blur-sm">
          {meta}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="rounded-2xl bg-[linear-gradient(135deg,#c7a06d,#b58a55)] px-4 py-3 text-lg font-semibold text-white shadow-sm">
      {children}
    </h2>
  );
}

function AcknowledgementClause({
  title,
  accepted,
  children,
}: {
  title: string;
  accepted?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
            accepted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {accepted ? 'Accepted' : 'Pending'}
        </span>
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

function Blank({ value, width = 'min-w-48' }: { value?: string; width?: string }) {
  return (
    <span className={`inline-block border-b border-slate-400 px-2 font-medium text-slate-950 ${width}`}>
      {value?.trim() || '\u00a0'}
    </span>
  );
}

export function ContractDocument({ contract }: { contract: VehicleContract }) {
  if (contract.contractType === 'deposit') {
    return <DepositContractDocument contract={contract} />;
  }

  return <VehiclePurchaseContractDocument contract={contract} />;
}

function VehiclePurchaseContractDocument({ contract }: { contract: VehicleContract }) {
  const { client, purchasedVehicle, tradeIn, payment, acknowledgements, signatures } = contract;

  return (
    <article className="mx-auto max-w-5xl bg-white text-slate-950 print:max-w-none print:shadow-none">
      <ContractHeader
        title="Vehicle Purchase"
        subtitle="Agreement"
        meta={
          <>
            <p className="text-white/82">GST NO.: 135362624</p>
            <p className="mt-6 text-white/82">1/A 331 Rosedale Road</p>
            <p className="text-white/82">Albany 0632 New Zealand</p>
          </>
        }
      />

      <section className="space-y-8 rounded-b-3xl border border-slate-200 px-6 py-8 shadow-sm print:rounded-none print:border-0 print:px-0 print:shadow-none sm:px-8">
        <div>
          <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
            Vehicle Offer and Sale Agreement - New or Used Motor Vehicle
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Client name" value={client.name} />
            <Field label="Driver's Licence No." value={client.driversLicenceNo} />
            <Field label="Address" value={client.address} />
            <Field label="Email" value={client.email} />
            <Field label="Phone" value={client.phone} />
            <Field label="Agreement status" value={contract.status.toUpperCase()} />
          </div>
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>1. Description of Motor Vehicle to Be Purchased</SectionTitle>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Make" value={purchasedVehicle.make} />
            <Field label="Vehicle year" value={purchasedVehicle.year} />
            <Field label="Model" value={purchasedVehicle.model} />
            <Field label="VIN or Registration No." value={purchasedVehicle.vinOrRegistration} />
            <Field label="Actual distance travelled" value={purchasedVehicle.odometer} />
            <Field label="Operating fuel type" value={purchasedVehicle.fuelType} />
            <Field label="Colour" value={purchasedVehicle.colour} />
            <Field label="Engine capacity" value={purchasedVehicle.engineCapacity} />
            <Field label="WOF details" value={purchasedVehicle.wofDetails} />
            <Field label="First registered NZ" value={purchasedVehicle.firstRegisteredNz} />
          </div>
          <Field label="Particular or special purposes" value={purchasedVehicle.specialPurpose} />
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>2. Trade-In Vehicle {tradeIn.enabled ? '' : '(Not Applicable)'}</SectionTitle>
          {tradeIn.enabled ? (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Registration No." value={tradeIn.registrationNo} />
                <Field label="Make" value={tradeIn.make} />
                <Field label="Vehicle year" value={tradeIn.year} />
                <Field label="Engine capacity" value={tradeIn.engineCapacity} />
                <Field label="Model" value={tradeIn.model} />
                <Field label="Chassis/Frame or VIN No." value={tradeIn.chassisFrameOrVin} />
                <Field label="First registered NZ" value={tradeIn.firstRegisteredNz} />
                <Field label="VIC/WOF details" value={tradeIn.vicWofDetails} />
                <Field label="Colour" value={tradeIn.colour} />
                <Field label="Motive power" value={tradeIn.motivePower} />
                <Field label="Present odometer reading" value={tradeIn.odometer} />
                <Field label="Pay encumbrance to" value={tradeIn.payEncumbranceTo} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Purchase price inc GST" value={money(tradeIn.purchasePrice)} />
                <Field label="Less encumbrance balance" value={money(tradeIn.encumbranceBalance)} />
                <Field label="Net trade-in allowance" value={money(tradeIn.netAllowance)} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No trade-in vehicle is included in this agreement.</p>
          )}
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>3. Purchase Price and Payment</SectionTitle>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Sale price inc GST" value={money(payment.salePriceIncGst)} />
            <Field label="Accessories" value={payment.accessoriesDescription} />
            <Field label="Accessories value inc GST" value={money(payment.accessoriesValueIncGst)} />
            <Field label="Subtotal inc GST" value={money(payment.subtotalIncGst)} />
            <Field label="Less net trade-in allowance" value={money(payment.lessNetTradeInAllowance)} />
            <Field label="Net price" value={money(payment.netPrice)} />
            <Field label="Deposit on signing" value={money(payment.depositOnSigning)} />
            <Field label="Additional payments" value={money(payment.additionalPayments)} />
            <Field label="Due on delivery" value={money(payment.dueOnDelivery)} />
            <Field label="Total payments" value={money(payment.totalPayments)} />
            <Field label="Balance outstanding" value={money(payment.balanceOutstanding)} />
            <Field label="To be financed by" value={payment.financeBy} />
            <Field label="Finance term" value={payment.financeTermMonths ? `${payment.financeTermMonths} months` : ''} />
          </div>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold uppercase leading-6 text-amber-900">
            Should I/we fail to complete the purchase, I/we agree that the deposit on signing may be forfeited.
          </p>
        </div>

        <div className="break-inside-avoid space-y-4">
          <SectionTitle>4. Purchaser Acknowledgements</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <AcknowledgementClause title="Terms and Conditions" accepted={acknowledgements.termsAccepted}>
              <p>
                The purchaser confirms that they have read, understood, and accepted the terms of this agreement,
                including the vehicle description, purchase price, payment obligations, delivery arrangements, and
                any special conditions recorded in this document.
              </p>
            </AcknowledgementClause>
            <AcknowledgementClause title="Consumer Information Notice" accepted={acknowledgements.cinProvided}>
              <p>
                The purchaser acknowledges that the Consumer Information Notice for the motor vehicle has been made
                available where required and that they have had the opportunity to review it before signing this
                agreement.
              </p>
            </AcknowledgementClause>
            <AcknowledgementClause title="Authority to Sign and Process Documents" accepted={acknowledgements.signDocumentsAccepted}>
              <p>
                The purchaser agrees to sign and provide any documents reasonably required to complete the sale,
                vehicle registration, finance, insurance, delivery, compliance, and related administration for this
                purchase.
              </p>
            </AcknowledgementClause>
            <AcknowledgementClause title="Odometer and Vehicle Details" accepted={acknowledgements.odometerAcknowledged}>
              <p>
                The purchaser acknowledges the odometer reading and vehicle details shown in this agreement. The
                recorded distance travelled forms part of the vehicle information relied on by the purchaser when
                entering into this agreement.
              </p>
            </AcknowledgementClause>
            <AcknowledgementClause title="Privacy and Personal Information" accepted={acknowledgements.privacyAccepted}>
              <p>
                The purchaser authorises Inno Group Ltd to collect, use, store, and disclose personal information as
                reasonably necessary for identity verification, contract administration, finance, registration,
                delivery, after-sales support, and legal or regulatory obligations.
              </p>
            </AcknowledgementClause>
            <AcknowledgementClause title="Business-use and Consumer Guarantees" accepted={acknowledgements.businessUseClauseApplies}>
              <p>
                If the vehicle is acquired for business purposes, the purchaser acknowledges that the parties may
                contract out of the Consumer Guarantees Act to the extent permitted by law, and that this agreement is
                entered into on that basis where applicable.
              </p>
            </AcknowledgementClause>
            <AcknowledgementClause title="Deposit and Completion of Purchase" accepted={acknowledgements.depositForfeitureAccepted}>
              <p>
                The purchaser acknowledges that the deposit paid on signing is part of the purchase commitment. If the
                purchaser fails to complete the purchase without an agreed lawful reason, the deposit may be forfeited
                in accordance with this agreement.
              </p>
            </AcknowledgementClause>
          </div>
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>5. Motor Vehicle Trader's Acceptance and Signatures</SectionTitle>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SignatureBlock label="Client" name={signatures.purchaserName || client.name} signature={signatures.purchaser} />
            <SignatureBlock label="Salesperson" name={signatures.salespersonName} signature={signatures.salesperson} />
            <SignatureBlock label="Inno Group" name={signatures.innoGroupName || 'Inno Group Ltd'} signature={signatures.innoGroup} />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
          <p>Disclaimer: Both parties should review this agreement before signing. This digital version is a workflow template based on Inno Group's Vehicle Purchase Agreement.</p>
        </div>
      </section>
    </article>
  );
}

function DepositContractDocument({ contract }: { contract: VehicleContract }) {
  const deposit = contract.depositAgreement;
  const signatures = contract.signatures;

  return (
    <article className="mx-auto max-w-5xl bg-white text-slate-950 print:max-w-none print:shadow-none">
      <ContractHeader
        title="Expression of Interest"
        subtitle="Pre-Order Deposit Form"
        meta={
          <>
            <p className="text-white/82">Date: {deposit?.date || formatDateTime(contract.createdAt)}</p>
            <p className="mt-6 text-white/82">1/A 331 Rosedale Road</p>
            <p className="text-white/82">Albany 0632 New Zealand</p>
          </>
        }
      />

      <section className="space-y-8 rounded-b-3xl border border-slate-200 px-6 py-8 shadow-sm print:rounded-none print:border-0 print:px-0 print:shadow-none sm:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Disclaimer</p>
          <p className="mt-1">Both parties should review the contract and consider having a legal professional check its clarity and enforceability.</p>
        </div>

        <div className="space-y-5 text-base leading-8 text-slate-800">
          <p>Dear <Blank value={deposit?.clientName || contract.client.name} width="min-w-64" />,</p>
          <p>In anticipation of <Blank value={deposit?.anticipationOf} width="min-w-80" />,</p>
          <p>
            To assist you with your purchase or pre-order regarding model pricing and specifications prior to release,
            we kindly ask that you provide the following details:
          </p>
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>1. Applicant Details</SectionTitle>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Name of Individual or Company" value={deposit?.applicantName || contract.client.name} />
            <Field label="Email" value={contract.client.email} />
            <Field label="Phone" value={contract.client.phone} />
            <Field label="Address" value={contract.client.address} />
          </div>
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>2. Deposit Requirement</SectionTitle>
          <div className="mt-4 space-y-4 text-base leading-8 text-slate-800">
            <p>
              Please place a fully refundable deposit of <Blank value={deposit?.depositAmount ? `$${deposit.depositAmount} NZD` : ''} width="min-w-40" /> and
              provide your signature below to confirm your expression of interest with Inno Group Ltd.
            </p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              Note: A pre-order will not be deemed valid until the deposit is received. If the vehicle auction process
              is conducted more than five (5) times without a successful purchase, a deduction of NZD 200 will be
              applied from the deposit to cover administrative and transaction costs. The remaining balance will be refunded.
            </p>
          </div>
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>Next Steps</SectionTitle>
          <div className="mt-4 space-y-5 text-base leading-8 text-slate-800">
            <p><Blank value={deposit?.nextStepContactName} width="min-w-48" /> will contact you to assist with your purchase and keep you informed of all product information and timing.</p>
            <p>Please sign below and return/email this form to <Blank value={deposit?.returnEmail} width="min-w-64" /> to confirm your order and reserve your vehicle.</p>
            <p><Blank value={deposit?.contactPersonName} width="min-w-48" /> is available on <Blank value={deposit?.contactAvailability} width="min-w-64" /> should you have any questions in relation to your order.</p>
          </div>
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>Acknowledgment</SectionTitle>
          <p className="mt-4 text-base leading-8 text-slate-800">
            I, <Blank value={deposit?.acknowledgementName || signatures.purchaserName || contract.client.name} width="min-w-56" />, confirm my expression of interest / pre-order for a <Blank value={deposit?.preOrderVehicle} width="min-w-80" />.
          </p>
        </div>

        <div className="break-inside-avoid">
          <SectionTitle>Signature</SectionTitle>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SignatureBlock label="Client" name={signatures.purchaserName || contract.client.name} signature={signatures.purchaser} />
            <SignatureBlock label="Inno Group" name={signatures.innoGroupName || 'Inno Group Ltd'} signature={signatures.innoGroup} />
          </div>
        </div>
      </section>
    </article>
  );
}
