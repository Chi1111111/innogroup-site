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

const vehicleReasons = [
  'Competitive pricing',
  'Modern design and technology',
  'EV, hybrid, MPV and SUV options',
  'Manufacturer warranty support where applicable',
  'Growing global recognition',
];

const categories = [
  {
    title: 'MPVs',
    icon: Users,
    text: 'Spacious, practical and suitable for family, business and passenger transport use.',
  },
  {
    title: 'SUVs',
    icon: Car,
    text: 'Modern design, strong value and practical daily usability.',
  },
  {
    title: 'EVs & Hybrids',
    icon: BatteryCharging,
    text: 'Efficient new energy options with advanced technology features.',
  },
  {
    title: 'Commercial Vehicles',
    icon: Truck,
    text: 'Flexible options for business, fleet and trade use.',
  },
];

const businessNotes = [
  {
    title: 'Manufacturer Warranty Support',
    icon: ShieldCheck,
    text: 'Selected vehicles may come with factory-backed warranty support, such as up to 5 years or 150,000 km depending on the model, manufacturer and market arrangement.',
  },
  {
    title: 'Trusted Supply Relationships',
    icon: Factory,
    text: 'We work with selected Chinese manufacturers, authorised suppliers and export partners to access vehicles with clear sourcing, documentation and support.',
  },
  {
    title: 'New Models Updated Regularly',
    icon: RefreshCw,
    text: 'Our China vehicle range will continue to expand as new models, specifications and market-ready options become available.',
  },
];

const buyerGroups = [
  {
    title: 'For Private Buyers',
    icon: Users,
    text: 'Explore new vehicle options with strong value, modern features and local support.',
  },
  {
    title: 'For Dealers and Partners',
    icon: Building2,
    text: 'Work with Inno Group to access Chinese vehicle supply channels and overseas market opportunities.',
  },
];

export function ChinaVehicles() {
  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-16 text-white sm:py-24">
        <div className="section-shell grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-4xl space-y-6 animate-slideUp">
            <div className="section-kicker border-white/12 bg-white/8">
              <BatteryCharging className="h-4 w-4" />
              Cars from China
            </div>
            <h1 className="text-white">Cars from China</h1>
            <p className="max-w-3xl text-lg leading-8 text-white/70">
              Factory-backed Chinese vehicles, sourced through trusted manufacturer and supplier
              relationships, delivered with local New Zealand support.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#available-models" className="button-primary">
                View Available Models
                <ArrowRight className="h-5 w-5" />
              </a>
              <a href="#business-partners" className="button-secondary-dark">
                Become a Partner
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
            {vehicleReasons.map((reason) => (
              <div key={reason} className="flex gap-3 rounded-[20px] bg-black/18 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" />
                <p className="text-sm font-semibold leading-6 text-white/74">{reason}</p>
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
              Why Chinese Vehicles?
            </div>
            <h2>Why Chinese Vehicles?</h2>
            <p className="text-lg leading-8 text-foreground/70">
              China has become one of the world's most active automotive markets, especially in
              EVs, MPVs, SUVs and intelligent vehicle technology. Inno Group works with selected
              Chinese manufacturers and suppliers to introduce high-value models to New Zealand and
              overseas markets.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {businessNotes.map((note) => {
              const Icon = note.icon;

              return (
                <article key={note.title} className="section-card p-6">
                  <Icon className="mb-4 h-7 w-7 text-primary" />
                  <h3 className="text-lg">{note.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{note.text}</p>
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
              Categories
            </div>
            <h2>Vehicle Categories We Source</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <article key={category.title} className="section-card p-6">
                  <Icon className="mb-5 h-7 w-7 text-primary" />
                  <h3>{category.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{category.text}</p>
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
                Available Models
              </div>
              <h2>Current China Vehicle Range</h2>
              <p className="max-w-3xl text-lg leading-8 text-foreground/72">
                Choose a model, review configurations, then request a final quote and compliance
                check before order.
              </p>
            </div>
            <p className="max-w-md text-sm font-semibold leading-7 text-foreground/62">
              Final specification, RHD availability, compliance pathway, warranty terms, charging
              compatibility, parts supply and landed pricing are confirmed before order.
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
                      From {vehicle.priceFrom}
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
                    <span className="text-sm font-bold text-foreground">View model</span>
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
                <article key={group.title} className="section-card p-7">
                  <Icon className="mb-5 h-7 w-7 text-primary" />
                  <h3>{group.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-foreground/68">{group.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
