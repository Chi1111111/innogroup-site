import { createClient } from 'npm:@supabase/supabase-js@2.106.1';
import {
  corsHeaders,
  hashClientAddress,
  issueAdminSession,
  jsonResponse,
  passwordMatches,
  verifyAdminSession,
} from '../_shared/admin-session.ts';

type JsonRecord = Record<string, unknown>;

const MAX_REQUEST_CHARACTERS = 16_000_000;
const LOGIN_WINDOW_MINUTES = 15;
const MAX_LOGIN_FAILURES_PER_IP = 10;
const MAX_GLOBAL_LOGIN_FAILURES = 100;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureId(value: unknown) {
  const id = asText(value);
  if (!id || id.length > 100) throw new Error('Invalid record ID.');
  return id;
}

function ensureRow(value: unknown, required: string[]) {
  const row = asRecord(value);
  for (const field of required) {
    if (!asText(row[field])) throw new Error(`Missing required field: ${field}`);
  }
  return row;
}

function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const secretDictionary = Deno.env.get('SUPABASE_SECRET_KEYS');
  let secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (secretDictionary) {
    try {
      secretKey = (JSON.parse(secretDictionary) as Record<string, string>).default || secretKey;
    } catch {
      // Keep the legacy service-role fallback.
    }
  }
  if (!url || !secretKey) throw new Error('Supabase service configuration is incomplete.');
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function websiteLeadToCrmLead(value: unknown) {
  const row = asRecord(value);
  const id = asText(row.id);
  return {
    id: `web:${id}`,
    createdAt: asText(row.created_at).slice(0, 10),
    name: asText(row.name),
    phone: asText(row.phone),
    email: asText(row.email),
    contact: asText(row.contact),
    channel: asText(row.channel) || 'Website · Japan Market',
    interest: asText(row.interest),
    budget: asText(row.budget),
    status: asText(row.status) || '了解',
    nextFollowUp: asText(row.next_follow_up),
    notes: asText(row.notes),
  };
}

async function handleLogin(req: Request, client: ReturnType<typeof serviceClient>, body: JsonRecord) {
  const expectedPassword = Deno.env.get('ADMIN_SHARED_PASSWORD');
  const sessionSecret = Deno.env.get('ADMIN_SESSION_SECRET');
  if (!expectedPassword || !sessionSecret) {
    return jsonResponse(req, { error: 'Admin password service is not configured.' }, 503);
  }

  const ipHash = await hashClientAddress(req, sessionSecret);
  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60_000).toISOString();
  const [ipFailures, globalFailures] = await Promise.all([
    client
      .from('admin_login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('success', false)
      .gte('attempted_at', since),
    client
      .from('admin_login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('success', false)
      .gte('attempted_at', since),
  ]);

  if ((ipFailures.count ?? 0) >= MAX_LOGIN_FAILURES_PER_IP || (globalFailures.count ?? 0) >= MAX_GLOBAL_LOGIN_FAILURES) {
    return jsonResponse(req, { error: '登录尝试次数过多，请稍后再试。' }, 429);
  }

  const suppliedPassword = typeof body.password === 'string' ? body.password : '';
  const success = suppliedPassword.length <= 200 && await passwordMatches(suppliedPassword, expectedPassword);
  const { error: auditError } = await client.from('admin_login_attempts').insert({ ip_hash: ipHash, success });
  if (auditError) return jsonResponse(req, { error: '登录服务暂时不可用。' }, 503);

  if (!success) return jsonResponse(req, { error: '密码错误，请重新输入。' }, 401);

  const session = await issueAdminSession(sessionSecret);
  return jsonResponse(req, { data: session });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed.' }, 405);

  const rawBody = await req.text();
  if (rawBody.length > MAX_REQUEST_CHARACTERS) return jsonResponse(req, { error: 'Request is too large.' }, 413);

  let body: JsonRecord;
  try {
    body = asRecord(JSON.parse(rawBody));
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON request.' }, 400);
  }

  let client: ReturnType<typeof serviceClient>;
  try {
    client = serviceClient();
  } catch (error) {
    return jsonResponse(req, { error: error instanceof Error ? error.message : 'Service unavailable.' }, 503);
  }

  const action = asText(body.action);
  if (action === 'login') return handleLogin(req, client, body);

  const sessionSecret = Deno.env.get('ADMIN_SESSION_SECRET');
  if (!sessionSecret || !(await verifyAdminSession(req, sessionSecret))) {
    return jsonResponse(req, { error: '管理员会话无效或已过期，请重新登录。' }, 401);
  }

  try {
    if (action === 'session.verify') return jsonResponse(req, { data: { valid: true } });

    if (action === 'contracts.list') {
      const { data, error } = await client.from('contracts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return jsonResponse(req, { data: data ?? [] });
    }
    if (action === 'contracts.upsert') {
      const row = ensureRow(body.row, ['id', 'contract_type', 'status', 'signing_token']);
      const { error } = await client.from('contracts').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return jsonResponse(req, { data: { saved: true } });
    }
    if (action === 'contracts.delete') {
      const { error } = await client.from('contracts').delete().eq('id', ensureId(body.id));
      if (error) throw error;
      return jsonResponse(req, { data: { deleted: true } });
    }

    if (action === 'crm.get') {
      const [crmResult, newLeadResult] = await Promise.all([
        client.from('crm_state').select('payload').eq('id', 'main').maybeSingle(),
        client
          .from('website_leads')
          .select('*')
          .is('synced_to_crm_at', null)
          .order('created_at', { ascending: false }),
      ]);
      if (crmResult.error) throw crmResult.error;
      if (newLeadResult.error) throw newLeadResult.error;

      const payload = asRecord(crmResult.data?.payload);
      const existingLeads = Array.isArray(payload.leads) ? payload.leads : [];
      const knownIds = new Set(existingLeads.map((lead) => asText(asRecord(lead).id)));
      const incomingLeads = (newLeadResult.data ?? [])
        .map(websiteLeadToCrmLead)
        .filter((lead) => lead.id !== 'web:' && !knownIds.has(lead.id));

      return jsonResponse(req, {
        data: {
          ...payload,
          leads: [...incomingLeads, ...existingLeads],
          orders: Array.isArray(payload.orders) ? payload.orders : [],
          loanCars: Array.isArray(payload.loanCars) ? payload.loanCars : [],
        },
      });
    }
    if (action === 'crm.upsert') {
      const payload = asRecord(body.payload);
      const leads = Array.isArray(payload.leads) ? payload.leads.map(asRecord) : [];
      const websiteLeads = leads.filter((lead) => asText(lead.id).startsWith('web:'));
      const syncedAt = new Date().toISOString();

      const websiteLeadUpdates = await Promise.all(websiteLeads.map(async (lead) => {
        const id = asText(lead.id).slice(4);
        if (!id) return null;
        return client.from('website_leads').update({
          contact: asText(lead.contact),
          channel: asText(lead.channel),
          interest: asText(lead.interest),
          budget: asText(lead.budget),
          status: asText(lead.status) || '了解',
          next_follow_up: asText(lead.nextFollowUp) || null,
          notes: asText(lead.notes),
          synced_to_crm_at: syncedAt,
        }).eq('id', id);
      }));
      const leadUpdateError = websiteLeadUpdates.find((result) => result?.error)?.error;
      if (leadUpdateError) throw leadUpdateError;

      const { error } = await client.from('crm_state').upsert({
        id: 'main',
        payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) throw error;
      return jsonResponse(req, { data: { saved: true } });
    }

    if (action === 'japan.upsert') {
      if (!Array.isArray(body.payload) && Object.keys(asRecord(body.payload)).length === 0) {
        return jsonResponse(req, { error: 'Invalid weekly report payload.' }, 400);
      }
      const { error } = await client.from('japan_special_orders_state').upsert({
        id: 'main',
        payload: body.payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) throw error;
      return jsonResponse(req, { data: { saved: true } });
    }

    if (action === 'invoices.list') {
      const { data, error } = await client.from('invoices').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return jsonResponse(req, { data: data ?? [] });
    }
    if (action === 'invoices.upsert') {
      const row = ensureRow(body.row, ['id', 'invoice_no', 'status']);
      if (!['draft', 'issued', 'paid', 'void'].includes(asText(row.status))) {
        return jsonResponse(req, { error: 'Invalid invoice status.' }, 400);
      }
      const { error } = await client.from('invoices').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return jsonResponse(req, { data: { saved: true } });
    }
    if (action === 'invoices.delete') {
      const { error } = await client.from('invoices').delete().eq('id', ensureId(body.id)).eq('status', 'draft');
      if (error) throw error;
      return jsonResponse(req, { data: { deleted: true } });
    }

    return jsonResponse(req, { error: 'Unknown admin action.' }, 400);
  } catch (error) {
    console.error('admin-api failure', error);
    return jsonResponse(req, { error: 'Admin operation failed.' }, 500);
  }
});
