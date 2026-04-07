import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router';
import { bmw5SeriesImage, lexusRx450hImage, toyotaHarrierImage } from '../../data/pic';

const deals = [
  {
    model: 'BMW 5 Series',
    year: '2020',
    image: bmw5SeriesImage,
  },
  {
    model: 'Toyota Harrier',
    year: '2021',
    image: toyotaHarrierImage,
  },
  {
    model: 'Lexus RX450h',
    year: '2019',
    image: lexusRx450hImage,
  },
];

export function RecentDeals() {
  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Recent Success Stories</span>
          </div>
          <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Recent Client <span className="text-primary">Deliveries</span>
          </h2>
          <p className="mx-auto mb-2 max-w-3xl text-xl text-muted-foreground">
            A few recent examples of vehicles sourced and delivered for clients
          </p>
          <p className="text-base text-muted-foreground">
            <span className="font-semibold text-primary">Quick Highlights</span> -
            <Link to="/stories" className="ml-1 underline transition-colors hover:text-primary">
              View detailed case studies and full testimonials
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {deals.map((deal) => (
            <div key={`${deal.model}-${deal.year}`} className="group relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary to-yellow-400 blur opacity-20 transition-opacity group-hover:opacity-30" />
              <div className="relative overflow-hidden rounded-3xl border-2 border-primary/10 bg-white shadow-xl transition-all hover:border-primary/30">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.model}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute right-4 top-4 rounded-full bg-green-500 px-3 py-1 text-sm font-bold text-white">
                    Delivered
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div>
                    <h3 className="mb-1 text-2xl font-bold text-foreground">{deal.model}</h3>
                    <p className="text-muted-foreground">{deal.year}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-6 text-xl text-muted-foreground">
            Tell us what you want and let&apos;s find the right car for you.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#quote"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-primary/90"
            >
              Start Your Search
            </a>
            <a
              href="#quote"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-white px-8 py-4 text-lg font-semibold text-foreground transition-all hover:scale-105 hover:border-primary/40 hover:bg-gray-50"
            >
              Request a Quote
            </a>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="mb-3 text-muted-foreground">
              Want to see more detailed success stories and customer reviews?
            </p>
            <Link
              to="/stories"
              className="group inline-flex items-center gap-2 text-lg font-semibold text-primary transition-colors hover:text-primary/80"
            >
              View All Success Stories & Testimonials
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
