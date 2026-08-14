import {
  clearAdminSession,
  loginWithAdminPassword,
  verifyAdminSession,
} from './adminApi';

export async function getAdminUser() {
  return (await verifyAdminSession()) ? { role: 'admin' as const } : null;
}

export async function signInAdmin(password: string) {
  await loginWithAdminPassword(password);
  return { role: 'admin' as const };
}

export async function signOutAdmin() {
  clearAdminSession();
}
