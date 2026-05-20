import { VehicleCard } from './VehicleCard';
import { Link } from 'react-router';
import { vehicles } from '../../data/vehicles';

export function VehiclesSection() {
  return (
    <section id="vehicles" className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-2">
            <span className="text-primary text-sm">Example Vehicles</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-foreground mb-4">
            Import Cars We Can Source
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            These import car examples are only a few of the pre-order vehicles we can source for you from Japan.
            <br className="hidden md:block" />
            For more recommended options based on your budget and needs, please contact us.
          </p>
        </div>

        <div className="mb-10 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-6 py-5 text-center">
          <p className="text-base font-medium text-foreground md:text-lg">
            All vehicles shown here are Japan-import pre-order examples.
          </p>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Looking for something different? Send us your preferred make, budget, year, or use case
            and we will suggest matching options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.name} {...vehicle} />
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            to="/contact"
            className="inline-flex rounded-xl bg-primary px-10 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
          >
            Contact Us for More Recommendations
          </Link>
        </div>
      </div>
    </section>
  );
}
