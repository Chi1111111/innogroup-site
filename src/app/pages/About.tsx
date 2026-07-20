import { ArrowRight, BadgeCheck, CheckCircle2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { aboutAuctionYardImage, partnerAsnetImage, partnerNichiboImage, partnerPekemaImage, partnerUssImage } from '../../data/pic';
import { useLanguage } from '../components/SiteTranslator';

export function About() {
  const { text } = useLanguage();
  const approach = [
    { en: 'Understand the vehicle and budget you actually need', zh: '先了解你真正需要的车型和预算' },
    { en: 'Review condition and documents before commitment', zh: '确认购买前先检查车况和文件' },
    { en: 'Explain estimated landed cost clearly', zh: '清楚说明预计落地成本' },
    { en: 'Check the New Zealand compliance pathway', zh: '确认新西兰合规路径' },
    { en: 'Coordinate delivery and ongoing local support', zh: '协调交付并提供后续本地支持' },
  ];
  const credentials = [
    { name: 'PEKEMA', image: partnerPekemaImage },
    { name: 'USS Japan', image: partnerUssImage },
    { name: 'Nichibo', image: partnerNichiboImage },
    { name: 'ASNET', image: partnerAsnetImage },
  ];

  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-20 text-white sm:py-28"><div className="section-shell grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">About Inno Group</p><h1 className="mt-6 max-w-4xl text-white">{text({ en: 'Local support for buying vehicles overseas.', zh: '在海外找车，也能获得新西兰本地支持。' })}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">{text({ en: 'Inno Group is based in Auckland. We help New Zealand buyers understand the vehicle, condition, landed cost, compliance and delivery process before they commit.', zh: 'Inno Group 位于奥克兰。我们帮助新西兰买家在决定购买前，了解车辆、车况、落地成本、合规和交付流程。' })}</p><div className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white/65"><MapPin className="h-5 w-5 text-primary"/>Albany, Auckland, New Zealand</div></div><img src={aboutAuctionYardImage} alt="Inno Group vehicle sourcing in Japan" className="min-h-80 w-full rounded-[24px] object-cover"/></div></section>

      <section className="px-4 py-16 sm:py-24"><div className="section-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="section-kicker"><Search className="h-4 w-4"/>{text({ en: 'Our role', zh: '我们做什么' })}</p><h2 className="mt-5">{text({ en: 'Make the buying process easier to understand.', zh: '让买车过程更容易理解。' })}</h2></div><div className="grid gap-4 sm:grid-cols-2">{[{ title: { en: 'Vehicle sourcing', zh: '寻找车辆' }, text: { en: 'Japan auctions, dealer stock and selected overseas supply.', zh: '日本拍卖、车商库存和精选海外车源。' } }, { title: { en: 'Cost and condition review', zh: '成本与车况确认' }, text: { en: 'A clearer view of condition, documents and expected landed cost.', zh: '更清楚地了解车况、文件和预计落地成本。' } }, { title: { en: 'Compliance and delivery', zh: '合规与交付' }, text: { en: 'Coordination through shipping, compliance and New Zealand handover.', zh: '协调运输、合规和新西兰本地交付。' } }, { title: { en: 'Ownership support', zh: '车主支持' }, text: { en: 'Practical local referrals after the vehicle arrives.', zh: '车辆到达后提供实际的本地支持与推荐。' } }].map((item) => <article key={item.title.en} className="section-card p-6"><h3>{text(item.title)}</h3><p className="mt-3 leading-7">{text(item.text)}</p></article>)}</div></div></section>

      <section className="border-y border-black/7 bg-white/55 px-4 py-16 sm:py-24"><div className="section-shell"><div className="mb-10 max-w-3xl"><p className="section-kicker"><BadgeCheck className="h-4 w-4"/>{text({ en: 'Credentials and access', zh: '资质与渠道' })}</p><h2 className="mt-5">{text({ en: 'Established sourcing relationships.', zh: '成熟的车辆采购渠道。' })}</h2><p className="mt-4">{text({ en: 'These relationships help Inno search a broader range of vehicles. Every vehicle still requires its own condition, document and compliance review.', zh: '这些渠道帮助 Inno 搜索更广泛的车辆，但每辆车仍需单独确认车况、文件和合规要求。' })}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{credentials.map((item) => <div key={item.name} className="flex min-h-36 items-center justify-center rounded-xl border border-black/7 bg-white p-6"><img src={item.image} alt={item.name} className="max-h-20 max-w-full object-contain"/></div>)}</div></div></section>

      <section className="px-4 py-16 sm:py-24"><div className="section-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="section-kicker"><ShieldCheck className="h-4 w-4"/>{text({ en: 'Our approach', zh: '我们的工作方式' })}</p><h2 className="mt-5">{text({ en: 'Clear steps before commitment.', zh: '在确认购买前，把关键问题说明白。' })}</h2></div><div className="space-y-3">{approach.map((item, index) => <div key={item.en} className="flex items-center gap-4 rounded-xl border border-black/7 bg-white p-5"><span className="text-sm font-bold text-primary">0{index + 1}</span><CheckCircle2 className="h-5 w-5 flex-none text-primary"/><p className="font-semibold text-foreground">{text(item)}</p></div>)}</div></div></section>

      <section className="px-4 pb-20"><div className="section-shell flex flex-col gap-6 rounded-[24px] bg-[#101113] p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-12"><div><h2 className="text-white">{text({ en: 'Looking for a vehicle?', zh: '正在寻找车辆？' })}</h2><p className="mt-3 text-white/62">{text({ en: 'Tell us what you need and we will explain the next step.', zh: '告诉我们你的需求，我们会说明下一步。' })}</p></div><Link to="/vehicles/find-my-car" className="button-primary shrink-0">{text({ en: 'Find My Car', zh: '帮我找车' })}<ArrowRight className="h-5 w-5"/></Link></div></section>
    </div>
  );
}
