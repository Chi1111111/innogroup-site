import { VehiclesSection } from '../components/VehiclesSection';
import { Car } from 'lucide-react';
import { Link } from 'react-router';

export function Vehicles() {
  return (
    <div className="pt-20">
      {/* Page Header */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-white to-primary/10">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full mb-2">
            <Car className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Sample Selection</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Import Cars We <span className="text-primary">Can Source</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            These are example pre-order import cars to show the type of Japan-sourced stock we can
            help with. If you want more car recommendations, contact us and we will suggest options
            that fit your budget and needs.
          </p>
        </div>
      </section>

      <VehiclesSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Need More Options?
          </h2>
          <p className="text-xl text-gray-300">
            These examples are only a starting point. Tell us what you want and we will recommend
            more suitable Japan-import pre-order options.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-gradient-to-r from-primary via-yellow-400 to-primary text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-primary/50 transition-all hover:scale-105"
          >
            Request a Vehicle
          </Link>
        </div>
      </section>
    </div>
  );
}
