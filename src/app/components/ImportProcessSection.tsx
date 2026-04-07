import { Search, FileCheck, Ship, Key } from 'lucide-react';
import { Link } from 'react-router';

const steps = [
  {
    icon: Search,
    title: 'Select & Bid',
    description: 'Browse Japan auctions or pick from our curated list. We handle bidding.',
    duration: '1-2 days'
  },
  {
    icon: Ship,
    title: 'Ship to NZ',
    description: 'Professional shipping partners. Full insurance. Port to port tracking.',
    duration: '3-4 weeks'
  },
  {
    icon: FileCheck,
    title: 'Compliance',
    description: 'NZTA certification, customs clearance, safety checks—all sorted.',
    duration: '2-3 weeks'
  },
  {
    icon: Key,
    title: 'Delivery',
    description: 'Registration, plates, and keys. Ready to drive from your driveway.',
    duration: '1 week'
  }
];

export function ImportProcessSection() {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-2">
            <span className="text-primary text-sm">Import Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-foreground">How Import Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From Tokyo auction to Auckland driveway in 6–10 weeks.<br className="hidden md:block" />
            Complete transparency at every stage.
          </p>
        </div>

        <div className="relative">
          {/* Connection line - hidden on mobile */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" style={{ marginLeft: '12.5%', marginRight: '12.5%' }}></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Step card */}
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center relative z-10 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <Icon className="w-10 h-10 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-sm font-semibold shadow-md">
                        {index + 1}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                      <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                        <span className="text-xs text-primary font-medium">{step.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg transition-all shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
          >
            Start Your Import Journey
          </Link>
        </div>
      </div>
    </section>
  );
}