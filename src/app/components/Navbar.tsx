import { ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { logoImage } from '../../data/pic';
import { LanguageSwitcher, useLanguage } from './SiteTranslator';

const vehicleLinks = [
  {
    to: '/vehicles/japan-live-stock',
    label: { en: 'Japan Live Stock', zh: '日本实时车源' },
    note: { en: 'Search auctions and fixed-price vehicles', zh: '搜索拍卖和固定价库存' },
  },
  {
    to: '/vehicles/find-my-car',
    label: { en: 'Find My Car', zh: '告诉 Inno 帮我找车' },
    note: { en: 'Tell us the exact vehicle you want', zh: '告诉我们车型、预算和配置' },
  },
  {
    to: '/vehicles/china',
    label: { en: 'Cars from China', zh: '中国车源' },
    note: { en: 'Selected EV, MPV and commercial vehicles', zh: '精选 EV、MPV 与商用车型' },
  },
];

const navigationLinks = [
  { to: '/', label: { en: 'Home', zh: '首页' } },
  { to: '/weekly-report', label: { en: 'Weekly Japan Picks', zh: '本周日本精选' } },
  { to: '/services', label: { en: 'Services', zh: '服务支持' } },
  { to: '/finance', label: { en: 'Finance', zh: '车辆贷款' } },
  { to: '/about', label: { en: 'About', zh: '关于我们' } },
  { to: '/contact', label: { en: 'Contact', zh: '联系我们' } },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const { pathname } = useLocation();
  const { text } = useLanguage();
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const vehiclesActive = pathname.startsWith('/vehicles') || pathname === '/jpauc-feed';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/92 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center" onClick={() => setIsOpen(false)}>
          <img src={logoImage} alt="Inno Group" className="h-9 w-auto object-contain transition-opacity group-hover:opacity-85 sm:h-11" />
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          <Link to="/" className={`rounded-full px-4 py-2 text-sm font-semibold ${isActive('/') ? 'bg-primary text-white shadow-[0_10px_30px_rgba(199,162,74,0.25)]' : 'text-foreground/68 hover:bg-black/[0.04] hover:text-foreground'}`}>{text({ en: 'Home', zh: '首页' })}</Link>
          <div className="group relative">
            <button type="button" className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold ${vehiclesActive ? 'bg-primary text-white shadow-[0_10px_30px_rgba(199,162,74,0.25)]' : 'text-foreground/68 hover:bg-black/[0.04] hover:text-foreground'}`} aria-haspopup="true">
              {text({ en: 'Find a Car', zh: '找车' })}<ChevronDown className="h-4 w-4" />
            </button>
            <div className="invisible absolute left-1/2 top-full w-[360px] -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="rounded-[24px] border border-black/8 bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
                {vehicleLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="block rounded-xl p-4 hover:bg-black/[0.035]">
                    <span className="block text-sm font-bold text-foreground">{text(item.label)}</span>
                    <span className="mt-1 block text-xs text-foreground/52">{text(item.note)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {navigationLinks.slice(1).map((item) => (
            <Link key={item.to} to={item.to} className={`rounded-full px-3 py-2 text-sm font-semibold ${isActive(item.to) ? 'text-primary' : 'text-foreground/68 hover:bg-black/[0.04] hover:text-foreground'}`}>{text(item.label)}</Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <LanguageSwitcher />
          <Link to="/contact#quote" className="button-primary !rounded-full !px-5 !py-3">{text({ en: 'Get a Quote', zh: '获取报价' })}</Link>
        </div>

        <button type="button" className="rounded-full border border-black/10 p-2 text-foreground xl:hidden" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-label="Toggle navigation">{isOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </nav>

      {isOpen ? (
        <div className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-black/5 bg-white px-4 py-4 shadow-lg xl:hidden">
          <div className="mx-auto max-w-7xl space-y-1">
            <Link to="/" onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">{text({ en: 'Home', zh: '首页' })}</Link>
            <button type="button" onClick={() => setVehiclesOpen((value) => !value)} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold" aria-expanded={vehiclesOpen}>{text({ en: 'Find a Car', zh: '找车' })}<ChevronDown className={`h-4 w-4 ${vehiclesOpen ? 'rotate-180' : ''}`} /></button>
            {vehiclesOpen ? <div className="ml-3 border-l border-primary/25 pl-3">{vehicleLinks.map((item) => <Link key={item.to} to={item.to} onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3"><span className="block text-sm font-bold">{text(item.label)}</span><span className="mt-1 block text-xs text-foreground/50">{text(item.note)}</span></Link>)}</div> : null}
            {navigationLinks.slice(1).map((item) => <Link key={item.to} to={item.to} onClick={() => setIsOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold">{text(item.label)}</Link>)}
            <div className="grid gap-3 border-t border-black/7 pt-4 sm:grid-cols-2"><LanguageSwitcher /><Link to="/contact#quote" onClick={() => setIsOpen(false)} className="button-primary !rounded-xl">{text({ en: 'Get a Quote', zh: '获取报价' })}</Link></div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
