import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';

export const ADMIN_EMAIL = (
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? 'innogroup.shawn@gmail.com'
).trim().toLowerCase();

export function isAuthorizedAdmin(user: User | null | undefined) {
  return Boolean(
    user?.email?.toLowerCase() === ADMIN_EMAIL &&
    user.app_metadata?.role === 'admin',
  );
}

export async function getAdminUser() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) return null;
  return isAuthorizedAdmin(data.user) ? data.user : null;
}

export async function sendAdminMagicLink(returnPath: string) {
  const client = getSupabaseClient();
  const redirectUrl = new URL(returnPath, window.location.origin);
  redirectUrl.search = '';
  redirectUrl.hash = '';

  const { data, error } = await client.functions.invoke('send-admin-magic-link', {
    body: { redirectTo: redirectUrl.toString() },
  });

  if (error) {
    if (typeof error === 'object' && error !== null && 'context' in error) {
      const context = (error as { context?: Response }).context;
      if (context) {
        const body = await context.clone().json().catch(() => null) as { error?: string } | null;
        if (body?.error) throw new Error(body.error);
      }
    }
    throw error;
  }
  if (!data?.sent) throw new Error(data?.error || '登录邮件发送失败，请稍后再试。');
}

export async function signOutAdmin() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}
