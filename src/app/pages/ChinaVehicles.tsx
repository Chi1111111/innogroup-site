import {
  ArrowRight,
  BatteryCharging,
  Building2,
  Car,
  CheckCircle2,
  Factory,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router';
import { chinaVehicles } from '../../data/chinaVehicles';
import { useLanguage } from '../components/SiteTranslator';

const vehicleReasons = [
  { en: 'Competitive pricing', zh: '价格具有竞争力' },
  { en: 'Modern design and technology', zh: '设计和科技配置更现代' },
  { en: 'EV, hybrid, MPV and SUV options', zh: '覆盖 EV、混动、MPV 和 SUV' },
  { en: 'Manufacturer warranty support where applicable', zh: '符合条件车型可提供厂家质保支持' },
  { en: 'Growing global recognition', zh: '全球市场认可度持续提升' },
];

const categories = [
  {
    title: { en: 'MPVs', zh: 'MPV' },
    icon: Users,
    text: { en: 'Spacious, practical and suitable for family, business and passenger transport use.', zh: '空间充裕、实用性强，适合家庭、商务和乘客运输用途。' },
  },
  {
    title: { en: 'SUVs', zh: 'SUV' },
    icon: Car,
    text: { en: 'Modern design, strong value and practical daily usability.', zh: '设计现代、性价比突出，适合日常使用。' },
  },
  {
    title: { en: 'EVs & Hybrids', zh: 'EV 与混动车型' },
    icon: BatteryCharging,
    text: { en: 'Efficient new energy options with advanced technology features.', zh: '高效新能源选择，配备先进科技功能。' },
  },
  {
    title: { en: 'Commercial Vehicles', zh: '商用车型' },
    icon: Truck,
    text: { en: 'Flexible options for business, fleet and trade use.', zh: '适合企业、车队和贸易用途的灵活车型。' },
  },
];

const businessNotes = [
  {
    title: { en: 'Manufacturer Warranty Support', zh: '厂家质保支持' },
    icon: ShieldCheck,
    text: { en: 'Selected vehicles may come with factory-backed warranty support, such as up to 5 years or 150,000 km depending on the model, manufacturer and market arrangement.', zh: '部分车型可享受厂家质保支持，例如根据车型、厂家和市场安排，最高可达 5 年或 150,000 公里。' },
  },
  {
    title: { en: 'Trusted Supply Relationships', zh: '可信供应关系' },
    icon: Factory,
    text: { en: 'We work with selected Chinese manufacturers, authorised suppliers and export partners to access vehicles with clear sourcing, documentation and support.', zh: '我们与精选中国主机厂、授权供应商及出口合作方合作，获取来源清晰、文件完整并具备支持体系的车辆资源。' },
  },
  {
    title: { en: 'New Models Updated Regularly', zh: '车型持续更新' },
    icon: RefreshCw,
    text: { en: 'Our China vehicle range will continue to expand as new models, specifications and market-ready options become available.', zh: '随着更多适合新西兰及海外市场的车型、配置和供应方案开放，中国车源范围将持续扩展。' },
  },
];

const buyerGroups = [
  {
    title: { en: 'For Private Buyers', zh: '面向个人买家' },
    icon: Users,
    text: { en: 'Explore new vehicle options with strong value, modern features and local support.', zh: '了解具备高价值、现代配置和本地支持的新车选择。' },
  },
  {
    title: { en: 'For Dealers and Partners', zh: '面向车商与合作伙伴' },
    icon: Building2,
    text: { en: 'Work with Inno Group to access Chinese vehicle supply channels and overseas market opportunities.', zh: '与 Inno Group 合作，对接中国车源渠道和海外市场机会。' },
  },
];

export function ChinaVehicles() {
  const { text } = useLanguage();
  const formatPrice = (priceFrom: string) =>
    priceFrom.toLowerCase().startsWith('from ') ? priceFrom : `From ${priceFrom}`;

  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-16 text-white sm:py-24">
        <div className="section-shell grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-4xl space-y-6 animate-slideUp">
            <div className="section-kicker border-white/12 bg-white/8">
              <BatteryCharging className="h-4 w-4" />
              {text({ en: 'Cars from China', zh: '中国车源' })}
            </div>
            <h1 className="text-white">{text({ en: 'Cars from China', zh: '中国车源' })}</h1>
            <p className="max-w-3xl text-lg leading-8 text-white/70">
              {text({
                en: 'Factory-backed Chinese vehicles, sourced through trusted manufacturer and supplier relationships, delivered with local New Zealand support.',
                zh: '通过可信赖的主机厂及供应商合作渠道引入厂家支持车型，并由 Inno Group 提供新西兰本地支持。',
              })}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#available-models" className="button-primary">
                {text({ en: 'View Available Models', zh: '查看现有车型' })}
                <ArrowRight className="h-5 w-5" />
              </a>
              <a href="#business-partners" className="button-secondary-dark">
                {text({ en: 'Become a Partner', zh: '成为合作伙伴' })}
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
            {vehicleReasons.map((reason) => (
              <div key={text(reason)} className="flex gap-3 rounded-[20px] bg-black/18 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" />
                <p className="text-sm font-semibold leading-6 text-white/74">{text(reason)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-18">
        <div className="section-shell grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <div className="section-kicker">
              <Sparkles className="h-4 w-4" />
              {text({ en: 'Why Chinese Vehicles?', zh: '为什么关注中国车？' })}
            </div>
            <h2>{text({ en: 'Why Chinese Vehicles?', zh: '为什么关注中国车？' })}</h2>
            <p className="text-lg leading-8 text-foreground/70">
              {text({
                en: "China has become one of the world's most active automotive markets, especially in EVs, MPVs, SUVs and intelligent vehicle technology. Inno Group works with selected Chinese manufacturers and suppliers to introduce high-value models to New Zealand and overseas markets.",
                zh: '中国已经成为全球最活跃的汽车市场之一，尤其在 EV、MPV、SUV 和智能汽车技术方面发展迅速。Inno Group 与精选中国主机厂和供应商合作，将高价值车型引入新西兰及海外市场。',
              })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {businessNotes.map((note) => {
              const Icon = note.icon;

              return (
                <article key={text(note.title)} className="section-card p-6">
                  <Icon className="mb-4 h-7 w-7 text-primary" />
                  <h3 className="text-lg">{text(note.title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{text(note.text)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-18">
        <div className="section-shell">
          <div className="mb-8 max-w-3xl space-y-4">
            <div className="section-kicker">
              <Car className="h-4 w-4" />
              {text({ en: 'Categories', zh: '车型分类' })}
            </div>
            <h2>{text({ en: 'Vehicle Categories We Source', zh: '我们可采购的车型类别' })}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <article key={text(category.title)} className="section-card p-6">
                  <Icon className="mb-5 h-7 w-7 text-primary" />
                  <h3>{text(category.title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{text(category.text)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="available-models" className="px-4 py-14 sm:py-18">
        <div className="section-shell">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-5 animate-slideUp">
              <div className="section-kicker">
                <BatteryCharging className="h-4 w-4" />
                {text({ en: 'Available Models', zh: '现有车型' })}
              </div>
              <h2>{text({ en: 'Current China Vehicle Range', zh: '当前中国车源车型' })}</h2>
              <p className="max-w-3xl text-lg leading-8 text-foreground/72">
                {text({
                  en: 'Choose a model, review configurations, then request a final quote and compliance check before order.',
                  zh: '选择车型、查看配置，并在下单前申请最终报价与合规确认。',
                })}
              </p>
            </div>
            <p className="max-w-md text-sm font-semibold leading-7 text-foreground/62">
              {text({
                en: 'Final specification, RHD availability, compliance pathway, warranty terms, charging compatibility, parts supply and landed pricing are confirmed before order.',
                zh: '最终配置、右舵供应、合规路径、质保条款、充电兼容性、配件供应和落地价格，都会在下单前确认。',
              })}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {chinaVehicles.map((vehicle) => (
              <Link
                key={vehicle.slug}
                to={vehicle.href}
                className="group animate-scaleIn overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-[0_30px_90px_rgba(17,17,17,0.12)]"
              >
                <div className="bg-gradient-to-br from-white to-[#ebe7df] p-5">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.name} available through Cars from China`}
                    className="aspect-[16/10] w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="space-y-4 p-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      {text({ en: formatPrice(vehicle.priceFrom), zh: `${vehicle.priceFrom.replace(/^From /, '')} 起` })}
                    </p>
                    <h3 className="mt-2">{vehicle.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-foreground/72">
                      {vehicle.subtitle}
                    </p>
                  </div>
                  <p className="text-sm">{vehicle.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-black/6 bg-black/[0.03] px-3 py-1.5 text-xs font-bold text-foreground/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-black/6 pt-4">
                    <span className="text-sm font-bold text-foreground">{text({ en: 'View model', zh: '查看车型' })}</span>
                    <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="business-partners" className="px-4 py-14 sm:py-18">
        <div className="section-shell">
          <div className="grid gap-5 md:grid-cols-2">
            {buyerGroups.map((group) => {
              const Icon = group.icon;

              return (
                <article key={text(group.title)} className="section-card p-7">
                  <Icon className="mb-5 h-7 w-7 text-primary" />
                  <h3>{text(group.title)}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{text(group.text)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
