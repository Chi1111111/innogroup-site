import { createClient } from 'npm:@supabase/supabase-js@2.106.1';

type JsonRecord = Record<string, unknown>;

const MAX_REQUEST_CHARACTERS = 2_100_000;
const MAX_SIGNATURE_CHARACTERS = 2_000_000;
const SIGNING_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const SIGNABLE_STATUSES = new Set(['sent', 'viewed']);
const ALLOWED_ORIGINS = new Set([
  'https://innogroup.co.nz',
  'https://www.innogroup.co.nz',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://innogroup.co.nz',
    'Access-Control-Allow-Headers': 'apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(req: Request, body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readSigningToken(value: unknown) {
  const signingToken = asText(value);
  return SIGNING_TOKEN_PATTERN.test(signingToken) ? signingToken : '';
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
  if (!url || !secretKey) throw new Error('Signing service configuration is incomplete.');
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function withViewedPayload(payloadValue: unknown, viewedAt: string) {
  return {
    ...asRecord(payloadValue),
    status: 'viewed',
    viewedAt,
  };
}

function withSignedPayload(
  payloadValue: unknown,
  signerName: string,
  signatureData: string,
  signedAt: string,
  userAgent: string,
) {
  const payload = asRecord(payloadValue);
  const acknowledgements = asRecord(payload.acknowledgements);
  const signatures = asRecord(payload.signatures);

  return {
    ...payload,
    status: 'signed',
    signedAt,
    signedIpNote: 'Captured in browser signing session',
    signedUserAgent: userAgent,
    acknowledgements: {
      ...acknowledgements,
      termsAccepted: true,
      cinProvided: true,
      signDocumentsAccepted: true,
      odometerAcknowledged: true,
      privacyAccepted: true,
      depositForfeitureAccepted: true,
    },
    signatures: {
      ...signatures,
      purchaserName: signerName,
      purchaser: signatureData,
    },
  };
}

async function markViewed(
  req: Request,
  client: ReturnType<typeof serviceClient>,
  signingToken: string,
) {
  const { data: contract, error: loadError } = await client
    .from('contracts')
    .select('id, status, viewed_at, payload')
    .eq('signing_token', signingToken)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!contract || !['sent', 'viewed', 'signed'].includes(contract.status)) {
    return jsonResponse(req, { error: 'This signing link is not available.' }, 404);
  }
  if (contract.status !== 'sent') {
    return jsonResponse(req, { data: { viewed: true } });
  }

  const viewedAt = contract.viewed_at || new Date().toISOString();
  const { data: updated, error: updateError } = await client
    .from('contracts')
    .update({
      status: 'viewed',
      viewed_at: viewedAt,
      payload: withViewedPayload(contract.payload, viewedAt),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contract.id)
    .eq('signing_token', signingToken)
    .eq('status', 'sent')
    .select('id')
    .maybeSingle();
  if (updateError) throw updateError;

  if (updated) {
    const { error: eventError } = await client.from('contract_events').insert({
      contract_id: contract.id,
      event_type: 'viewed',
      user_agent: (req.headers.get('user-agent') || '').slice(0, 1000) || null,
      note: null,
    });
    if (eventError) console.error('Could not record contract viewed event', eventError);
  }

  return jsonResponse(req, { data: { viewed: true } });
}

async function signContract(
  req: Request,
  client: ReturnType<typeof serviceClient>,
  signingToken: string,
  body: JsonRecord,
) {
  const signerName = asText(body.signerName);
  const signatureData = asText(body.signatureData);
  if (!signerName || signerName.length > 200) {
    return jsonResponse(req, { error: 'Please enter a valid full legal name.' }, 400);
  }
  if (
    !signatureData.startsWith('data:image/png;base64,') ||
    signatureData.length > MAX_SIGNATURE_CHARACTERS
  ) {
    return jsonResponse(req, { error: 'Please draw a valid signature and try again.' }, 400);
  }

  const { data: contract, error: loadError } = await client
    .from('contracts')
    .select('id, status, signed_at, payload')
    .eq('signing_token', signingToken)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!contract) return jsonResponse(req, { error: 'This signing link is not available.' }, 404);
  if (contract.status === 'signed') {
    return jsonResponse(req, {
      data: {
        signedAt: contract.signed_at || new Date().toISOString(),
        alreadySigned: true,
      },
    });
  }
  if (!SIGNABLE_STATUSES.has(contract.status)) {
    return jsonResponse(req, { error: 'This agreement is not available for signing.' }, 409);
  }

  const signedAt = new Date().toISOString();
  const userAgent = (req.headers.get('user-agent') || '').slice(0, 1000);
  const { data: updated, error: updateError } = await client
    .from('contracts')
    .update({
      status: 'signed',
      signed_at: signedAt,
      payload: withSignedPayload(contract.payload, signerName, signatureData, signedAt, userAgent),
      updated_at: signedAt,
    })
    .eq('id', contract.id)
    .eq('signing_token', signingToken)
    .in('status', [...SIGNABLE_STATUSES])
    .select('id')
    .maybeSingle();
  if (updateError) throw updateError;

  if (!updated) {
    const { data: latest, error: latestError } = await client
      .from('contracts')
      .select('status, signed_at')
      .eq('id', contract.id)
      .eq('signing_token', signingToken)
      .maybeSingle();
    if (latestError) throw latestError;
    if (latest?.status === 'signed') {
      return jsonResponse(req, {
        data: { signedAt: latest.signed_at || signedAt, alreadySigned: true },
      });
    }
    return jsonResponse(req, { error: 'The agreement changed before it could be signed. Please reload and try again.' }, 409);
  }

  const auditResults = await Promise.allSettled([
    client.from('contract_signatures').insert({
      contract_id: contract.id,
      signer_name: signerName,
      signature_data: signatureData,
      user_agent: userAgent || null,
    }),
    client.from('contract_events').insert({
      contract_id: contract.id,
      event_type: 'signed',
      user_agent: userAgent || null,
      note: 'Captured in browser signing session',
    }),
  ]);
  for (const result of auditResults) {
    if (result.status === 'rejected') console.error('Could not write contract signing audit record', result.reason);
    else if (result.value.error) console.error('Could not write contract signing audit record', result.value.error);
  }

  return jsonResponse(req, { data: { signedAt } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed.' }, 405);

  const rawBody = await req.text();
  if (rawBody.length > MAX_REQUEST_CHARACTERS) {
    return jsonResponse(req, { error: 'The signature is too large. Please clear it and sign again.' }, 413);
  }

  let body: JsonRecord;
  try {
    body = asRecord(JSON.parse(rawBody));
  } catch {
    return jsonResponse(req, { error: 'Invalid signing request.' }, 400);
  }

  const signingToken = readSigningToken(body.signingToken);
  if (!signingToken) return jsonResponse(req, { error: 'This signing link is not available.' }, 404);

  let client: ReturnType<typeof serviceClient>;
  try {
    client = serviceClient();
  } catch (error) {
    return jsonResponse(req, { error: error instanceof Error ? error.message : 'Signing service unavailable.' }, 503);
  }

  try {
    const action = asText(body.action);
    if (action === 'view') return await markViewed(req, client, signingToken);
    if (action === 'sign') return await signContract(req, client, signingToken, body);
    return jsonResponse(req, { error: 'Unknown signing action.' }, 400);
  } catch (error) {
    console.error('contract-signing failure', error);
    return jsonResponse(req, { error: 'Could not save the signature. Please try again.' }, 500);
  }
});
