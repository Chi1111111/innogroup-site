import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  heroGalleryImages,
  partnerAsnetImage,
  partnerNichiboImage,
  partnerPekemaImage,
  partnerUssImage,
} from '../../data/pic';
import { BrandLogo } from './BrandLogo';
import { useLanguage } from './SiteTranslator';

const heroHighlights = [
  { en: 'Japan, China, Macau and selected overseas markets', zh: '日本、中国、澳门及其他精选海外市场' },
  { en: 'Sourcing, shipping and local handover support', zh: '车源寻找、运输协调与本地交付支持' },
  { en: 'Private buyers, dealers and business partners', zh: '服务个人客户、车商及商业合作伙伴' },
];

const heroStats = [
  {
    label: { en: 'Vehicle choice', zh: '车辆选择' },
    value: { en: 'Multi-Market', zh: '多市场' },
    note: { en: 'Access vehicle options across trusted overseas and local channels', zh: '通过可信海外及本地渠道获取更多车型选择' },
  },
  {
    label: { en: 'Supply channels', zh: '供应渠道' },
    value: { en: 'Beyond Japan', zh: '不止日本' },
    note: { en: 'Japanese auctions, Chinese suppliers, Macau opportunities and more', zh: '覆盖日本拍卖、中国供应商、澳门市场机会等' },
  },
  {
    label: { en: 'NZ support', zh: '新西兰支持' },
    value: { en: 'Local Delivery', zh: '本地交付' },
    note: { en: 'Clear communication from sourcing brief to handover support', zh: '从找车需求到交付支持，全程清晰沟通' },
  },
];

const supplierBadges = [
  { name: 'PEKEMA', image: partnerPekemaImage },
  { name: 'USS Japan', image: partnerUssImage },
  { name: 'Nichibo', image: partnerNichiboImage },
  { name: 'ASNET', image: partnerAsnetImage },
];

export function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const { text } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroGalleryImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#090909] px-4 pb-14 pt-20 text-white sm:pb-20 sm:pt-28 md:pb-24">
      <div className="absolute inset-0">
        {heroGalleryImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1500 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Luxury vehicle collection ${index + 1}`}
              className="h-full w-full scale-105 object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/58 to-black/78" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/62 via-transparent to-black/86" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,162,74,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(199,162,74,0.12),transparent_30%)]" />
      </div>

      <div className="section-shell relative z-10">
        <div className="grid gap-7 sm:gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-12">
          <div className="max-w-3xl">
            <div className="mb-5 animate-slideUp sm:mb-8" style={{ animationDelay: '0.05s' }}>
              <BrandLogo variant="hero" className="max-w-[220px] sm:max-w-fit" />
            </div>

            <div
              className="mb-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 py-2 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-white/76 animate-slideUp sm:mb-6 sm:gap-3 sm:px-5 sm:text-xs sm:tracking-[0.24em]"
              style={{ animationDelay: '0.12s' }}
            >
              <span className="h-2 w-2 rounded-full bg-primary" />
              {text({ en: 'Auckland Based', zh: '奥克兰本地' })}
              <span className="text-white/35">|</span>
              {text({ en: 'Global Vehicle Sourcing', zh: '全球车源采购' })}
            </div>

            <h1
              className="animate-slideUp text-[2.55rem] leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.75rem]"
              style={{ animationDelay: '0.2s' }}
            >
              {text({ en: 'Global vehicle', zh: '全球车源' })} <span className="text-primary">{text({ en: 'sourcing', zh: '采购' })}</span>.
              <br />
              {text({ en: 'Delivered locally in New Zealand.', zh: '新西兰本地交付。' })}
            </h1>

            <p
              className="mt-4 max-w-2xl animate-slideUp text-[0.98rem] leading-7 text-white/72 sm:mt-6 md:text-xl md:leading-8"
              style={{ animationDelay: '0.3s' }}
            >
              {text({
                en: 'Inno Group connects New Zealand customers, dealers and partners with trusted vehicle sources from Japan, China, Macau and selected overseas markets.',
                zh: 'Inno Group 连接新西兰客户、车商和合作伙伴，对接日本、中国、澳门及其他海外优质车源。',
              })}
            </p>

            <div
              className="mt-6 flex flex-wrap gap-2 animate-slideUp sm:mt-8 sm:gap-3"
              style={{ animationDelay: '0.4s' }}
            >
              {heroHighlights.map((item) => (
                <span
                  key={text(item)}
                  className="rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-[11px] leading-5 text-white/74 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
                >
                  {text(item)}
                </span>
              ))}
            </div>

            <div
              className="mt-8 flex flex-col gap-3 animate-slideUp sm:mt-10 sm:flex-row sm:gap-4"
              style={{ animationDelay: '0.5s' }}
            >
              <a href="/vehicles/china" className="button-primary w-full sm:w-auto">
                {text({ en: 'Browse China Vehicles', zh: '浏览中国车型' })}
                <ArrowRight className="h-5 w-5" />
              </a>

              <a href="#quote" className="button-secondary-dark w-full sm:w-auto">
                {text({ en: 'Source a Vehicle', zh: '寻找车辆' })}
                <ArrowRight className="h-5 w-5" />
              </a>

              <a href="#partners" className="button-secondary-dark w-full sm:w-auto">
                {text({ en: 'Partner With Us', zh: '合作洽谈' })}
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div
            className="section-card-dark animate-slideUp p-5 sm:p-8 md:p-10"
            style={{ animationDelay: '0.45s' }}
          >
            <div className="mb-4 flex items-center gap-2 sm:mb-5 sm:gap-3">
              {supplierBadges.map((supplier) => (
                <div
                  key={supplier.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-white p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.3)] sm:h-12 sm:w-12"
                  title={supplier.name}
                >
                  <img
                    src={supplier.image}
                    alt={supplier.name}
                    className="h-full w-full rounded-full object-contain"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
                  {text({ en: 'Why Clients Start Here', zh: '客户为什么从这里开始' })}
                </p>
                <p className="mt-2 text-sm text-white/62">
                  {text({ en: 'A multi-market sourcing network built for New Zealand.', zh: '为新西兰打造的多市场车源网络。' })}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                {heroGalleryImages.map((image, index) => (
                  <span
                    key={image}
                    className={`h-1.5 w-6 rounded-full transition-colors sm:w-9 ${
                      index === currentImage ? 'bg-primary' : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[22px] border border-white/8 bg-black/18 p-4 sm:rounded-[24px] sm:p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                    {text(stat.label)}
                  </p>
                  <p className="mt-2 text-[1.7rem] font-semibold text-white sm:text-3xl">{text(stat.value)}</p>
                  <p className="mt-2 text-sm leading-6 text-white/62 sm:leading-7">{text(stat.note)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-primary/18 bg-primary/10 p-4 sm:mt-8 sm:rounded-[26px] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/82">
                {text({ en: 'Typical Brief', zh: '典型需求' })}
              </p>
              <p className="mt-3 text-base leading-7 text-white/86 sm:text-lg sm:leading-8">
                {text({
                  en: '"Find the right model, confirm the channel, understand the landed position, and deliver with local support."',
                  zh: '“找到合适车型，确认车源渠道，算清落地成本，并提供本地交付支持。”',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
