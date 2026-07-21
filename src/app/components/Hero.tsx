import { useEffect, useState } from 'react';
import { ArrowRight, MapPin, MessageSquareText, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import {
  heroGalleryImages,
  partnerAsnetImage,
  partnerNichiboImage,
  partnerPekemaImage,
  partnerUssImage,
} from '../../data/pic';
import { useLanguage } from './SiteTranslator';

const supplierBadges = [
  { name: 'PEKEMA', image: partnerPekemaImage },
  { name: 'USS Japan', image: partnerUssImage },
  { name: 'Nichibo', image: partnerNichiboImage },
  { name: 'ASNET', image: partnerAsnetImage },
];

const startingPoints = [
  {
    to: '/vehicles/japan-live-stock',
    icon: Search,
    number: '01',
    title: { en: 'I know what I want', zh: '我知道想要什么车' },
    note: { en: 'Search Japan live stock', zh: '搜索日本实时车源' },
  },
  {
    to: '/weekly-report',
    icon: Sparkles,
    number: '02',
    title: { en: 'Show me good options', zh: '先看看本周好车' },
    note: { en: 'View this week’s selected vehicles', zh: '查看本周人工精选车辆' },
  },
  {
    to: '/vehicles/find-my-car',
    icon: MessageSquareText,
    number: '03',
    title: { en: 'Help me find a car', zh: '请 Inno 帮我找车' },
    note: { en: 'Tell us your model and budget', zh: '告诉我们车型和预算' },
  },
];

export function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const { text } = useLanguage();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentImage((previous) => (previous + 1) % heroGalleryImages.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative isolate min-h-[760px] overflow-hidden bg-[#101113] px-4 pb-12 pt-28 text-white sm:pt-32 lg:flex lg:min-h-[780px] lg:items-center lg:pb-16 lg:pt-36">
      <div className="absolute inset-0 -z-20">
        {heroGalleryImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,11,13,0.97)_0%,rgba(10,11,13,0.83)_48%,rgba(10,11,13,0.42)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,11,13,0.35)_0%,rgba(10,11,13,0.12)_48%,rgba(10,11,13,0.93)_100%)]" />
      <div className="absolute -right-32 top-10 -z-10 h-[520px] w-[520px] rounded-full bg-primary/16 blur-[140px]" />

      <div className="section-shell w-full">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.72fr] lg:items-end lg:gap-16">
          <div className="max-w-4xl animate-slideUp">
            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs sm:tracking-[0.25em]">
              <span className="h-px w-8 bg-primary" />
              <MapPin className="h-4 w-4" />
              {text({ en: 'Auckland-based vehicle sourcing', zh: '奥克兰本地车辆采购服务' })}
            </div>

            <h1 className="mt-7 max-w-4xl font-sans text-[3.25rem] font-semibold leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              {text({ en: 'The right car.', zh: '找到对的车，' })}
              <span className="mt-1 block text-primary">
                {text({ en: 'A clearer way to import.', zh: '进口更简单。' })}
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              {text({
                en: 'Search live Japan stock, review our weekly shortlist, or tell us the exact vehicle you want. Inno coordinates the process through to New Zealand delivery.',
                zh: '你可以搜索日本实时车源、查看每周精选，或直接告诉我们想要的车型。Inno 从找车到新西兰交付全程协助。',
              })}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#start-here" className="button-primary w-full sm:w-auto">
                {text({ en: 'Choose How to Start', zh: '选择找车方式' })}
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link to="/weekly-report" className="button-secondary-dark w-full sm:w-auto">
                {text({ en: 'View Weekly Finds', zh: '查看每周精选' })}
              </Link>
            </div>
          </div>

          <aside className="overflow-hidden rounded-2xl border border-white/12 bg-black/38 shadow-[0_28px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                {text({ en: 'Start with what you know', zh: '从你现在的需求开始' })}
              </p>
            </div>
            <div>
              {startingPoints.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/10 px-5 py-5 last:border-b-0 hover:bg-white/[0.06] sm:px-6"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{text(item.title)}</span>
                      <span className="mt-1 block text-xs leading-5 text-white/48">{text(item.note)}</span>
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] text-white/32">
                      {item.number}
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/38">
              {text({ en: 'Connected sourcing network', zh: '合作车源网络' })}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {supplierBadges.map((supplier) => (
                <span key={supplier.name} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white p-1.5" title={supplier.name}>
                  <img src={supplier.image} alt={supplier.name} className="h-full w-full rounded-full object-contain" />
                </span>
              ))}
            </div>
          </div>
          <p className="max-w-lg text-sm leading-6 text-white/48 sm:text-right">
            {text({
              en: 'Japan auctions and dealer stock · selected China supply · shipping, compliance and local handover support',
              zh: '日本拍卖与车商库存 · 精选中国车源 · 海运、合规及本地交付支持',
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
