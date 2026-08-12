import { createClient } from 'npm:@supabase/supabase-js@2.106.1';

type JsonRecord = Record<string, unknown>;

const ADMIN_EMAIL = (Deno.env.get('ADMIN_EMAIL') || 'innogroup.shawn@gmail.com').toLowerCase();
const AUTH_FROM_EMAIL = Deno.env.get('AUTH_FROM_EMAIL') || 'INNO GROUP LTD <login@send.innogroup.co.nz>';
const ALLOWED_ORIGINS = new Set([
  'https://www.innogroup.co.nz',
  'https://innogroup.co.nz',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5174',
]);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://www.innogroup.co.nz',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function response(body: JsonRecord, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function validateRedirect(value: unknown) {
  if (typeof value !== 'string' || value.length > 500) return null;

  try {
    const url = new URL(value);
    if (!ALLOWED_ORIGINS.has(url.origin) || !url.pathname.startsWith('/admin')) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

async function hashIp(value: string) {
  const bytes = new TextEncoder().encode(value.slice(0, 200));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getSupabaseSecretKey() {
  const keyDictionary = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keyDictionary) {
    try {
      const keys = JSON.parse(keyDictionary) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch {
      // Fall back to the legacy service-role key on older projects.
    }
  }

  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return response({ error: 'Method not allowed.' }, 405, origin);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return response({ error: 'This website origin is not allowed.' }, 403, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = getSupabaseSecretKey();
  const resendApiKey = Deno.env.get('AUTH_RESEND_API_KEY');
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return response({ error: 'The passwordless email service is not configured.' }, 503, origin);
  }

  let body: JsonRecord;
  try {
    body = await req.json() as JsonRecord;
  } catch {
    return response({ error: 'Invalid request.' }, 400, origin);
  }

  const redirectTo = validateRedirect(body.redirectTo);
  if (!redirectTo) return response({ error: 'The login return address is not allowed.' }, 400, origin);

  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';
  const ipHash = await hashIp(forwardedFor);
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const [{ count: ipRequestCount }, { count: globalRequestCount }] = await Promise.all([
    client.from('admin_magic_link_requests').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('requested_at', tenMinutesAgo),
    client.from('admin_magic_link_requests').select('id', { count: 'exact', head: true }).gte('requested_at', oneHourAgo),
  ]);

  if ((ipRequestCount ?? 0) >= 5 || (globalRequestCount ?? 0) >= 30) {
    return response({ error: '登录邮件请求过于频繁，请稍后再试。' }, 429, origin);
  }

  const { data: requestRow, error: requestError } = await client
    .from('admin_magic_link_requests')
    .insert({ ip_hash: ipHash, redirect_to: redirectTo, status: 'generating' })
    .select('id')
    .single();

  if (requestError || !requestRow) {
    console.error('Unable to create the magic-link audit record.', requestError);
    return response({ error: 'Unable to start the login email request.' }, 500, origin);
  }

  const { data: linkData, error: linkError } = await client.auth.admin.generateLink({
    type: 'magiclink',
    email: ADMIN_EMAIL,
    options: { redirectTo },
  });
  const actionLink = linkData?.properties?.action_link;

  if (linkError || !actionLink) {
    console.error('Unable to generate the Supabase magic link.', linkError);
    await client.from('admin_magic_link_requests').update({ status: 'failed' }).eq('id', requestRow.id);
    return response({ error: 'Unable to create the login link.' }, 502, origin);
  }

  const safeActionLink = escapeHtml(actionLink);
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'INNO-GROUP-Admin-Auth/1.0',
    },
    body: JSON.stringify({
      from: AUTH_FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: 'INNO GROUP Admin login link',
      html: `<!doctype html><html><body style="margin:0;background:#f3f4f6;color:#111827;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px 16px"><div style="border-radius:20px;background:#fff;padding:32px;box-shadow:0 16px 50px rgba(15,23,42,.08)"><div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#138a62">INNO GROUP LTD</div><h1 style="margin:12px 0 8px;font-size:26px">Admin passwordless login</h1><p style="margin:0 0 24px;line-height:1.6;color:#4b5563">Click the secure button below to sign in. This link is single-use and should not be forwarded.</p><a href="${safeActionLink}" style="display:inline-block;border-radius:12px;background:#0f172a;color:#fff;text-decoration:none;padding:14px 22px;font-weight:700">Sign in to Admin</a><p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">If you did not request this email, you can safely ignore it.</p></div></div></body></html>`,
      text: `INNO GROUP Admin passwordless login\n\nOpen this single-use link to sign in:\n${actionLink}\n\nIf you did not request this email, ignore it.`,
      tags: [{ name: 'email_type', value: 'admin_magic_link' }],
    }),
  });

  const resendBody = await resendResponse.json().catch(() => ({})) as JsonRecord;
  const emailId = typeof resendBody.id === 'string' ? resendBody.id : null;
  await client.from('admin_magic_link_requests').update({
    status: resendResponse.ok && emailId ? 'sent' : 'failed',
    provider_email_id: emailId,
    completed_at: new Date().toISOString(),
  }).eq('id', requestRow.id);

  if (!resendResponse.ok || !emailId) {
    return response({ error: 'The login email provider rejected the request.' }, 502, origin);
  }

  await client.from('admin_magic_link_requests').delete().lt('requested_at', new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString());
  return response({ sent: true }, 200, origin);
});
