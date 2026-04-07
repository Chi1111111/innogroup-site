import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { heroGalleryImages } from '../../data/pic';
import { BrandLogo } from './BrandLogo';

const heroHighlights = [
  'Japan auction and dealer sourcing',
  'NZ compliance and delivery handled',
  'After-sales support through trusted partners',
];

const heroStats = [
  {
    label: 'Vehicle choice',
    value: 'Spec First',
    note: 'Choose the model, grade, colour, and options that suit you',
  },
  {
    label: 'Stock access',
    value: 'Japan Direct',
    note: 'Auction lanes, dealer networks, and selected local stock',
  },
  {
    label: 'Ownership support',
    value: 'After Purchase',
    note: 'Parts, repairs, workshop referrals, and practical help',
  },
];

export function Hero() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroGalleryImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#090909] px-4 pb-16 pt-24 text-white sm:pb-20 sm:pt-28 md:pb-24">
      <div className="absolute inset-0">
        {heroGalleryImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1500 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Luxury vehicle collection ${index + 1}`}
              className="h-full w-full scale-105 object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/58 to-black/78" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/62 via-transparent to-black/86" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,162,74,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(199,162,74,0.12),transparent_30%)]" />
      </div>

      <div className="section-shell relative z-10">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-12">
          <div className="max-w-3xl">
            <div className="mb-6 animate-slideUp sm:mb-8" style={{ animationDelay: '0.05s' }}>
              <BrandLogo variant="hero" className="max-w-[240px] sm:max-w-fit" />
            </div>

            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/76 animate-slideUp sm:mb-6 sm:gap-3 sm:px-5 sm:text-xs sm:tracking-[0.24em]"
              style={{ animationDelay: '0.12s' }}
            >
              <span className="h-2 w-2 rounded-full bg-primary" />
              Auckland Based
              <span className="text-white/35">|</span>
              Japan Direct Sourcing
            </div>

            <h1
              className="animate-slideUp text-[3.15rem] leading-[0.92] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.75rem]"
              style={{ animationDelay: '0.2s' }}
            >
              Direct from <span className="text-primary">Japan</span>.
              <br />
              Clearer sourcing for New Zealand.
            </h1>

            <p
              className="mt-5 max-w-2xl animate-slideUp text-base leading-7 text-white/72 sm:mt-6 md:text-xl md:leading-8"
              style={{ animationDelay: '0.3s' }}
            >
              We help you choose the right model, grade, colour, and features through Japanese
              auctions, dealer networks, and selected local stock, with clear landed pricing and
              practical support after delivery.
            </p>

            <div
              className="mt-6 flex flex-wrap gap-2.5 animate-slideUp sm:mt-8 sm:gap-3"
              style={{ animationDelay: '0.4s' }}
            >
              {heroHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/12 bg-white/7 px-3.5 py-2 text-xs text-white/74 backdrop-blur-sm sm:px-4 sm:text-sm"
                >
                  {item}
                </span>
              ))}
            </div>

            <div
              className="mt-8 flex flex-col gap-3 animate-slideUp sm:mt-10 sm:flex-row sm:gap-4"
              style={{ animationDelay: '0.5s' }}
            >
              <a href="#quote" className="button-primary w-full sm:w-auto">
                Request a Quote
                <ArrowRight className="h-5 w-5" />
              </a>

              <a href="#calculator" className="button-secondary-dark w-full sm:w-auto">
                Calculate Landing Price
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div
            className="section-card-dark animate-slideUp p-6 sm:p-8 md:p-10"
            style={{ animationDelay: '0.45s' }}
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
                  Why Clients Start Here
                </p>
                <p className="mt-2 text-sm text-white/62">
                  A cleaner buying path from sourcing to ownership.
                </p>
              </div>

              <div className="flex gap-2 self-start sm:self-auto">
                {heroGalleryImages.map((image, index) => (
                  <span
                    key={image}
                    className={`h-1.5 w-9 rounded-full transition-colors ${
                      index === currentImage ? 'bg-primary' : 'bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-white/8 bg-black/18 p-4 sm:p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm leading-7 text-white/62">{stat.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[26px] border border-primary/18 bg-primary/10 p-4 sm:mt-8 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/82">
                Typical Brief
              </p>
              <p className="mt-3 text-base leading-7 text-white/86 sm:text-lg sm:leading-8">
                "Hybrid SUV, under $40k, low mileage, tidy history, and easy support after
                purchase."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
