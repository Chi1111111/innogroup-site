import { createClient } from 'npm:@supabase/supabase-js@2.106.1';
import { corsHeaders, hashClientAddress, jsonResponse } from '../_shared/admin-session.ts';

type JsonRecord = Record<string, unknown>;

const ALLOWED_ORIGINS = new Set([
  'https://innogroup.co.nz',
  'https://www.innogroup.co.nz',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const MAX_BODY_CHARACTERS = 20_000;
const MAX_LEADS_PER_IP = 5;
const RATE_LIMIT_MINUTES = 15;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
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
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed.' }, 405);

  const origin = req.headers.get('Origin') ?? '';
  if (!ALLOWED_ORIGINS.has(origin)) return jsonResponse(req, { error: 'Origin not allowed.' }, 403);

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_CHARACTERS) return jsonResponse(req, { error: 'Request is too large.' }, 413);

  let body: JsonRecord;
  try {
    body = asRecord(JSON.parse(rawBody));
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON request.' }, 400);
  }

  if (asText(body.company, 200)) return jsonResponse(req, { data: { received: true } });

  const requestKind = asText(body.requestKind, 40);
  const name = asText(body.name, 120);
  const phone = asText(body.phone, 60);
  const email = asText(body.email, 200);
  const preferredContact = asText(body.preferredContact, 40);
  const message = asText(body.message, 4_000);
  const vehicleId = asText(body.vehicleId, 100);
  const vehicleMake = asText(body.vehicleMake, 100);
  const vehicleModel = asText(body.vehicleModel, 160);
  const vehicleYear = Number(body.vehicleYear) || null;
  const estimatedPrice = Number(body.estimatedPrice) || null;
  const sourcePage = asText(body.sourcePage, 500);

  if (!['vehicle_enquiry', 'sourcing_request'].includes(requestKind)) {
    return jsonResponse(req, { error: 'Invalid enquiry type.' }, 400);
  }
  if (!name || !message || (!phone && !email) || !preferredContact) {
    return jsonResponse(req, { error: 'Please complete the required contact details.' }, 400);
  }
  if (requestKind === 'vehicle_enquiry' && !vehicleId) {
    return jsonResponse(req, { error: 'Vehicle ID is required.' }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(req, { error: 'Please enter a valid email address.' }, 400);
  }

  try {
    const client = serviceClient();
    const rateLimitSecret = Deno.env.get('LEAD_CAPTURE_HASH_SECRET') || Deno.env.get('ADMIN_SESSION_SECRET');
    if (!rateLimitSecret) return jsonResponse(req, { error: 'Lead service is not configured.' }, 503);

    const ipHash = await hashClientAddress(req, rateLimitSecret);
    const since = new Date(Date.now() - RATE_LIMIT_MINUTES * 60_000).toISOString();
    const { count, error: countError } = await client
      .from('website_leads')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_LEADS_PER_IP) {
      return jsonResponse(req, { error: 'Too many requests. Please try again shortly.' }, 429);
    }

    const vehicleLabel = [vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ');
    const contact = preferredContact === 'phone' ? phone : preferredContact === 'email' ? email : `${phone} / ${email}`;
    const interest = requestKind === 'vehicle_enquiry'
      ? `${vehicleLabel || 'Japan Market vehicle'} · ${vehicleId}`
      : 'Japan vehicle sourcing request';
    const notes = [`Preferred contact: ${preferredContact}`, vehicleId ? `Vehicle ID: ${vehicleId}` : '', message]
      .filter(Boolean)
      .join('\n');

    const { data, error } = await client.from('website_leads').insert({
      request_kind: requestKind,
      name,
      phone: phone || null,
      email: email || null,
      preferred_contact: preferredContact,
      vehicle_id: vehicleId || null,
      vehicle_make: vehicleMake || null,
      vehicle_model: vehicleModel || null,
      vehicle_year: vehicleYear,
      estimated_price: estimatedPrice,
      message,
      contact,
      interest,
      budget: estimatedPrice ? String(estimatedPrice) : '',
      notes,
      source_page: sourcePage || null,
      ip_hash: ipHash,
      user_agent: asText(req.headers.get('User-Agent'), 500) || null,
    }).select('id').single();
    if (error) throw error;

    return jsonResponse(req, { data: { received: true, id: data.id } }, 201);
  } catch (error) {
    console.error('capture-lead failure', error);
    return jsonResponse(req, { error: 'We could not send your enquiry. Please try again.' }, 500);
  }
});
