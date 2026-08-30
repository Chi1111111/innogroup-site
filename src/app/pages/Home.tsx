import {
  ArrowRight,
  BatteryCharging,
  Car,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Globe2,
  MapPin,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  Ship,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router';
import { Hero } from '../components/Hero';
import { JapanMarketPreview } from '../components/JapanMarketPreview';
import { PriceCalculator } from '../components/PriceCalculator';
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
    text: { en: 'A selective supplementary channel focused on EVs, MPVs and commercial opportunities.', zh: '精选补充渠道，重点关注 EV、MPV 及商用车型机会。' },
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

const startPaths = [
  {
    number: '01',
    to: '/japan-market',
    icon: Car,
    title: { en: 'Browse Japan Market', zh: '浏览日本市场' },
    text: { en: 'Search thousands of vehicles with estimated New Zealand landed pricing.', zh: '浏览数万台日本车辆，并查看新西兰预计落地价。' },
    action: { en: 'Explore vehicles', zh: '开始浏览' },
  },
  {
    number: '02',
    to: '/weekly-report',
    icon: Sparkles,
    title: { en: 'See This Week’s Picks', zh: '查看本周精选' },
    text: { en: 'A short, manually reviewed list for buyers who want guidance first.', zh: '人工筛选的简明周报，适合希望先获得建议的客户。' },
    action: { en: 'Open weekly report', zh: '打开本周周报' },
  },
  {
    number: '03',
    to: '/vehicles/find-my-car',
    icon: MessageSquareText,
    title: { en: 'Ask Inno to Find It', zh: '请 Inno 帮我找车' },
    text: { en: 'Share your target model, budget and must-haves. We will search for you.', zh: '告诉我们目标车型、预算和必备配置，由我们帮你寻找。' },
    action: { en: 'Send your brief', zh: '提交找车需求' },
  },
  {
    number: '04',
    to: '/vehicles/china#available-models',
    icon: BatteryCharging,
    title: { en: 'Explore Cars from China', zh: '查看中国车型' },
    text: { en: 'Review selected EVs, MPVs, SUVs and commercial models available to enquire about.', zh: '查看可咨询的精选 EV、MPV、SUV 及商用车型。' },
    action: { en: 'View China models', zh: '查看中国车型' },
  },
];

const importPoints = [
  { en: 'Vehicle sourcing and inspection support', zh: '车源寻找与车况判断支持' },
  { en: 'Transparent landed cost estimation', zh: '清晰透明的落地价预估' },
  { en: 'Shipping, compliance and delivery coordination', zh: '海运、合规与本地交付协调' },
];

const chinaPoints = [
  { en: 'MPVs, SUVs, EVs and commercial models', zh: 'MPV、SUV、EV 及商用车型' },
  { en: 'Selected manufacturer and supplier channels', zh: '精选主机厂与供应商渠道' },
  { en: 'Warranty support where applicable', zh: '符合条件车型可提供质保支持' },
];

const buyerAssurances = [
  {
    title: { en: 'Availability Reconfirmed', zh: '再次确认实际库存' },
    icon: Clock3,
    text: { en: 'The source listing is checked again before you make any commitment.', zh: '在你作出任何购买承诺前，我们会再次核实车源是否仍然有效。' },
  },
  {
    title: { en: 'Condition and Documents', zh: '确认车况与文件' },
    icon: FileCheck2,
    text: { en: 'Available condition information and key documents are reviewed before purchase.', zh: '购买前会核对可用车况信息与关键车辆文件。' },
  },
  {
    title: { en: 'Itemised Cost Estimate', zh: '费用明细清楚可见' },
    icon: ReceiptText,
    text: { en: 'Vehicle, shipping, compliance and service allowances are explained before a final quote.', zh: '正式报价前，先说明车辆、运输、合规与服务费用预估。' },
  },
  {
    title: { en: 'Local Support', zh: '新西兰本地支持' },
    icon: ShieldCheck,
    text: { en: 'Auckland-based support continues through compliance, handover and ownership questions.', zh: '奥克兰本地团队持续协助合规、交付和用车问题。' },
  },
];

export function Home() {
  const { text } = useLanguage();

  return (
    <>
      <Hero />

      <section id="start-here" className="scroll-mt-24 border-b border-black/8 px-4 py-16 sm:py-20">
        <div className="section-shell">
          <div className="grid gap-8 border-b border-black/8 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="section-kicker">01 · {text({ en: 'Start here', zh: '从这里开始' })}</div>
              <h2 className="mt-5 max-w-xl">{text({ en: 'Four clear ways to find your next car.', zh: '四种清晰方式，找到下一辆车。' })}</h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-foreground/62 lg:justify-self-end lg:text-right">
              {text({
                en: 'You do not need to understand auctions or importing before you begin. Choose the starting point that matches how much you already know.',
                zh: '开始之前，你不需要先弄懂拍卖和进口流程。只要根据自己目前掌握的信息，选择合适的入口。',
              })}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {startPaths.map((path) => {
              const Icon = path.icon;

              return (
                <Link key={path.to} to={path.to} className="group section-card flex min-h-[270px] flex-col p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold tracking-[0.18em] text-primary">{path.number}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-background text-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-auto pt-12">
                    <h3 className="text-2xl">{text(path.title)}</h3>
                    <p className="mt-3 text-sm leading-7">{text(path.text)}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground">
                      {text(path.action)}
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <JapanMarketPreview />

      <section className="bg-white/45 px-4 py-16 sm:py-20">
        <div className="section-shell">
          <div className="mb-10 max-w-3xl space-y-4">
            <div className="section-kicker">
              <Globe2 className="h-4 w-4" />
              02 · {text({ en: 'Source Markets', zh: '车源市场' })}
            </div>
            <h2>{text({ en: 'Import Sourcing Across Trusted Overseas Channels.', zh: '通过可信海外渠道寻找进口车源。' })}</h2>
            <p className="text-lg leading-8 text-foreground/70">
              {text({
                en: 'Inno Group works across Japanese dealer stock and auctions, selected Chinese manufacturers and suppliers, Macau market opportunities, and other overseas sourcing networks. We match the channel to the vehicle, budget and intended use.',
                zh: 'Inno Group 覆盖日本车商库存与拍卖资源、精选中国主机厂及供应商、澳门市场机会，以及其他海外车源网络。我们会根据车型、预算和用途匹配合适渠道。',
              })}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {sourceMarkets.map((market) => {
              const Icon = market.icon;

              return (
                <article key={text(market.title)} className="section-card p-6">
                  <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl bg-[#151515] text-primary">
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

      <section className="px-4 py-10 sm:py-14">
        <div className="section-shell grid items-stretch gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="section-card flex min-h-[320px] flex-col justify-between p-7 sm:p-9 lg:p-10">
            <div className="space-y-5">
              <div className="section-kicker">
                <Ship className="h-4 w-4" />
                {text({ en: 'Import Sourcing', zh: '进口车源服务' })}
              </div>
              <div className="space-y-3">
                <h2>{text({ en: 'Import Sourcing, Matched to the Right Channel', zh: '进口车源，根据需求匹配渠道' })}</h2>
                <p className="max-w-xl text-lg leading-8 text-foreground/70">
                  {text({
                    en: 'We help customers source quality vehicles through suitable overseas channels with transparent pricing, selection support, shipping coordination and local delivery assistance.',
                    zh: '我们帮助客户通过合适的海外渠道寻找优质车辆，并提供透明报价、选车支持、运输协调和新西兰本地交付协助。',
                  })}
                </p>
              </div>
              <div className="space-y-3 border-t border-black/6 pt-5">
                {importPoints.map((point) => (
                  <div key={text(point)} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-primary" />
                    <p className="text-sm font-semibold leading-7 text-foreground/76">{text(point)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Link to="/vehicles/find-my-car" className="button-secondary">
                {text({ en: 'Request a Vehicle Search', zh: '提交找车需求' })}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </article>

          <article className="flex min-h-[320px] flex-col justify-between rounded-[30px] border border-black/6 bg-[#111214] p-6 text-white shadow-[0_30px_100px_rgba(17,17,17,0.18)] sm:p-7 lg:p-8">
            <div className="space-y-4">
              <div className="section-kicker border-white/12 bg-white/8 text-primary">
                <BatteryCharging className="h-4 w-4" />
                {text({ en: 'Selective China Channel', zh: '精选中国渠道' })}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl text-white sm:text-3xl">{text({ en: 'China Vehicles, Selective Supply', zh: '中国车源，精选补充' })}</h2>
                <p className="max-w-xl text-sm leading-7 text-white/68">
                  {text({
                    en: 'A focused option for selected EV, MPV, SUV and commercial models when they suit the brief.',
                    zh: '作为补充选择，适合有明确需求的 EV、MPV、SUV 及商用车型。',
                  })}
                </p>
              </div>
              <div className="space-y-2 border-t border-white/10 pt-4">
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

      <div id="calculator">
        <PriceCalculator />
      </div>

      <section id="partners" className="px-4 py-16 sm:py-20">
        <div className="section-shell">
          <div className="mb-10 max-w-3xl space-y-4">
            <div className="section-kicker">
              <ShieldCheck className="h-4 w-4" />
              {text({ en: 'Before You Commit', zh: '确认购买之前' })}
            </div>
            <h2>{text({ en: 'Know what is checked before you move forward.', zh: '先把关键问题确认清楚，再决定下一步。' })}</h2>
            <p className="text-lg leading-8 text-foreground/70">
              {text({
                en: 'An enquiry is not a purchase commitment. We explain availability, condition, expected costs and the New Zealand delivery path before you decide.',
                zh: '提交咨询不等于承诺购买。我们会先说明库存、车况、预计费用和新西兰交付流程，再由你决定。',
              })}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {buyerAssurances.map((assurance) => {
              const Icon = assurance.icon;

              return (
                <article key={text(assurance.title)} className="section-card p-6">
                  <Icon className="mb-5 h-7 w-7 text-primary" />
                  <h3>{text(assurance.title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{text(assurance.text)}</p>
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
