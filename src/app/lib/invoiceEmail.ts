import type { InvoicePdfAttachment } from './invoicePdf';
import { getSupabaseClient } from './supabaseClient';

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

async function functionErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'context' in error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = await context.clone().json() as { error?: string };
        if (body.error) return body.error;
      } catch {
        // Fall through to the SDK message.
      }
    }
  }

  return error instanceof Error ? error.message : 'Unable to send the invoice email.';
}

export async function sendInvoiceEmail(
  invoiceId: string,
  attachment: InvoicePdfAttachment,
): Promise<InvoiceEmailResult> {
  const requestId = crypto.randomUUID();
  const { data, error } = await getSupabaseClient().functions.invoke('send-invoice', {
    body: {
      invoiceId,
      requestId,
      pdfBase64: attachmentBase64(attachment),
      filename: attachment.filename,
    },
  });

  if (error) throw new Error(await functionErrorMessage(error));
  if (!data?.emailId || !data?.recipient || !data?.sentAt) {
    throw new Error('The email service returned an incomplete response.');
  }

  return data as InvoiceEmailResult;
}
