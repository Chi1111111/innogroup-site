type JsonRecord = Record<string, unknown>;

const encoder = new TextEncoder();
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;

const ALLOWED_ORIGINS = new Set([
  'https://innogroup.co.nz',
  'https://www.innogroup.co.nz',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://innogroup.co.nz',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function jsonResponse(req: Request, body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function passwordMatches(input: string, expected: string) {
  const [inputDigest, expectedDigest] = await Promise.all([digest(input), digest(expected)]);
  let difference = 0;
  for (let index = 0; index < expectedDigest.length; index += 1) {
    difference |= inputDigest[index] ^ expectedDigest[index];
  }
  return difference === 0;
}

export async function issueAdminSession(secret: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + SESSION_LIFETIME_SECONDS;
  const payload = base64UrlEncode(encoder.encode(JSON.stringify({
    version: 1,
    subject: 'inno-admin',
    issuedAt,
    expiresAt,
    sessionId: crypto.randomUUID(),
  })));
  const key = await hmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  return {
    token: `${payload}.${base64UrlEncode(signature)}`,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
}

export async function verifyAdminSession(req: Request, secret: string) {
  const authorization = req.headers.get('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const [payloadPart, signaturePart, extraPart] = token.split('.');
  if (!payloadPart || !signaturePart || extraPart) return false;

  try {
    const key = await hmacKey(secret);
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signaturePart),
      encoder.encode(payloadPart),
    );
    if (!validSignature) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart))) as {
      version?: number;
      subject?: string;
      issuedAt?: number;
      expiresAt?: number;
      sessionId?: string;
    };
    const now = Math.floor(Date.now() / 1000);
    return Boolean(
      payload.version === 1 &&
      payload.subject === 'inno-admin' &&
      typeof payload.issuedAt === 'number' &&
      payload.issuedAt <= now + 60 &&
      typeof payload.expiresAt === 'number' &&
      payload.expiresAt > now &&
      typeof payload.sessionId === 'string',
    );
  } catch {
    return false;
  }
}

export async function hashClientAddress(req: Request, secret: string) {
  const address = (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    'unknown'
  ).trim();
  const key = await hmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(address)));
  return base64UrlEncode(signature);
}
