import { ArrowRight, Car, CheckCircle2, ClipboardCheck, Search, Ship } from 'lucide-react';
import { PriceCalculator } from '../components/PriceCalculator';
import { QuoteFormSection } from '../components/QuoteFormSection';
import { useLanguage } from '../components/SiteTranslator';

const vehicleTypes = [
  { en: 'Everyday Japanese vehicles', zh: '普通日系车' },
  { en: 'Hybrid and electric vehicles', zh: '混动与电动车' },
  { en: 'MPVs and SUVs', zh: 'MPV 与 SUV' },
  { en: 'Performance cars and JDM', zh: '性能车与 JDM' },
  { en: 'Luxury vehicles', zh: '豪华车型' },
  { en: 'Specific trim, colour or mileage', zh: '指定配置、颜色或公里数' },
];

export function FindMyCar() {
  const { text } = useLanguage();
  const steps = [
    { icon: ClipboardCheck, en: 'Tell us what you want', zh: '告诉我们你的需求' },
    { icon: Search, en: 'We search suitable channels', zh: '我们寻找合适车源' },
    { icon: Car, en: 'Confirm condition and cost', zh: '确认车况与落地价' },
    { icon: Ship, en: 'Import and deliver in New Zealand', zh: '进口并在新西兰交付' },
  ];

  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-20 text-white sm:py-28">
        <div className="section-shell max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Custom Vehicle Sourcing</p>
          <h1 className="mt-6 max-w-4xl text-white">{text({ en: 'Tell Us the Exact Car You Want.', zh: '告诉我们，你具体想要什么车。' })}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">{text({ en: 'Share the model, budget, specification and intended use. Inno will search suitable Japan channels and return with clear options.', zh: '告诉我们车型、预算、配置和用途，Inno 会从合适的日本渠道寻找车辆，并提供清晰的选择。' })}</p>
          <a href="#find-car-form" className="button-primary mt-8">{text({ en: 'Find My Car', zh: '开始找车' })}<ArrowRight className="h-5 w-5" /></a>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24"><div className="section-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="section-kicker">{text({ en: 'Your brief', zh: '你的找车需求' })}</p><h2 className="mt-5">{text({ en: 'The more specific, the better.', zh: '需求越具体，越容易找到合适车辆。' })}</h2></div><div className="grid gap-3 sm:grid-cols-2">{vehicleTypes.map((item) => <div key={item.en} className="flex items-center gap-3 rounded-xl border border-black/7 bg-white p-5"><CheckCircle2 className="h-5 w-5 flex-none text-primary"/><p className="font-semibold text-foreground">{text(item)}</p></div>)}</div></div></section>

      <section className="border-y border-black/6 bg-white/55 px-4 py-16"><div className="section-shell grid gap-4 md:grid-cols-4">{steps.map((step, index) => { const Icon = step.icon; return <div key={step.en} className="rounded-xl border border-black/7 bg-white p-6"><span className="text-sm font-bold text-primary">0{index + 1}</span><Icon className="mt-8 h-6 w-6"/><p className="mt-4 font-bold text-foreground">{text({ en: step.en, zh: step.zh })}</p></div>; })}</div></section>

      <PriceCalculator />
      <div id="find-car-form"><QuoteFormSection focusedImport /></div>
    </div>
  );
}
