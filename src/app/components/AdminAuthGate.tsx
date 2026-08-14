import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { getAdminUser, signInAdmin } from '../lib/adminAuth';
import {
  ADMIN_SESSION_CHANGED_EVENT,
  IS_ADMIN_API_CONFIGURED,
  verifyAdminSession,
} from '../lib/adminApi';
import { getErrorMessage } from '../lib/contracts';

type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export function AdminAuthGate() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!IS_ADMIN_API_CONFIGURED) {
      setError('Admin 服务尚未配置，暂时无法登录。');
      setStatus('signed-out');
      return;
    }

    let active = true;
    const refresh = () => {
      void getAdminUser()
        .then((user) => {
          if (active) setStatus(user ? 'signed-in' : 'signed-out');
        })
        .catch((authError) => {
          if (!active) return;
          setError(getErrorMessage(authError));
          setStatus('signed-out');
        });
    };

    refresh();
    const handleSessionChange = () => {
      void verifyAdminSession().then((valid) => {
        if (active) setStatus(valid ? 'signed-in' : 'signed-out');
      });
    };
    window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, handleSessionChange);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, handleSessionChange);
    };
  }, []);

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password) {
      setError('请输入管理员密码。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await signInAdmin(password);
      setPassword('');
      setStatus('signed-in');
    } catch (signInError) {
      setError(getErrorMessage(signInError));
    } finally {
      setIsSubmitting(false);
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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">统一密码登录</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          合同、CRM、车辆和 Invoice 共用同一个密码。输入密码即可进入，无需邮箱或邮件链接。
        </p>

        <form className="mt-6 space-y-4" onSubmit={(event) => void submitPassword(event)}>
          <label className="block">
            <span className="sr-only">管理员密码</span>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
              <KeyRound size={18} className="shrink-0 text-slate-500" />
              <input
                autoComplete="current-password"
                autoFocus
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入管理员密码"
                className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-slate-950 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || !IS_ADMIN_API_CONFIGURED}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound size={18} />
            {isSubmitting ? '正在登录…' : '登录 Admin'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs leading-5 text-slate-500">无需邮箱；登录后会建立临时管理员会话。</p>
        <Link to="/" className="mt-5 block text-center text-sm font-medium text-slate-700 hover:text-slate-950">返回网站</Link>
      </div>
    </div>
  );
}
