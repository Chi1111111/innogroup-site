import { Quote, Star } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function SocialProof() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-16 text-white">
      <div className="pointer-events-none absolute right-6 top-6 hidden opacity-70 lg:block">
        <BrandLogo variant="watermark" eyebrow="Client Confidence" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">300+</div>
            <p className="text-gray-400">Vehicles Imported</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">Direct</div>
            <p className="text-gray-400">Japan auction and dealer access</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">Tailored</div>
            <p className="text-gray-400">Vehicle choice by spec and use</p>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">Support</div>
            <p className="text-gray-400">Compliance, parts, and after-sales help</p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm md:p-12">
            <div className="mb-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <Quote className="h-12 w-12 text-primary" />
              <BrandLogo
                variant="watermark"
                eyebrow="Verified Testimonial"
                className="max-w-fit self-start lg:hidden"
              />
            </div>

            <blockquote className="mb-6 text-xl leading-relaxed text-gray-100 md:text-2xl">
              "INNO GROUP helped me source the Toyota Crown spec I actually wanted. The process
              was transparent from start to finish, and they handled all the compliance work.
              Highly recommend!"
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <span className="text-lg font-bold text-primary">JK</span>
              </div>
              <div>
                <div className="font-semibold text-white">James Kim</div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span>Auckland, NZ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
