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

const sourceMarkets = [
  {
    title: 'Japan',
    icon: Car,
    text: 'Quality used vehicles, auction access, dealer stock and export support.',
  },
  {
    title: 'China',
    icon: BatteryCharging,
    text: 'Factory-backed new vehicles, EVs, MPVs, SUVs and commercial models with manufacturer warranty support.',
  },
  {
    title: 'Macau',
    icon: MapPin,
    text: 'Selected Macau supply and regional sourcing opportunities for trade and sourcing partners.',
  },
  {
    title: 'Other Markets',
    icon: Globe2,
    text: 'We continue to explore supply channels from other right-hand-drive friendly overseas markets.',
  },
];

const japanPoints = [
  'Vehicle sourcing and inspection support',
  'Transparent landed cost estimation',
  'Shipping, compliance and delivery coordination',
];

const chinaPoints = [
  'MPVs, SUVs, EVs and commercial models',
  'Selected manufacturer and supplier channels',
  'Warranty support where applicable',
];

const partnerAudiences = [
  {
    title: 'For Customers',
    icon: Users,
    text: 'Find the right vehicle with clear pricing and local support.',
  },
  {
    title: 'For Dealers',
    icon: Building2,
    text: 'Access overseas vehicle sources and wholesale opportunities.',
  },
  {
    title: 'For Manufacturers',
    icon: Factory,
    text: 'Explore New Zealand market entry and local distribution support.',
  },
];

export function Home() {
  return (
    <>
      <Hero />

      <section className="px-4 py-16 sm:py-20">
        <div className="section-shell">
          <div className="mb-10 max-w-3xl space-y-4">
            <div className="section-kicker">
              <Globe2 className="h-4 w-4" />
              Source Markets
            </div>
            <h2>Multiple Sourcing Channels. One Trusted Partner.</h2>
            <p className="text-lg leading-8 text-foreground/70">
              Inno Group is not limited to a single vehicle source. We work across Japanese dealer
              stock and auctions, selected Chinese manufacturers and suppliers, Macau market
              opportunities, and other overseas sourcing networks.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {sourceMarkets.map((market) => {
              const Icon = market.icon;

              return (
                <article key={market.title} className="section-card p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151515] text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3>{market.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{market.text}</p>
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
                Japan Direct Import
              </div>
              <div className="space-y-3">
                <h2>Japan Direct Import</h2>
                <p className="max-w-xl text-lg leading-8 text-foreground/70">
                  We help customers source quality vehicles directly from Japan with transparent
                  pricing, selection support, shipping coordination and local delivery assistance.
                </p>
              </div>
              <div className="space-y-3 border-t border-black/6 pt-5">
                {japanPoints.map((point) => (
                  <div key={point} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-primary" />
                    <p className="text-sm font-semibold leading-7 text-foreground/76">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Link to="/jpauc-feed" className="button-secondary">
                Explore Japan Stock
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </article>

          <article className="flex min-h-[360px] flex-col justify-between rounded-[30px] border border-black/6 bg-[#111214] p-7 text-white shadow-[0_30px_100px_rgba(17,17,17,0.18)] sm:p-9 lg:p-10">
            <div className="space-y-5">
              <div className="section-kicker border-white/12 bg-white/8 text-primary">
                <BatteryCharging className="h-4 w-4" />
                Cars from China
              </div>
              <div className="space-y-3">
                <h2 className="text-white">Cars from China</h2>
                <p className="max-w-xl text-lg leading-8 text-white/68">
                  Access factory-backed vehicles from selected Chinese manufacturers and suppliers,
                  with local New Zealand support from sourcing enquiry through handover.
                </p>
              </div>
              <div className="space-y-3 border-t border-white/10 pt-5">
                {chinaPoints.map((point) => (
                  <div key={point} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-primary" />
                    <p className="text-sm font-semibold leading-7 text-white/72">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <Link to="/vehicles/china" className="button-primary">
                Explore China Vehicles
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
              Partner With Us
            </div>
            <h2>For Customers, Dealers and Manufacturers</h2>
            <p className="text-lg leading-8 text-foreground/70">
              A multi-market vehicle sourcing network built for New Zealand buyers and business
              partners.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {partnerAudiences.map((audience) => {
              const Icon = audience.icon;

              return (
                <article key={audience.title} className="section-card p-6">
                  <Icon className="mb-5 h-7 w-7 text-primary" />
                  <h3>{audience.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{audience.text}</p>
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
