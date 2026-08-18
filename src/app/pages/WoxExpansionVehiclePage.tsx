import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  Check,
  ClipboardCheck,
} from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { getWoxExpansionVehicle } from '../../data/woxExpansionVehicles';
import { useLanguage } from '../components/SiteTranslator';

const categoryLabels = {
  Passenger: { en: 'Passenger vehicle', zh: '乘用车' },
  Commercial: { en: 'Commercial vehicle', zh: '商用车' },
  'Public Transport': { en: 'Public transport', zh: '公共交通' },
  Autonomous: { en: 'Autonomous mobility', zh: '自动驾驶' },
};

export function WoxExpansionVehiclePage() {
  const { slug } = useParams();
  const { text } = useLanguage();
  const vehicle = getWoxExpansionVehicle(slug);

  if (!vehicle) return <Navigate to="/vehicles/china" replace />;

  const enquiryHref = `/contact?source=china&type=china&vehicle=${encodeURIComponent(vehicle.name)}&message=${encodeURIComponent(
    `Hi Inno Group, I would like more information about ${vehicle.name}.`,
  )}#quote`;

  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-8 text-white sm:py-10">
        <div className="section-shell">
          <Link to="/vehicles/china#available-models" className="inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {text({ en: 'Back to Cars from China', zh: '返回中国车源' })}
          </Link>
        </div>
      </section>

      <section className="bg-[#101113] px-4 pb-16 text-white sm:pb-24">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="space-y-6 animate-slideUp">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-black">
                {text(vehicle.status)}
              </span>
              <span className="rounded-full border border-white/14 bg-white/7 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/65">
                {text(categoryLabels[vehicle.category])}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">WOX Motor</p>
              <h1 className="mt-4 text-white">{vehicle.name}</h1>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/72">{text(vehicle.subtitle)}</p>
            </div>
            <p className="max-w-2xl leading-8 text-white/58">{text(vehicle.summary)}</p>
            <Link to={enquiryHref} className="button-primary">
              {text({ en: 'Request this model', zh: '咨询此车型' })}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-white to-[#e9e5dc] p-4 shadow-[0_34px_100px_rgba(0,0,0,0.35)] sm:p-7">
            <img src={vehicle.image} alt={`${vehicle.name} official product image`} decoding="async" fetchPriority="high" className="aspect-[16/10] w-full object-contain" />
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-20">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="section-kicker"><BatteryCharging className="h-4 w-4" />{text({ en: 'Model overview', zh: '车型概览' })}</div>
            <h2>{text(vehicle.subtitle)}</h2>
            <p className="text-lg leading-8 text-foreground/70">{text(vehicle.overview)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {vehicle.quickSpecs.map((spec) => (
              <article key={spec.label.en} className="section-card p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{text(spec.label)}</p>
                <p className="mt-3 text-xl font-bold text-foreground">{spec.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/6 bg-white/55 px-4 py-14 sm:py-20">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="section-kicker"><BadgeCheck className="h-4 w-4" />{text({ en: 'Applications', zh: '适用场景' })}</div>
            <h2>{text({ en: 'Built around real mobility needs.', zh: '围绕真实出行与运营需求。' })}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {vehicle.applications.map((application) => (
              <div key={application.en} className="flex items-center gap-3 rounded-[20px] border border-black/7 bg-white p-5">
                <Check className="h-5 w-5 flex-none text-primary" />
                <p className="font-bold text-foreground">{text(application)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-20">
        <div className="section-shell grid gap-8 rounded-[28px] bg-[#101113] p-7 text-white sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <div className="section-kicker border-white/12 bg-white/8"><ClipboardCheck className="h-4 w-4" />{text({ en: 'Before order', zh: '下单前确认' })}</div>
            <h2 className="mt-5 text-white">{text({ en: 'We confirm the market-ready specification first.', zh: '先确认适合目标市场的最终配置。' })}</h2>
          </div>
          <div>
            <p className="leading-8 text-white/65">
              {text({
                en: 'Right-hand-drive availability, New Zealand compliance, final equipment, warranty, charging compatibility, parts support and delivery timing are confirmed before any order proceeds.',
                zh: '右舵供应、新西兰合规、最终配置、质保、充电兼容性、配件支持和交付时间，都会在下单前逐项确认。',
              })}
            </p>
            <Link to={enquiryHref} className="button-primary mt-7">
              {text({ en: 'Discuss this model', zh: '咨询此车型' })}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
