import { Users } from 'lucide-react';
import { Link } from 'react-router';
import { AboutSection } from '../components/AboutSection';
import { ExportExperienceSection } from '../components/ExportExperienceSection';
import { SourcingCredentialsSection } from '../components/SourcingCredentialsSection';
import { WhyChooseUsSection } from '../components/WhyChooseUsSection';

export function About() {
  return (
    <div className="pt-20">
      <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-20">
        <div className="mx-auto max-w-7xl space-y-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">About Us</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground md:text-6xl">
            Your Trusted <span className="text-primary">Import Partner</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Based in Auckland, New Zealand, INNO GROUP is dedicated to bringing
            premium Japanese vehicles to Kiwi drivers and dealers.
          </p>
        </div>
      </section>

      <AboutSection />
      <SourcingCredentialsSection />
      <ExportExperienceSection />
      <WhyChooseUsSection />

      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h2 className="text-4xl font-bold text-white md:text-5xl">Join Our Growing Family</h2>
          <p className="text-xl text-gray-300">
            Experience the INNO GROUP difference. Let us help you find and import your
            perfect vehicle from Japan.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="inline-block rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-primary px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:shadow-primary/50"
            >
              Contact Us Today
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
