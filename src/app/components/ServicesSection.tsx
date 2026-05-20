import { ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router';
import { services } from '../../data';

export function ServicesSection() {
  return (
    <section id="services" className="bg-[#fbfaf6] px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-primary/12 bg-white p-8 shadow-xl md:p-10">
            <div className="mb-5 inline-flex items-center rounded-full bg-primary/10 px-5 py-2">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Services & Ownership
              </span>
            </div>

            <h2 className="max-w-3xl text-4xl md:text-5xl text-foreground">
              Practical Help After Purchase
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              After-sales services and ownership benefits in one place: repairs, paint, parts,
              and trusted partner support.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Bodywork and repaint support when the car needs cosmetic attention',
                'Mechanical workshop referrals for diagnostics and repairs',
                'Partner access and parts help for ongoing ownership',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-1.5 text-primary">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-base leading-7 text-foreground/80">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-gradient-to-br from-[#171717] via-[#201a0d] to-[#111111] p-8 text-white shadow-2xl md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              What Owners Usually Need
            </p>
            <div className="mt-6 space-y-5">
              {[
                'Dents, scratches, and paintwork',
                'Repair referrals and diagnostics',
                'Parts help for Japanese models',
                'Easy access to trusted partners',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-sm leading-7 text-white/78"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <a
                href="#partners"
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/35 bg-primary/12 px-6 py-3 font-semibold text-primary transition-all hover:scale-105 hover:bg-primary hover:text-white"
              >
                Explore Partner Spaces
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="group rounded-[30px] border border-primary/12 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {service.eyebrow}
                      </span>
                    </div>
                    <h3 className="mt-5 text-3xl font-semibold text-foreground transition-colors group-hover:text-primary">
                      {service.title}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-primary/18 to-primary/6 p-4 text-primary shadow-md">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>

                <p className="mt-5 text-base leading-8 text-muted-foreground">{service.description}</p>

                <div className="mt-7 space-y-3">
                  {service.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-sm leading-7 text-foreground/80">{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
          >
            Talk to Us About After-Sales Support
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
