import { ArrowRight, BatteryCharging, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { chinaVehicles } from '../../data/chinaVehicles';

export function ChinaVehicles() {
  return (
    <div className="pt-20">
      <section className="px-4 py-16 sm:py-20">
        <div className="section-shell">
          <div className="mb-10 max-w-4xl space-y-5 animate-slideUp">
            <div className="section-kicker">
              <BatteryCharging className="h-4 w-4" />
              Cars from China
            </div>
            <h1>China Import Vehicle Range</h1>
            <p className="max-w-3xl text-lg leading-8 text-foreground/72">
              New-energy vehicles available for China-to-New Zealand direct import enquiry. Choose a
              model, review configurations, then request a final quote and compliance check before
              order.
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
                    <h2 className="mt-2 text-3xl">{vehicle.name}</h2>
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

          <div className="mt-10 animate-slideUp rounded-[24px] border border-primary/20 bg-primary/10 p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-primary" />
              <p className="text-sm font-medium text-foreground/78">
                Final specification, RHD availability, compliance pathway, warranty terms, charging
                compatibility, parts supply and landed pricing are confirmed before order.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
