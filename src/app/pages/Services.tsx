import { Package, Settings, Shield, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { ServicesSection } from '../components/ServicesSection';
import { PartnerNetworkSection } from '../components/PartnerNetworkSection';

export function Services() {
  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1115] via-[#1a1c21] to-[#251e10] px-4 py-24 text-white">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute bottom-[-80px] right-[-40px] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-6 py-3">
              <Settings className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold">Services & Ownership</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Simple Support
              <span className="block text-primary">For Inno Owners</span>
            </h1>
            <p className="max-w-3xl text-xl text-white/74">
              One page for after-sales services and ownership benefits: repairs, parts,
              partner referrals, and practical support after you buy.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <Wrench className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">Repair Help</h3>
              <p className="mt-2 text-sm leading-7 text-white/68">
                Bodywork, paint, workshop referrals, and practical repair support.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <Package className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">Ownership Benefits</h3>
              <p className="mt-2 text-sm leading-7 text-white/68">
                Easier access to trusted partners, parts support, and ongoing help after purchase.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <Shield className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">Trusted Network</h3>
              <p className="mt-2 text-sm leading-7 text-white/68">
                A cleaner way to introduce four partner businesses on this page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ServicesSection />
      <PartnerNetworkSection />

      <section className="relative overflow-hidden px-4 py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-[#17120a]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-3">
            <Settings className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Services & Ownership</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-white">
            Need Help After
            <span className="block mt-2 text-primary">You Buy the Car?</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-white/72">
            Contact us for repairs, body and paint, partner referrals, or parts support.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90"
            >
              Contact Us
            </Link>
            <a
              href="https://wa.me/642885307225"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/8 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:border-primary/40 hover:bg-white/12"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
