import { Check, X, Package, Zap } from 'lucide-react';

export function ImportVsLocal() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            <span className="text-primary">Import</span> vs <span className="text-foreground">Local Stock</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Both options have their benefits. Choose what works best for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-yellow-400 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-3xl shadow-xl border-2 border-primary/30 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-yellow-400 p-6 text-center">
                <Package className="w-12 h-12 text-white mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-white mb-2">Japan Import</h3>
                <p className="text-white/90">More Choice & Flexibility</p>
              </div>

              <div className="p-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">More Choice</p>
                    <p className="text-sm text-muted-foreground">Access auction and dealer stock across Japan</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Choose Your Spec</p>
                    <p className="text-sm text-muted-foreground">Select grade, colour, trim, and features</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Better Visibility</p>
                    <p className="text-sm text-muted-foreground">Inspection reports and auction information before buying</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Better Condition</p>
                    <p className="text-sm text-muted-foreground">Japan's strict maintenance culture</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                    <X className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Longer Wait</p>
                    <p className="text-sm text-muted-foreground">6-10 weeks shipping and compliance</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                    <X className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">No Physical Viewing</p>
                    <p className="text-sm text-muted-foreground">Rely on photos, auction sheets, and inspection reports</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 p-4 text-center border-t-2 border-primary/20">
                <p className="text-primary font-bold text-lg">Most Flexible Choice</p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-400 to-gray-300 rounded-3xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 text-center">
                <Zap className="w-12 h-12 text-white mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-white mb-2">Local Stock (NZ)</h3>
                <p className="text-white/90">Fast & Convenient</p>
              </div>

              <div className="p-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Fast Delivery</p>
                    <p className="text-sm text-muted-foreground">Drive away today or next week</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">View in Person</p>
                    <p className="text-sm text-muted-foreground">Test drive before buying</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Lower Risk</p>
                    <p className="text-sm text-muted-foreground">See exactly what you're getting</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">NZ Compliant</p>
                    <p className="text-sm text-muted-foreground">Already registered and ready</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Less Custom Choice</p>
                    <p className="text-sm text-muted-foreground">Harder to match exact grade, trim, or options</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Limited Selection</p>
                    <p className="text-sm text-muted-foreground">Only what is currently in stock</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-4 text-center border-t-2 border-gray-200">
                <p className="text-gray-700 font-bold text-lg">Fast and Easy</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-xl text-muted-foreground mb-6">
            We offer both options. Let us know your preference.
          </p>
          <a
            href="#quote"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg"
          >
            Get Started Today
          </a>
        </div>
      </div>
    </section>
  );
}
