import { ExternalLink, Mail, MapPin, Phone, Clock3 } from 'lucide-react';
import { partnerPlaceholders } from '../../data';

export function PartnerNetworkSection() {
  return (
    <section
      id="partners"
      className="relative overflow-hidden bg-gradient-to-br from-[#131313] via-[#1a1a1a] to-[#0d0d0d] px-4 py-24 text-white"
    >
      <div className="absolute inset-0">
        <div className="absolute left-[-80px] top-10 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-60px] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-14 max-w-3xl space-y-5">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-5 py-2">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Supplier Network
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Our Partners
          </h2>
          <p className="max-w-2xl text-lg text-white/72">
            We work with trusted partners across repairs, parts, and after-sales support. More
            partnerships are currently in discussion.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {partnerPlaceholders.map((partner) => (
            <div
              key={partner.id}
              className="rounded-[28px] border border-white/12 bg-white/6 p-6 shadow-2xl backdrop-blur-sm"
            >
              <div className="mb-5 flex justify-end">
                <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/65">
                  Partner
                </span>
              </div>

              <div
                className={`mb-5 flex h-32 items-center justify-center rounded-[26px] border px-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                  partner.logoPanel === 'light'
                    ? 'border-primary/18 bg-[linear-gradient(180deg,#f8f3ea_0%,#efe6d7_100%)]'
                    : 'border-white/10 bg-[radial-gradient(circle_at_top,rgba(199,162,74,0.08),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.12))]'
                }`}
              >
                {partner.logoSrc ? (
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[20px]">
                    <img
                      src={partner.logoSrc}
                      alt={partner.logoAlt ?? partner.name}
                      className={
                        partner.logoFit === 'cover'
                          ? 'h-full w-full object-cover object-left'
                          : `max-h-[88px] w-auto max-w-full object-contain ${
                              partner.logoPanel === 'light' ? 'px-3' : 'px-1'
                            }`
                      }
                    />
                  </div>
                ) : partner.logoWordmark ? (
                  <div className="flex w-full flex-col items-center justify-center text-center">
                    <span className="font-[var(--font-display)] text-[1.7rem] leading-none tracking-[-0.03em] text-white sm:text-[1.9rem]">
                      {partner.logoWordmark.line1}
                    </span>
                    {partner.logoWordmark.line2 ? (
                      <span className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-primary/90">
                        {partner.logoWordmark.line2}
                      </span>
                    ) : null}
                    <span className="mt-3 h-px w-16 bg-primary/35" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Partner Logo</p>
                    <p className="text-sm text-white/65">Logo to be added</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-white/45">Partner</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{partner.name}</h3>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Address</p>
                  <div className="mt-2 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-7 text-white/72">{partner.address}</p>
                  </div>
                </div>

                {partner.phone || partner.email || partner.hours ? (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                    {partner.phone ? (
                      <a
                        href={`tel:${partner.phone.replace(/[^\d+]/g, '')}`}
                        className="flex items-start gap-3 text-sm text-white/72 transition-colors hover:text-white"
                      >
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{partner.phone}</span>
                      </a>
                    ) : null}

                    {partner.email ? (
                      <a
                        href={`mailto:${partner.email}`}
                        className="flex items-start gap-3 text-sm text-white/72 transition-colors hover:text-white"
                      >
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{partner.email}</span>
                      </a>
                    ) : null}

                    {partner.hours ? (
                      <div className="flex items-start gap-3 text-sm text-white/72">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{partner.hours}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Visit website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-white/60">
          More service partners are currently being discussed and will be added as they are
          confirmed.
        </p>
      </div>
    </section>
  );
}
