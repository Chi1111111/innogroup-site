import { BadgeCheck, Building2, Globe2, ShieldCheck } from 'lucide-react';
import { partnerAsnetImage, partnerNichiboImage, partnerUssImage } from '../../data/pic';

const supplierLogos = [
  {
    name: 'USS Japan',
    image: partnerUssImage,
    description: 'One of the largest and most established vehicle auction networks in Japan.',
  },
  {
    name: 'Nichibo',
    image: partnerNichiboImage,
    description: 'A trusted Japanese dealer auction platform with strong access to quality stock.',
  },
  {
    name: 'ASNET',
    image: partnerAsnetImage,
    description: 'A well-known dealer network that expands access to specific models and grades.',
  },
];

const importChannels = [
  'ASNET (Aucnet) dealer network',
  'Nichibo dealer auction platform',
  'USS Japan - one of the largest vehicle auction networks',
  'Additional trusted Japanese auction houses and supplier networks',
];

const customerBenefits = [
  'Access to large auction inventories across Japan',
  'Broader choice than relying only on local yard stock',
  'Ability to source specific models, grades, and specifications',
  'Clear service-fee structure and straightforward sourcing updates',
];

export function SourcingCredentialsSection() {
  return (
    <section className="bg-[#0c0c0d] px-4 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Sourcing Credentials
            </span>
          </div>

          <h2 className="mb-5 text-4xl font-bold uppercase italic tracking-tight text-white md:text-5xl">
            Imported Vehicle Sourcing
          </h2>
          <p className="text-lg leading-relaxed text-gray-300 md:text-xl">
            At Inno Group, our primary sourcing method is through established Japanese vehicle
            auction and dealer networks, enabling access to a wide range of vehicles.
          </p>
        </div>

        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {supplierLogos.map((supplier) => (
            <div
              key={supplier.name}
              className="group rounded-[28px] border border-white/8 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.05]"
            >
              <div className="mb-5 flex h-28 items-center justify-center rounded-[22px] bg-white px-6 py-5">
                <img
                  src={supplier.image}
                  alt={supplier.name}
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">{supplier.name}</h3>
              <p className="leading-relaxed text-gray-400">{supplier.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-[32px] border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-primary/15 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white">Import Channels</h3>
            </div>

            <ul className="space-y-4">
              {importChannels.map((item) => (
                <li key={item} className="flex items-start gap-3 text-lg leading-relaxed text-gray-300">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[32px] border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-primary/15 p-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white">Customer Benefits</h3>
            </div>

            <ul className="space-y-4">
              {customerBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-lg leading-relaxed text-gray-300">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 text-sm uppercase tracking-[0.22em] text-gray-500">
          <Globe2 className="h-4 w-4 text-primary" />
          <span>Established Japan auction and dealer sourcing network</span>
        </div>
      </div>
    </section>
  );
}
