function safeFilenamePart(value: string) {
  return value.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'invoice';
}

export interface InvoicePdfAttachment {
  filename: string;
  dataUri: string;
}

async function buildInvoicePdf(invoiceNo: string) {
  const element = document.getElementById('invoice-document-preview');
  if (!element) throw new Error('Invoice preview is not available.');

  await document.fonts?.ready;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    scale: 1.6,
    useCORS: true,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });
  const imageData = canvas.toDataURL('image/jpeg', 0.9);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

  return {
    pdf,
    filename: `INNO-Invoice-${safeFilenamePart(invoiceNo)}.pdf`,
  };
}

export async function downloadInvoicePdf(invoiceNo: string) {
  const { pdf, filename } = await buildInvoicePdf(invoiceNo);
  pdf.save(filename);
  return filename;
}

export async function createInvoicePdfAttachment(invoiceNo: string): Promise<InvoicePdfAttachment> {
  const { pdf, filename } = await buildInvoicePdf(invoiceNo);
  return {
    filename,
    dataUri: pdf.output('datauristring'),
  };
}
