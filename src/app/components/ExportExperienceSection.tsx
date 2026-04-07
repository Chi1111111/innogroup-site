import { Compass, Globe2, PlaneTakeoff, TrendingUp } from 'lucide-react';
import { partnerPekemaImage, pekemaCertificateImage } from '../../data/pic';

const exportHighlights = [
  'Strong export activity across multiple overseas markets',
  'PEKEMA Registered Supplier recognised for Jan 2026 - Dec 2028',
  'Official supplier of imported used vehicles for PEKEMA members',
  'Proven track record exporting vehicles to international dealerships in Malaysia, Singapore, Macau (China), Brunei, and Indonesia',
  'Successfully exported 300-500+ vehicles to overseas partners',
  'Next growth phase: expanding exports of Chinese EVs from New Zealand to Middle Eastern markets',
  "Leveraging New Zealand's competitive vehicle pricing advantage to supply markets with higher local vehicle prices",
];

export function ExportExperienceSection() {
  return (
    <section className="bg-gradient-to-br from-[#111214] via-[#0c0d0f] to-black px-4 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_50%_75%,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_35%,transparent_60%),linear-gradient(180deg,#14161b_0%,#0d0f12_100%)] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_47%,rgba(255,255,255,0.08)_47%,rgba(255,255,255,0.08)_53%,transparent_53%,transparent_100%),linear-gradient(0deg,transparent_0%,transparent_47%,rgba(255,255,255,0.08)_47%,rgba(255,255,255,0.08)_53%,transparent_53%,transparent_100%)] opacity-45" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-white/12 bg-white/5 p-3">
                  <img
                    src={partnerPekemaImage}
                    alt="PEKEMA"
                    className="h-16 w-16 object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.36em] text-primary/80">Inno Group</p>
                  <p className="mt-2 text-lg font-semibold text-white/90">Export growth with PEKEMA recognition</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2">
                  <PlaneTakeoff className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                    Export Experience
                  </span>
                </div>

                <h2 className="text-4xl font-bold uppercase italic tracking-tight text-white md:text-5xl">
                  Export Experience & Expansion
                </h2>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
                <div className="overflow-hidden rounded-[22px] bg-white">
                  <img
                    src={pekemaCertificateImage}
                    alt="PEKEMA Registered Supplier Certificate"
                    className="w-full object-cover"
                  />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/80">
                    Official Recognition
                  </p>
                  <p className="text-sm leading-relaxed text-gray-300">
                    PEKEMA Registered Supplier certification for Jan 2026 to Dec 2028.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-center">
                  <Globe2 className="mx-auto mb-3 h-5 w-5 text-primary" />
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Export Markets</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-center">
                  <Compass className="mx-auto mb-3 h-5 w-5 text-primary" />
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Regional Reach</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-center">
                  <TrendingUp className="mx-auto mb-3 h-5 w-5 text-primary" />
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Growth Focus</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-white/8 bg-white/[0.03] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-10">
            <div className="mb-8">
              <p className="text-lg leading-relaxed text-gray-300">
                In addition to sourcing vehicles into New Zealand, Inno Group has built a strong
                export business with overseas dealership partners and industry recognition in
                Malaysia through its PEKEMA Registered Supplier status.
              </p>
            </div>

            <ul className="space-y-6">
              {exportHighlights.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-xl leading-relaxed text-white/92">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
