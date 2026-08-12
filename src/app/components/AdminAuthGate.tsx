import { useEffect, useState } from 'react';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { ADMIN_EMAIL, getAdminUser, isAuthorizedAdmin, sendAdminMagicLink } from '../lib/adminAuth';
import { getErrorMessage } from '../lib/contracts';
import { getSupabaseClient, IS_SUPABASE_CONFIGURED } from '../lib/supabaseClient';

type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export function AdminAuthGate() {
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!IS_SUPABASE_CONFIGURED) {
      setError('Supabase 尚未配置，暂时无法登录。');
      setStatus('signed-out');
      return;
    }

    let active = true;
    const client = getSupabaseClient();

    getAdminUser()
      .then((user) => {
        if (active) setStatus(user ? 'signed-in' : 'signed-out');
      })
      .catch((authError) => {
        if (!active) return;
        setError(getErrorMessage(authError));
        setStatus('signed-out');
      });

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setStatus(isAuthorizedAdmin(session?.user) ? 'signed-in' : 'signed-out');
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const requestMagicLink = async () => {
    setIsSending(true);
    setError('');
    setNotice('');

    try {
      await sendAdminMagicLink(`${location.pathname}${location.search}`);
      setNotice(`登录链接已发送到 ${ADMIN_EMAIL}，请打开邮件并点击链接。`);
    } catch (sendError) {
      setError(getErrorMessage(sendError));
    } finally {
      setIsSending(false);
    }
  };

  if (status === 'signed-in') return <Outlet />;

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          正在检查管理员登录状态…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8f4ec_0,#eef3f8_38%,#f8fafc_100%)] px-4 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <ShieldCheck size={24} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Inno Group Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">统一无密码登录</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          合同、CRM、车辆和 Invoice 共用同一个安全会话。系统只允许下方管理员邮箱登录。
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Mail size={18} className="shrink-0 text-slate-500" />
          <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{ADMIN_EMAIL}</span>
        </div>

        {notice ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{notice}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p> : null}

        <button
          type="button"
          disabled={isSending || !IS_SUPABASE_CONFIGURED}
          onClick={() => void requestMagicLink()}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <KeyRound size={18} />
          {isSending ? '正在发送…' : notice ? '重新发送登录链接' : '发送无密码登录链接'}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-slate-500">登录链接为一次性链接，请勿转发。</p>
        <Link to="/" className="mt-5 block text-center text-sm font-medium text-slate-700 hover:text-slate-950">返回网站</Link>
      </div>
    </div>
  );
}
