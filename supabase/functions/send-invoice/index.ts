import { createClient } from 'npm:@supabase/supabase-js@2.106.1';

type JsonRecord = Record<string, unknown>;

type InvoiceRow = {
  id: string;
  invoice_no: string;
  status: 'draft' | 'issued' | 'paid' | 'void';
  customer_name: string | null;
  customer_email: string | null;
  total_nzd: number | string;
  payload: JsonRecord | null;
  send_count: number;
};

type SendRequest = {
  invoiceId?: string;
  requestId?: string;
  pdfBase64?: string;
  filename?: string;
};

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REQUEST_CHARACTERS = 11_000_000;
const MAX_PDF_BASE64_CHARACTERS = 10_000_000;

function response(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  });
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatNzd(value: unknown) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  }).format(asNumber(value));
}

function sanitizeFilename(value: unknown, invoiceNo: string) {
  const proposed = asText(value).trim();
  const fallback = `INNO-Invoice-${invoiceNo}.pdf`;
  const safe = (proposed || fallback).replace(/[^a-z0-9._-]+/gi, '-').slice(0, 120);
  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
}

function getSupabasePublishableKey() {
  const keyDictionary = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (keyDictionary) {
    try {
      const keys = JSON.parse(keyDictionary) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch {
      // Fall back to the legacy key on older Supabase projects.
    }
  }

  return Deno.env.get('SUPABASE_ANON_KEY');
}

function buildEmail(invoice: InvoiceRow) {
  const payload = asRecord(invoice.payload);
  const customer = asRecord(payload.customer);
  const vehicle = asRecord(payload.vehicle);
  const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems.map(asRecord) : [];
  const customerName = asText(invoice.customer_name || customer.name, 'Customer');
  const issueDate = asText(payload.issueDate, '-');
  const remark = asText(payload.remark, '-');
  const vehicleDescription = [vehicle.year, vehicle.make, vehicle.model]
    .map((part) => asText(part))
    .filter(Boolean)
    .join(' ') || 'Vehicle purchase';
  const rows = lineItems.length > 0
    ? lineItems.map((item) => {
      const quantity = Math.max(0, asNumber(item.quantity));
      const unitPrice = Math.max(0, asNumber(item.unitPrice));
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb">${escapeHtml(asText(item.description, 'Item'))}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center">${quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">${escapeHtml(formatNzd(quantity * unitPrice))}</td>
      </tr>`;
    }).join('')
    : '<tr><td colspan="3" style="padding:12px">Vehicle purchase</td></tr>';

  const html = `<!doctype html>
  <html lang="en">
    <body style="margin:0;background:#f3f4f6;color:#111827;font-family:Arial,sans-serif">
      <div style="display:none;max-height:0;overflow:hidden">Invoice ${escapeHtml(invoice.invoice_no)} from INNO GROUP LTD</div>
      <div style="max-width:640px;margin:0 auto;padding:32px 16px">
        <div style="background:#111827;color:white;padding:28px;border-radius:18px 18px 0 0">
          <div style="font-size:12px;letter-spacing:2px;color:#d2a968">INNO GROUP LTD</div>
          <h1 style="margin:10px 0 0;font-size:26px">Invoice ${escapeHtml(invoice.invoice_no)}</h1>
        </div>
        <div style="background:white;padding:28px;border-radius:0 0 18px 18px">
          <p style="margin-top:0">Hi ${escapeHtml(customerName)},</p>
          <p>Please find your invoice attached as a PDF. A summary is included below for convenience.</p>
          <table style="width:100%;margin:24px 0;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:7px 0;color:#6b7280">Invoice date</td><td style="padding:7px 0;text-align:right">${escapeHtml(issueDate)}</td></tr>
            <tr><td style="padding:7px 0;color:#6b7280">Vehicle</td><td style="padding:7px 0;text-align:right">${escapeHtml(vehicleDescription)}</td></tr>
            <tr><td style="padding:7px 0;color:#6b7280">Total</td><td style="padding:7px 0;text-align:right;font-size:18px;font-weight:700">${escapeHtml(formatNzd(invoice.total_nzd))}</td></tr>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f8fafc"><th style="padding:12px;text-align:left">Description</th><th style="padding:12px">Qty</th><th style="padding:12px;text-align:right">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          ${remark && remark !== '-' ? `<p style="margin:20px 0 0;color:#4b5563"><strong>Remark:</strong> ${escapeHtml(remark)}</p>` : ''}
          <p style="margin:28px 0 0;color:#6b7280;font-size:13px">Questions? Reply to this email or contact INNO GROUP LTD on +64 27 285 8065.</p>
        </div>
      </div>
    </body>
  </html>`;

  const text = [
    `Hi ${customerName},`,
    '',
    `Invoice ${invoice.invoice_no} is attached as a PDF.`,
    `Invoice date: ${issueDate}`,
    `Vehicle: ${vehicleDescription}`,
    `Total: ${formatNzd(invoice.total_nzd)}`,
    remark && remark !== '-' ? `Remark: ${remark}` : '',
    '',
    'INNO GROUP LTD',
    '+64 27 285 8065',
  ].filter((line) => line !== '').join('\n');

  return { customerName, html, text };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return response({ error: 'Authentication required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabasePublishableKey = getSupabasePublishableKey();
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('INVOICE_FROM_EMAIL');
  const replyTo = Deno.env.get('INVOICE_REPLY_TO') || 'innogroup.shawn@gmail.com';

  if (!supabaseUrl || !supabasePublishableKey) return response({ error: 'Supabase function configuration is incomplete.' }, 500);

  const client = createClient(supabaseUrl, supabasePublishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authHeader.slice('Bearer '.length);
  const { data: userData, error: userError } = await client.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) return response({ error: 'Your session is invalid or expired.' }, 401);
  if (user.app_metadata?.role !== 'admin') return response({ error: 'Invoice administrator access is required.' }, 403);
  if (!resendApiKey || !fromEmail) return response({ error: 'Invoice email service is not configured.' }, 503);

  const rawBody = await req.text();
  if (rawBody.length > MAX_REQUEST_CHARACTERS) return response({ error: 'The PDF attachment is too large.' }, 413);

  let body: SendRequest;
  try {
    body = JSON.parse(rawBody) as SendRequest;
  } catch {
    return response({ error: 'Invalid JSON request.' }, 400);
  }

  const invoiceId = asText(body.invoiceId).trim();
  const requestId = asText(body.requestId).trim();
  const pdfBase64 = asText(body.pdfBase64).replace(/\s/g, '');

  if (!invoiceId || invoiceId.length > 100) return response({ error: 'A valid invoice ID is required.' }, 400);
  if (!UUID_PATTERN.test(requestId)) return response({ error: 'A valid request ID is required.' }, 400);
  if (!pdfBase64.startsWith('JVBERi0') || pdfBase64.length > MAX_PDF_BASE64_CHARACTERS) {
    return response({ error: 'A valid PDF attachment is required.' }, 400);
  }

  const { data: invoiceData, error: invoiceError } = await client
    .from('invoices')
    .select('id, invoice_no, status, customer_name, customer_email, total_nzd, payload, send_count')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoiceData) return response({ error: 'Invoice not found or access denied.' }, 404);
  const invoice = invoiceData as InvoiceRow;
  if (invoice.status === 'draft') return response({ error: 'Issue the invoice before sending it.' }, 409);
  if (invoice.status === 'void') return response({ error: 'A void invoice cannot be sent.' }, 409);

  const recipient = asText(invoice.customer_email).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(recipient)) return response({ error: 'The invoice does not contain a valid customer email.' }, 400);

  const { data: existingEvent } = await client
    .from('invoice_email_events')
    .select('status, provider_email_id, recipient, sent_at, send_count_after')
    .eq('request_id', requestId)
    .maybeSingle();

  if (existingEvent?.status === 'sent' && existingEvent.provider_email_id) {
    return response({
      emailId: existingEvent.provider_email_id,
      recipient: existingEvent.recipient,
      sentAt: existingEvent.sent_at,
      sendCount: existingEvent.send_count_after,
      duplicate: true,
    });
  }

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentSendCount } = await client
    .from('invoice_email_events')
    .select('id', { count: 'exact', head: true })
    .eq('sent_by', user.id)
    .in('status', ['sending', 'sent'])
    .gte('created_at', oneMinuteAgo);

  if ((recentSendCount ?? 0) >= 10) return response({ error: 'Too many emails were sent. Please wait one minute.' }, 429);

  if (!existingEvent) {
    const { error: eventError } = await client.from('invoice_email_events').insert({
      invoice_id: invoice.id,
      request_id: requestId,
      recipient,
      status: 'sending',
      sent_by: user.id,
    });
    if (eventError && eventError.code !== '23505') {
      return response({ error: 'Unable to create the email audit record.' }, 500);
    }
  }

  const { html, text } = buildEmail(invoice);
  const filename = sanitizeFilename(body.filename, invoice.invoice_no);
  const idempotencyKey = `invoice/${invoice.id}/${requestId}`;
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'User-Agent': 'INNO-GROUP-Invoice/1.0',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      reply_to: replyTo,
      subject: `Invoice ${invoice.invoice_no} from INNO GROUP LTD`,
      html,
      text,
      attachments: [{ filename, content: pdfBase64 }],
      tags: [{ name: 'invoice_id', value: invoice.id.replace(/[^a-z0-9_-]/gi, '_').slice(0, 256) }],
    }),
  });

  const resendBody = await resendResponse.json().catch(() => ({})) as JsonRecord;
  if (!resendResponse.ok || !asText(resendBody.id)) {
    const providerMessage = asText(resendBody.message, `Resend returned HTTP ${resendResponse.status}`).slice(0, 500);
    await client.from('invoice_email_events').update({
      status: 'failed',
      provider_error: providerMessage,
      completed_at: new Date().toISOString(),
    }).eq('request_id', requestId);
    return response({ error: providerMessage }, resendResponse.status >= 400 && resendResponse.status < 500 ? 422 : 502);
  }

  const emailId = asText(resendBody.id);
  const sentAt = new Date().toISOString();
  const nextSendCount = Math.max(0, invoice.send_count || 0) + 1;

  const { error: invoiceUpdateError } = await client.from('invoices').update({
    last_sent_at: sentAt,
    last_sent_to: recipient,
    send_count: nextSendCount,
    updated_at: sentAt,
  }).eq('id', invoice.id);

  const { error: eventUpdateError } = await client.from('invoice_email_events').update({
    status: 'sent',
    provider_email_id: emailId,
    sent_at: sentAt,
    completed_at: sentAt,
    send_count_after: nextSendCount,
  }).eq('request_id', requestId);

  return response({
    emailId,
    recipient,
    sentAt,
    sendCount: nextSendCount,
    duplicate: false,
    trackingWarning: invoiceUpdateError || eventUpdateError ? 'Email sent, but the audit record needs review.' : undefined,
  });
});
