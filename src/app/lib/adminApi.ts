const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const ADMIN_SESSION_KEY = 'inno:admin-session:v1';
export const ADMIN_SESSION_CHANGED_EVENT = 'inno:admin-session-changed';

export const IS_ADMIN_API_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

type AdminApiEnvelope<T> = {
  data?: T;
  error?: string;
};

function getSessionStorage() {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function getAdminSessionToken() {
  return getSessionStorage()?.getItem(ADMIN_SESSION_KEY) ?? null;
}

function setAdminSessionToken(token: string | null) {
  const storage = getSessionStorage();
  if (!storage) return;

  if (token) storage.setItem(ADMIN_SESSION_KEY, token);
  else storage.removeItem(ADMIN_SESSION_KEY);

  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
}

async function parseResponse<T>(response: Response) {
  const payload = await response.json().catch(() => ({})) as AdminApiEnvelope<T>;
  if (!response.ok) {
    if (response.status === 401) setAdminSessionToken(null);
    throw new Error(payload.error || `Admin 服务暂时不可用（${response.status}）。`);
  }

  return payload.data as T;
}

export async function adminApiRequest<T>(action: string, payload?: Record<string, unknown>) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Admin 服务尚未配置。');
  }

  const token = getAdminSessionToken();
  const response = await fetch(`${supabaseUrl}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });

  return parseResponse<T>(response);
}

export async function loginWithAdminPassword(password: string) {
  const result = await adminApiRequest<{ token: string; expiresAt: string }>('login', { password });
  if (!result?.token) throw new Error('登录服务没有返回有效会话。');
  setAdminSessionToken(result.token);
  return result;
}

export async function verifyAdminSession() {
  if (!getAdminSessionToken()) return false;

  try {
    const result = await adminApiRequest<{ valid: boolean }>('session.verify');
    return Boolean(result?.valid);
  } catch {
    setAdminSessionToken(null);
    return false;
  }
}

export function clearAdminSession() {
  setAdminSessionToken(null);
}

export async function invokeAdminFunction<T>(functionName: string, body: Record<string, unknown>) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Admin 服务尚未配置。');
  }

  const token = getAdminSessionToken();
  if (!token) throw new Error('管理员会话已过期，请重新登录。');

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}
