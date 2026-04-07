import { ArrowRight, DollarSign, Ship, FileCheck, Calculator } from 'lucide-react';

export function PricingBreakdown() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How <span className="text-primary">Pricing Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete transparency. No hidden fees. Know exactly what you're paying for.
          </p>
        </div>

        {/* Visual Flow */}
        <div className="max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="flex-1 bg-gradient-to-br from-primary/5 to-white rounded-2xl p-8 border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-700 animate-slideInLeft">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Japan Price</h3>
                  <p className="text-muted-foreground">e.g., ¥3,500,000</p>
                </div>
              </div>
              <div className="space-y-2 text-foreground">
                <div className="flex justify-between text-sm">
                  <span>Auction/Dealer Price</span>
                  <span className="font-semibold">¥3,500,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>+ Service Fee</span>
                  <span className="font-semibold">¥100,000</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>FOB Price</span>
                  <span className="text-primary">¥3,600,000</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block animate-pulse-soft">
              <ArrowRight className="w-8 h-8 text-primary" />
            </div>
            <div className="md:hidden animate-pulse-soft">
              <ArrowRight className="w-8 h-8 text-primary rotate-90" />
            </div>

            <div className="flex-1 bg-gradient-to-br from-primary/5 to-white rounded-2xl p-8 border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-700 animate-slideInRight">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Convert to NZD</h3>
                  <p className="text-muted-foreground">@ Rate 86.5</p>
                </div>
              </div>
              <div className="space-y-2 text-foreground">
                <div className="flex justify-between text-sm">
                  <span>FOB in NZD</span>
                  <span className="font-semibold">$41,618</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>× 1.15 (GST)</span>
                  <span className="font-semibold">+$6,243</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Subtotal</span>
                  <span className="text-primary">$47,861</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center mb-8 animate-pulse-soft">
            <ArrowRight className="w-8 h-8 text-primary rotate-90" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="flex-1 bg-gradient-to-br from-primary/5 to-white rounded-2xl p-8 border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-700 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Ship className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Shipping</h3>
                  <p className="text-muted-foreground">Japan to NZ</p>
                </div>
              </div>
              <div className="space-y-2 text-foreground">
                <div className="flex justify-between text-sm">
                  <span>Ocean Freight</span>
                  <span className="font-semibold">$2,100</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <span className="text-3xl font-bold text-primary">+</span>
            </div>
            <div className="md:hidden">
              <span className="text-3xl font-bold text-primary">+</span>
            </div>

            <div className="flex-1 bg-gradient-to-br from-primary/5 to-white rounded-2xl p-8 border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-700 animate-slideInRight" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <FileCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Compliance</h3>
                  <p className="text-muted-foreground">NZ Registration</p>
                </div>
              </div>
              <div className="space-y-2 text-foreground">
                <div className="flex justify-between text-sm">
                  <span>Inspection & Cert</span>
                  <span className="font-semibold">$1,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Registration</span>
                  <span className="font-semibold">$500</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cleaning Fee</span>
                  <span className="font-semibold">$700*</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">* Varies by vehicle condition</p>
              </div>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center mb-8 animate-pulse-soft">
            <ArrowRight className="w-8 h-8 text-primary rotate-90" />
          </div>

          {/* Final Price */}
          <div className="bg-gradient-to-r from-primary via-yellow-400 to-primary p-1 rounded-3xl animate-scaleIn" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white rounded-3xl p-10 text-center">
              <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-4">
                <span className="text-primary text-sm font-semibold">Example Calculation</span>
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">Final NZ Landed Price</h3>
              <div className="text-6xl font-bold text-primary mb-4">$52,161</div>
              <p className="text-sm text-muted-foreground italic">
                * This is an example. Use our calculator to get your actual price.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <a
            href="#calculator"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 shadow-lg"
          >
            Calculate Your Own Price
            <Calculator className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
          </a>
        </div>
      </div>
    </section>
  );
}