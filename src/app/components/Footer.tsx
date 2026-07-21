import { Link } from 'react-router';
import { BrandLogo } from './BrandLogo';
import { LanguageSwitcher, useLanguage } from './SiteTranslator';

export function Footer() {
  const { text } = useLanguage();

  return (
    <footer className="bg-[#0f1012] px-4 py-18 text-white">
      <div className="section-shell">
        <div className="grid grid-cols-1 gap-10 border-b border-white/8 pb-12 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr]">
          <div className="space-y-5">
            <BrandLogo variant="watermark" />

            <p className="max-w-sm text-base leading-8 text-white/62">
              {text({
                en: 'Auckland-based vehicle sourcing across Japan, China, Macau and selected overseas markets, with clear communication and local New Zealand support.',
                zh: 'Inno Group 位于奥克兰，为新西兰客户对接日本、中国、澳门及其他海外车源，并提供清晰沟通和本地支持。',
              })}
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {text({ en: 'Multi-Market Sourcing', zh: '多市场车源网络' })}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {text({ en: 'Quick Links', zh: '快速链接' })}
            </h4>
            <ul className="space-y-3 text-white/62">
              <li><Link to="/" className="inline-block transition-colors hover:text-primary">{text({ en: 'Home', zh: '首页' })}</Link></li>
              <li><Link to="/weekly-report" className="inline-block transition-colors hover:text-primary">{text({ en: 'Weekly Japan Picks', zh: '本周日本精选' })}</Link></li>
              <li><Link to="/vehicles/japan-live-stock" className="inline-block transition-colors hover:text-primary">{text({ en: 'Search Japan Cars', zh: '搜索日本车源' })}</Link></li>
              <li><Link to="/vehicles/japan-special-order" className="inline-block transition-colors hover:text-primary">{text({ en: 'Japan Finds', zh: '日本精选车源' })}</Link></li>
              <li><Link to="/vehicles/find-my-car" className="inline-block transition-colors hover:text-primary">{text({ en: 'Find My Car', zh: '帮我找车' })}</Link></li>
              <li><Link to="/vehicles/china" className="inline-block transition-colors hover:text-primary">{text({ en: 'Cars from China', zh: '中国车源' })}</Link></li>
              <li><Link to="/about" className="inline-block transition-colors hover:text-primary">{text({ en: 'About', zh: '关于我们' })}</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">{text({ en: 'Services', zh: '服务支持' })}</Link></li>
              <li><Link to="/finance" className="inline-block transition-colors hover:text-primary">{text({ en: 'Finance', zh: '车辆贷款' })}</Link></li>
              <li><Link to="/contact" className="inline-block transition-colors hover:text-primary">{text({ en: 'Contact', zh: '联系我们' })}</Link></li>
            </ul>

            <h4 className="mb-5 mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {text({ en: 'Language', zh: '语言' })}
            </h4>
            <div className="max-w-[190px]">
              <LanguageSwitcher compact />
            </div>
            <p className="mt-3 text-sm leading-6 text-white/52">
              {text({
                en: 'Switch the website language without opening a separate Chinese site.',
                zh: '无需打开单独中文页面，直接切换当前网站语言。',
              })}
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {text({ en: 'Support', zh: '支持' })}
            </h4>
            <ul className="space-y-3 text-white/62">
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">{text({ en: 'Panel and paint support', zh: '钣金喷漆支持' })}</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">{text({ en: 'Mechanical repairs', zh: '机械维修' })}</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">{text({ en: 'Parts sourcing', zh: '配件寻找' })}</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">{text({ en: 'Partner referrals', zh: '合作方推荐' })}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {text({ en: 'Contact', zh: '联系方式' })}
            </h4>
            <ul className="space-y-4 text-white/62">
              <li>
                <strong className="text-white">{text({ en: 'Phone', zh: '电话' })}</strong><br />
                <a href="tel:+64288530725" className="transition-colors hover:text-primary">+64 28 8530 7225</a><br />
                <a href="tel:+64272858065" className="transition-colors hover:text-primary">+64 27 285 8065</a>
              </li>
              <li>
                <strong className="text-white">WhatsApp</strong><br />
                <a href="https://wa.me/64272858065" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                  +64 27 285 8065
                </a>
              </li>
              <li>
                <strong className="text-white">{text({ en: 'Email', zh: '邮箱' })}</strong><br />
                <a href="mailto:innogroup.shawn@gmail.com" className="transition-colors hover:text-primary">innogroup.shawn@gmail.com</a><br />
                <a href="mailto:innogroup.cao@gmail.com" className="transition-colors hover:text-primary">innogroup.cao@gmail.com</a>
              </li>
              <li>
                <strong className="text-white">{text({ en: 'Address', zh: '地址' })}</strong><br />
                Unit 1A, 331 Rosedale Road, Albany, Auckland, New Zealand
              </li>
              <li>
                <strong className="text-white">{text({ en: 'Hours', zh: '营业时间' })}</strong><br />
                {text({ en: 'Mon-Fri: 10AM-5PM', zh: '周一至周五：10AM-5PM' })}<br />
                {text({ en: 'Other times by appointment', zh: '其他时间可预约' })}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 pt-8 text-sm text-white/42 md:flex-row md:items-center">
          <div>
            <p>&copy; 2026 Inno Group Ltd. All rights reserved.</p>
            <p className="mt-1">
              {text({
                en: 'Multi-market vehicle sourcing, Auckland support, and overseas export capability.',
                zh: '多市场车源采购、奥克兰本地支持及海外出口能力。',
              })}
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 uppercase tracking-[0.16em] text-white/48">
            PEKEMA Registered Supplier 2026-2028
          </div>
        </div>
      </div>
    </footer>
  );
}
