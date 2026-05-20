import { Search, Shield, Clock, Award } from 'lucide-react';

const benefits = [
  {
    icon: Search,
    title: 'Choose Your Spec',
    description: 'Pick the model, grade, colour, and features that suit you.',
  },
  {
    icon: Shield,
    title: 'Verified Sourcing',
    description: 'Auction grades, service history, and sourcing checks before you commit.',
  },
  {
    icon: Clock,
    title: 'Clear Process',
    description: 'Real-time updates, itemised costs, and no guesswork.',
  },
  {
    icon: Award,
    title: 'Support That Continues',
    description: 'NZ compliance handled, plus practical help after delivery.',
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-2">
            <span className="text-primary text-sm">Why Choose Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-foreground">Why Choose Inno Group?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We do more than import cars. We help you find the right one
            <br className="hidden md:block" />
            with the spec and condition you actually want.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group text-center space-y-4 p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/10 group-hover:border-primary/30 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
                  <Icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
