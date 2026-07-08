import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { logoImage } from '../../data/pic';
import { LanguageSwitcher, useLanguage } from './SiteTranslator';

const navigationLinks = [
  { to: '/', label: { en: 'Home', zh: '首页' } },
  { to: '/vehicles/china', label: { en: 'Cars from China', zh: '中国车源' } },
  { to: '/vehicles/japan-special-order', label: { en: 'Japan Finds', zh: '日本精选车源' } },
  { to: '/jpauc-feed', label: { en: 'Cars From Japan', zh: '日本车源' } },
  { to: '/services', label: { en: 'Services', zh: '服务支持' } },
  { to: '/finance', label: { en: 'Finance', zh: '车辆贷款' } },
  { to: '/about', label: { en: 'About', zh: '关于我们' } },
  { to: '/contact', label: { en: 'Contact', zh: '联系我们' } },
];

const GlobeIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="url(#globe-gradient)" stroke="#c7a24a" strokeWidth="1.5" />
    <path d="M20 2C20 2 14 10 14 20C14 30 20 38 20 38" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M20 2C20 2 26 10 26 20C26 30 20 38 20 38" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M3 20H37" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 12H35" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M5 28H35" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <defs>
      <linearGradient id="globe-gradient" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1a1a1a" />
        <stop offset="1" stopColor="#2d2d2d" />
      </linearGradient>
    </defs>
  </svg>
);

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { text } = useLanguage();

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <img
            src={logoImage}
            alt="Inno Group"
            className="h-8 w-auto max-w-[170px] object-contain transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-90 sm:h-10 sm:max-w-none md:h-12"
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navigationLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                isActive(item.to)
                  ? 'bg-primary text-white shadow-[0_10px_30px_rgba(199,162,74,0.25)]'
                  : 'text-foreground/70 hover:bg-black/[0.04] hover:text-foreground'
              }`}
            >
              {text(item.label)}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <GlobeIcon />
        </div>

        <button
          type="button"
          className="rounded-full border border-black/10 p-2 text-foreground lg:hidden"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-black/5 bg-white px-4 py-4 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigationLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  isActive(item.to)
                    ? 'bg-primary text-white'
                    : 'text-foreground/75 hover:bg-black/[0.04]'
                }`}
              >
                {text(item.label)}
              </Link>
            ))}
            <div className="px-1 pt-2">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
