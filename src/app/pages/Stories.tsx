import { Link } from 'react-router';
import { Star } from 'lucide-react';
import { DetailedCaseStudies } from '../components/DetailedCaseStudies';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { caseStudiesContent } from '../../data/case-studies';

export function Stories() {
  return (
    <div className="pt-20">
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-6 py-3">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="font-semibold text-primary">{caseStudiesContent.badge}</span>
          </div>
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
            Real Stories from <span className="text-primary">Happy Clients</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-300">
            Discover how our clients found the right vehicles through our transparent
            Japan-direct sourcing process.
          </p>
        </div>
      </section>

      <DetailedCaseStudies />
      <TestimonialsSection />

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h2 className="text-4xl font-bold text-foreground md:text-5xl">
            {caseStudiesContent.ctaTitle}
          </h2>
          <p className="text-xl text-muted-foreground">{caseStudiesContent.ctaSubtitle}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/#calculator"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-primary px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:shadow-primary/50"
            >
              {caseStudiesContent.ctaPrimaryButton}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-2xl border border-primary/20 bg-white px-10 py-4 text-lg font-bold text-foreground transition-all hover:scale-105 hover:border-primary/40"
            >
              {caseStudiesContent.ctaSecondaryButton}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
