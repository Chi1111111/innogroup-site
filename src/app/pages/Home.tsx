import {
  ArrowRight,
  BatteryCharging,
  Building2,
  Car,
  CheckCircle2,
  Factory,
  Globe2,
  MapPin,
  Ship,
  Users,
} from 'lucide-react';
import { Link } from 'react-router';
import { Hero } from '../components/Hero';
import { QuoteFormSection } from '../components/QuoteFormSection';
import { useLanguage } from '../components/SiteTranslator';

const sourceMarkets = [
  {
    title: { en: 'Japan', zh: '日本' },
    icon: Car,
    text: { en: 'Quality used vehicles, auction access, dealer stock and export support.', zh: '优质二手车、拍卖资源、车商库存及出口支持。' },
  },
  {
    title: { en: 'China', zh: '中国' },
    icon: BatteryCharging,
    text: { en: 'Factory-backed new vehicles, EVs, MPVs, SUVs and commercial models with manufacturer warranty support.', zh: '厂家支持的新车资源，覆盖 EV、MPV、SUV 和商用车型，部分车型可提供厂家质保支持。' },
  },
  {
    title: { en: 'Macau', zh: '澳门' },
    icon: MapPin,
    text: { en: 'Selected Macau supply and regional sourcing opportunities for trade and sourcing partners.', zh: '面向车商和采购合作方的澳门及区域市场车源机会。' },
  },
  {
    title: { en: 'Other Markets', zh: '其他市场' },
    icon: Globe2,
    text: { en: 'We continue to explore supply channels from other right-hand-drive friendly overseas markets.', zh: '我们持续拓展其他适合右舵市场的海外车源渠道。' },
  },
];

const japanPoints = [
  { en: 'Vehicle sourcing and inspection support', zh: '车源寻找与车况判断支持' },
  { en: 'Transparent landed cost estimation', zh: '清晰透明的落地价预估' },
  { en: 'Shipping, compliance and delivery coordination', zh: '海运、合规与本地交付协调' },
];

const chinaPoints = [
  { en: 'MPVs, SUVs, EVs and commercial models', zh: 'MPV、SUV、EV 及商用车型' },
  { en: 'Selected manufacturer and supplier channels', zh: '精选主机厂与供应商渠道' },
  { en: 'Warranty support where applicable', zh: '符合条件车型可提供质保支持' },
];

const partnerAudiences = [
  {
    title: { en: 'For Customers', zh: '面向客户' },
    icon: Users,
    text: { en: 'Find the right vehicle with clear pricing and local support.', zh: '用清晰价格和本地支持，帮你找到合适车辆。' },
  },
  {
    title: { en: 'For Dealers', zh: '面向车商' },
    icon: Building2,
    text: { en: 'Access overseas vehicle sources and wholesale opportunities.', zh: '对接海外车源与批发合作机会。' },
  },
  {
    title: { en: 'For Manufacturers', zh: '面向厂家' },
    icon: Factory,
    text: { en: 'Explore New Zealand market entry and local distribution support.', zh: '探索进入新西兰市场及本地分销支持。' },
  },
];

export function Home() {
  const { text } = useLanguage();

  return (
    <>
      <Hero />

      <section className="px-4 py-16 sm:py-20">
        <div className="section-shell">
          <div className="mb-10 max-w-3xl space-y-4">
            <div className="section-kicker">
              <Globe2 className="h-4 w-4" />
              {text({ en: 'Source Markets', zh: '车源市场' })}
            </div>
            <h2>{text({ en: 'Multiple Sourcing Channels. One Trusted Partner.', zh: '多渠道车源，一个可信赖的合作伙伴。' })}</h2>
            <p className="text-lg leading-8 text-foreground/70">
              {text({
                en: 'Inno Group is not limited to a single vehicle source. We work across Japanese dealer stock and auctions, selected Chinese manufacturers and suppliers, Macau market opportunities, and other overseas sourcing networks.',
                zh: 'Inno Group 不局限于单一车源。我们覆盖日本车商库存与拍卖资源、中国优质主机厂及供应商、澳门市场机会，以及其他海外车源网络。',
              })}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {sourceMarkets.map((market) => {
              const Icon = market.icon;

              return (
                <article key={text(market.title)} className="section-card p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151515] text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3>{text(market.title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{text(market.text)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16">
        <div className="section-shell grid items-stretch gap-6 lg:grid-cols-2">
          <article className="section-card flex min-h-[360px] flex-col justify-between p-7 sm:p-9 lg:p-10">
            <div className="space-y-5">
              <div className="section-kicker">
                <Ship className="h-4 w-4" />
                {text({ en: 'Japan Direct Import', zh: '日本直采进口' })}
              </div>
              <div className="space-y-3">
                <h2>{text({ en: 'Japan Direct Import', zh: '日本直采进口' })}</h2>
                <p className="max-w-xl text-lg leading-8 text-foreground/70">
                  {text({
                    en: 'We help customers source quality vehicles directly from Japan with transparent pricing, selection support, shipping coordination and local delivery assistance.',
                    zh: '我们帮助客户直接从日本寻找优质车辆，并提供透明报价、选车支持、运输协调和新西兰本地交付协助。',
                  })}
                </p>
              </div>
              <div className="space-y-3 border-t border-black/6 pt-5">
                {japanPoints.map((point) => (
                  <div key={text(point)} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-primary" />
                    <p className="text-sm font-semibold leading-7 text-foreground/76">{text(point)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Link to="/jpauc-feed" className="button-secondary">
                {text({ en: 'Explore Japan Stock', zh: '查看日本车源' })}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </article>

          <article className="flex min-h-[360px] flex-col justify-between rounded-[30px] border border-black/6 bg-[#111214] p-7 text-white shadow-[0_30px_100px_rgba(17,17,17,0.18)] sm:p-9 lg:p-10">
            <div className="space-y-5">
              <div className="section-kicker border-white/12 bg-white/8 text-primary">
                <BatteryCharging className="h-4 w-4" />
                {text({ en: 'Cars from China', zh: '中国车源' })}
              </div>
              <div className="space-y-3">
                <h2 className="text-white">{text({ en: 'Cars from China', zh: '中国车源' })}</h2>
                <p className="max-w-xl text-lg leading-8 text-white/68">
                  {text({
                    en: 'Access factory-backed vehicles from selected Chinese manufacturers and suppliers, with local New Zealand support from sourcing enquiry through handover.',
                    zh: '通过精选中国主机厂及供应商渠道获取厂家支持车型，并由 Inno Group 提供从咨询到交付的新西兰本地支持。',
                  })}
                </p>
              </div>
              <div className="space-y-3 border-t border-white/10 pt-5">
                {chinaPoints.map((point) => (
                  <div key={text(point)} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-primary" />
                    <p className="text-sm font-semibold leading-7 text-white/72">{text(point)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Link to="/vehicles/china" className="button-primary">
                {text({ en: 'Explore China Vehicles', zh: '查看中国车型' })}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="partners" className="px-4 py-16 sm:py-20">
        <div className="section-shell">
          <div className="mb-10 max-w-3xl space-y-4">
            <div className="section-kicker">
              <Users className="h-4 w-4" />
              {text({ en: 'Partner With Us', zh: '合作机会' })}
            </div>
            <h2>{text({ en: 'For Customers, Dealers and Manufacturers', zh: '面向客户、车商和厂家' })}</h2>
            <p className="text-lg leading-8 text-foreground/70">
              {text({
                en: 'A multi-market vehicle sourcing network built for New Zealand buyers and business partners.',
                zh: '为新西兰买家和商业合作伙伴打造的多市场车源网络。',
              })}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {partnerAudiences.map((audience) => {
              const Icon = audience.icon;

              return (
                <article key={text(audience.title)} className="section-card p-6">
                  <Icon className="mb-5 h-7 w-7 text-primary" />
                  <h3>{text(audience.title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{text(audience.text)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div id="quote">
        <QuoteFormSection />
      </div>
    </>
  );
}
