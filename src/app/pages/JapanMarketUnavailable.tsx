import { Link } from 'react-router';
import { useLanguage } from '../components/SiteTranslator';

export function JapanMarketUnavailable() {
  const { text } = useLanguage();
  return <main className="min-h-[70vh] px-4 pb-20 pt-40 text-center">
    <h1>{text({ en: 'Temporarily unavailable', zh: '暂时不可用' })}</h1>
    <p className="mx-auto mt-6 max-w-xl">{text({ en: 'This section is currently unavailable. Please contact Inno Group for assistance.', zh: '此栏目暂时关闭。如需帮助，请联系 Inno Group。' })}</p>
    <div className="mt-8 flex justify-center gap-4"><Link to="/" className="button-secondary">{text({ en: 'Home', zh: '返回首页' })}</Link><Link to="/contact" className="button-primary">{text({ en: 'Contact us', zh: '联系我们' })}</Link></div>
  </main>;
}
