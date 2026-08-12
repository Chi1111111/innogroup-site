import {
  COMPANY_DETAILS,
  formatNzd,
  getInvoiceTotal,
  type CommercialInvoice,
} from '../lib/invoices';

function displayDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-NZ').format(new Date(year, month - 1, day));
}

function VehicleDetails({ invoice }: { invoice: CommercialInvoice }) {
  const details = [
    ['VIN NUMBER', invoice.vehicle.vin],
    ['VEHICLE YEAR', invoice.vehicle.year],
    ['COLOUR', invoice.vehicle.colour],
    ['ENGINE CAPACITY', invoice.vehicle.engineCapacity],
    ['REGO', invoice.vehicle.registration],
  ].filter(([, value]) => value);

  if (details.length === 0) return null;

  return (
    <dl className="mt-2 grid grid-cols-[132px_1fr] gap-x-2 text-[11px] font-semibold leading-[1.45]">
      {details.map(([label, value]) => (
        <div key={label} className="contents">
          <dt>{label}:</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InvoiceDocument({ invoice }: { invoice: CommercialInvoice }) {
  const total = getInvoiceTotal(invoice);
  const vehicleName = [invoice.vehicle.make, invoice.vehicle.model].filter(Boolean).join(' ');

  return (
    <article
      id="invoice-document-preview"
      className="invoice-document relative mx-auto min-h-[297mm] w-[210mm] bg-white px-[13mm] py-[11mm] text-black shadow-[0_18px_70px_rgba(15,23,42,0.16)] print:min-h-0 print:shadow-none"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } .invoice-document { width: 210mm !important; min-height: 297mm !important; } }`}</style>

      <header className="grid grid-cols-[1fr_240px] gap-10 border-b-2 border-black pb-5">
        <div>
          <h1 className="font-serif text-[29px] font-bold leading-none tracking-normal text-black normal-case">
            {COMPANY_DETAILS.name}
          </h1>
          <p className="mt-3 text-[11px] leading-[1.55] text-black">
            {COMPANY_DETAILS.address}<br />
            Tel: {COMPANY_DETAILS.phone} · Email: {COMPANY_DETAILS.email}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-black">GST NUMBER: {COMPANY_DETAILS.gstNumber}</p>
          <h2 className="mt-6 text-[18px] font-bold tracking-normal text-black underline normal-case">COMMERCIAL INVOICE</h2>
        </div>

        <dl className="mt-auto grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-[11px] leading-5">
          <dt className="font-semibold">Date:</dt>
          <dd>{displayDate(invoice.issueDate)}</dd>
          <dt className="font-semibold">Invoice Ref No:</dt>
          <dd className="font-semibold">{invoice.invoiceNo}</dd>
          <dt className="font-semibold">Remark:</dt>
          <dd className="whitespace-pre-line">{invoice.remark || '—'}</dd>
        </dl>
      </header>

      <section className="py-5">
        <p className="text-[13px] font-bold text-black">Sold to:</p>
        <p className="mt-2 text-[13px] font-semibold text-black">{invoice.customer.name || 'Customer name'}</p>
        <p className="mt-1 whitespace-pre-line text-[12px] leading-5 text-black">{invoice.customer.address || 'Customer address'}</p>
      </section>

      <table className="w-full table-fixed border-collapse text-[11px]">
        <colgroup>
          <col className="w-[7%]" />
          <col className="w-[47%]" />
          <col className="w-[8%]" />
          <col className="w-[18%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead>
          <tr>
            {['Item', 'Description', 'Qty', 'Price each (NZD)', 'Amount (NZD)'].map((label) => (
              <th key={label} className="border-2 border-black px-2 py-2 text-left font-bold last:text-right">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, index) => {
            const amount = Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0);
            const description = index === 0 && item.description.trim().toUpperCase() === 'CAR PRICE' && vehicleName
              ? `CAR PRICE for ${vehicleName}`
              : item.description;
            return (
              <tr key={item.id} className="align-top">
                <td className="border border-black px-2 py-3 text-center font-semibold">{index + 1}</td>
                <td className="min-h-32 border border-black px-2 py-3">
                  <p className="whitespace-pre-line font-semibold leading-[1.45] text-black normal-case">{description || 'Item description'}</p>
                  {index === 0 ? <VehicleDetails invoice={invoice} /> : null}
                </td>
                <td className="border border-black px-2 py-3 text-center">{item.quantity}</td>
                <td className="border border-black px-2 py-3 text-right">{formatNzd(item.unitPrice)}</td>
                <td className="border border-black px-2 py-3 text-right">
                  {formatNzd(amount)}
                  {item.gstIncluded ? <span className="mt-1 block text-[10px]">(include GST)</span> : null}
                </td>
              </tr>
            );
          })}
          <tr className="align-top">
            <td className="border border-black px-2 py-4" />
            <td colSpan={3} className="border border-black px-3 py-4">
              <p className="font-bold underline">Bank Details: New Zealand Dollar Account</p>
              <p className="mt-1 leading-[1.55] text-black">
                {COMPANY_DETAILS.bankName}<br />
                {COMPANY_DETAILS.bankAddress}<br />
                A/C No: {COMPANY_DETAILS.accountNumber}<br />
                A/C Name: {COMPANY_DETAILS.accountName}<br />
                Swift code: {COMPANY_DETAILS.swiftCode}
              </p>
              <p className="mt-8 text-right text-[13px] font-bold text-black">Total Value</p>
            </td>
            <td className="border border-black px-2 py-4 text-right align-bottom text-[13px] font-bold">{formatNzd(total)}</td>
          </tr>
        </tbody>
      </table>

      <footer className="mt-5 flex items-center justify-between border-t pt-3 text-[9px] uppercase tracking-[0.12em]" style={{ borderColor: '#cbd5e1', color: '#64748b' }}>
        <span>INNO GROUP LTD · Commercial Invoice</span>
        <span>All amounts in New Zealand Dollars</span>
      </footer>
    </article>
  );
}
