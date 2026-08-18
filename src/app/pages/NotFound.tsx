import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '../components/SiteTranslator';

export function NotFound() {
  const { text } = useLanguage();
  return (
    <main className="flex min-h-[72vh] items-center bg-[#111214] px-4 pb-20 pt-32 text-white">
      <div className="section-shell text-center">
        <Search className="mx-auto h-12 w-12 text-primary" />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-primary">404</p>
        <h1 className="mt-4 text-white">{text({ en: 'This page could not be found.', zh: '找不到这个页面。' })}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/65">{text({ en: 'The link may be outdated, or the page may have moved. Return home or browse our current vehicle options.', zh: '链接可能已经失效，或页面已移动。你可以返回首页，或查看当前车辆选择。' })}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="button-primary"><ArrowLeft className="h-5 w-5" />{text({ en: 'Back home', zh: '返回首页' })}</Link>
          <Link to="/vehicles/china" className="button-secondary">{text({ en: 'Browse vehicles', zh: '查看车型' })}</Link>
        </div>
      </div>
    </main>
  );
}
