import { Shield, Award, Star, TrendingUp } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function TrustSection() {
  return (
    <section className="bg-[#111214] px-4 py-16 text-white">
      <div className="section-shell">
        <div className="section-card-dark overflow-hidden p-8 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div className="space-y-6">
              <div className="section-kicker border-white/12 bg-white/8 text-primary">
                Trusted Foundation
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl text-white md:text-5xl">
                  Most NZ dealers source from Japan.
                  <span className="block text-primary">We go direct.</span>
                </h2>
                <p className="max-w-2xl text-lg leading-8 text-white/68">
                  Direct sourcing, practical ownership support, and a business model built around
                  clearer communication, wider stock access, and fewer middle layers.
                </p>
              </div>

              <BrandLogo variant="plaque" eyebrow="Trusted Brand" className="max-w-fit" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-6">
                <Shield className="mb-4 h-9 w-9 text-primary" />
                <h3 className="mb-2 text-xl font-semibold text-white">NZ Registered</h3>
                <p className="text-sm leading-7 text-white/62">Licensed dealer with local support in Auckland.</p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-6">
                <Award className="mb-4 h-9 w-9 text-primary" />
                <h3 className="mb-2 text-xl font-semibold text-white">Warranty Included</h3>
                <p className="text-sm leading-7 text-white/62">Three-month warranty in line with NZ requirements.</p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-6">
                <Star className="mb-4 h-9 w-9 text-primary" />
                <h3 className="mb-2 text-xl font-semibold text-white">Client Satisfaction</h3>
                <p className="text-sm leading-7 text-white/62">Carefully sourced vehicles with consistent service follow-through.</p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-6">
                <TrendingUp className="mb-4 h-9 w-9 text-primary" />
                <h3 className="mb-2 text-xl font-semibold text-white">Japan Direct</h3>
                <p className="text-sm leading-7 text-white/62">Auction and dealer-network access without extra middle layers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
