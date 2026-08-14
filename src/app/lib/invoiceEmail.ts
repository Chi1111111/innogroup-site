import type { InvoicePdfAttachment } from './invoicePdf';
import { invokeAdminFunction } from './adminApi';

export interface InvoiceEmailResult {
  emailId: string;
  recipient: string;
  sentAt: string;
  sendCount: number;
  duplicate: boolean;
}

function attachmentBase64(attachment: InvoicePdfAttachment) {
  const separatorIndex = attachment.dataUri.indexOf(',');
  if (separatorIndex === -1) throw new Error('The generated PDF attachment is invalid.');
  return attachment.dataUri.slice(separatorIndex + 1);
}

export async function sendInvoiceEmail(
  invoiceId: string,
  attachment: InvoicePdfAttachment,
): Promise<InvoiceEmailResult> {
  const requestId = crypto.randomUUID();
  const data = await invokeAdminFunction<InvoiceEmailResult>('send-invoice', {
    invoiceId,
    requestId,
    pdfBase64: attachmentBase64(attachment),
    filename: attachment.filename,
  });

  if (!data?.emailId || !data?.recipient || !data?.sentAt) {
    throw new Error('The email service returned an incomplete response.');
  }

  return data as InvoiceEmailResult;
}
