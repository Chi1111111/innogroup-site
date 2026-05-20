import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Sparkles, Info } from 'lucide-react';

export function PriceCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [exchangeRate, setExchangeRate] = useState('86.5'); // Default NZD to JPY rate
  const [landedPrice, setLandedPrice] = useState<number | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Breakdown values
  const [breakdown, setBreakdown] = useState({
    basePrice: 0,
    basePriceNZD: 0,
    import15Percent: 0,
    fixedFees: 3600,
    subtotal: 0,
    final5Percent: 0,
    total: 0
  });

  const calculatePrice = () => {
    const x = parseFloat(vehiclePrice);
    const y = parseFloat(exchangeRate);

    if (!x || !y || x <= 0 || y <= 0) {
      alert('Please enter valid positive numbers for both vehicle price and exchange rate.');
      return;
    }

    // Formula: ((x + 100000) / y * 1.15 + 2100 + 1000 + 500) * 1.05 = z
    const basePriceJPY = x + 100000;
    const basePriceNZD = basePriceJPY / y;
    const after15Percent = basePriceNZD * 1.15;
    const import15PercentFee = basePriceNZD * 0.15;
    const fixedFees = 2100 + 1000 + 500;
    const subtotal = after15Percent + fixedFees;
    const final5PercentFee = subtotal * 0.05;
    const total = subtotal * 1.05;

    setBreakdown({
      basePrice: basePriceJPY,
      basePriceNZD: basePriceNZD,
      import15Percent: import15PercentFee,
      fixedFees: fixedFees,
      subtotal: subtotal,
      final5Percent: final5PercentFee,
      total: total
    });

    setLandedPrice(total);
    setShowBreakdown(true);
  };

  const resetCalculator = () => {
    setVehiclePrice('');
    setLandedPrice(null);
    setShowBreakdown(false);
  };

  const formatCurrency = (value: number, currency: 'JPY' | 'NZD') => {
    if (currency === 'JPY') {
      return `¥${value.toLocaleString('en-NZ', { maximumFractionDigits: 0 })}`;
    }
    return `$${value.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NZD`;
  };

  return (
    <section className="bg-gradient-to-br from-white via-gray-50 to-white px-4 py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 space-y-4 text-center sm:mb-16">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2.5 sm:px-6 sm:py-3">
            <Calculator className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Import Cost Calculator</span>
          </div>
          <h2 className="mb-4 text-3xl text-foreground sm:text-4xl md:text-5xl">
            Calculate Your
            <span className="block mt-2 text-primary">Landing Price</span>
          </h2>
          <p className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg">
            Get an instant estimate of your total landed cost when importing from Japan.<br className="hidden md:block" />
            Includes all fees, duties, and our service charges.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Calculator Input Section */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-300 to-primary rounded-3xl blur-xl opacity-20"></div>
            <div className="relative rounded-3xl border-2 border-primary/10 bg-white p-5 shadow-2xl sm:p-7 md:p-10">
              <div className="mb-6 flex items-center gap-3 sm:mb-8">
                <div className="rounded-xl bg-primary/10 p-2.5 sm:p-3">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">Price Calculator</h3>
              </div>

              <div className="space-y-5 sm:space-y-6">
                {/* Vehicle Price Input */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-foreground font-bold">
                    <span className="text-primary">●</span>
                    Vehicle Price (Japanese Yen)
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">¥</span>
                    <input
                      type="number"
                      value={vehiclePrice}
                      onChange={(e) => setVehiclePrice(e.target.value)}
                      placeholder="3000000"
                      className="w-full rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 py-3.5 pl-11 pr-4 text-base font-medium shadow-sm transition-all hover:shadow-md focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/30 sm:py-4 sm:pl-12 sm:pr-6 sm:text-lg"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Enter the auction or dealer price in Japan
                  </p>
                </div>

                {/* Exchange Rate Input */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-foreground font-bold">
                    <span className="text-primary">●</span>
                    Exchange Rate (NZD to JPY)
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      placeholder="91.50"
                      className="w-full rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 py-3.5 pl-11 pr-4 text-base font-medium shadow-sm transition-all hover:shadow-md focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/30 sm:py-4 sm:pl-12 sm:pr-6 sm:text-lg"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Current market rate: 1 NZD = {exchangeRate} JPY
                  </p>
                </div>

                {/* Calculate Button */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:pt-4">
                  <button
                    onClick={calculatePrice}
                    className="group relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-primary py-4 text-base font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-primary/50 sm:text-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Calculate
                    </span>
                  </button>
                  
                  {landedPrice !== null && (
                    <button
                      onClick={resetCalculator}
                      className="rounded-2xl border-2 border-gray-200 px-6 py-4 font-bold text-base transition-all hover:border-primary/50 sm:text-lg"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="relative">
            {!showBreakdown ? (
              <div className="flex h-full items-center justify-center rounded-3xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 shadow-xl sm:p-8 md:p-10">
                <div className="text-center space-y-4">
                  <div className="inline-flex rounded-full bg-primary/10 p-5 sm:p-6">
                    <DollarSign className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-base text-muted-foreground sm:text-lg">
                    Enter vehicle price and exchange rate<br />to see your landing cost
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/5 p-5 shadow-2xl sm:p-7 md:p-10">
                <div className="space-y-5 sm:space-y-6">
                  {/* Main Result */}
                  <div className="bg-gradient-to-r from-primary via-yellow-400 to-primary p-1 rounded-2xl">
                    <div className="rounded-2xl bg-white p-5 text-center sm:p-6">
                      <p className="text-muted-foreground mb-2 font-semibold">Estimated Landed Price</p>
                      <p className="mb-2 text-4xl font-bold text-primary sm:text-5xl">
                        {formatCurrency(breakdown.total, 'NZD').split(' ')[0]}
                      </p>
                      <p className="text-sm text-muted-foreground">New Zealand Dollars</p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                      <span className="text-primary">●</span>
                      Cost Breakdown
                    </h4>
                    
                    <div className="space-y-3 rounded-2xl border border-primary/10 bg-white/50 p-4 backdrop-blur-sm sm:p-5">
                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">Vehicle Price (Japan)</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(parseFloat(vehiclePrice), 'JPY')}</span>
                      </div>
                      
                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">Base Fees (Japan)</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(100000, 'JPY')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">Subtotal in NZD</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.basePriceNZD, 'NZD')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">Import Duty (15%)</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.import15Percent, 'NZD')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">
                          Processing Fees
                          <span className="block text-xs">Shipping + Compliance + Admin</span>
                        </span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.fixedFees, 'NZD')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">Service Fee (5%)</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.final5Percent, 'NZD')}</span>
                      </div>

                      <div className="-mx-4 -mb-4 flex items-start justify-between gap-4 rounded-b-2xl bg-primary/5 px-4 pb-4 pt-3 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5">
                        <span className="text-base font-bold text-foreground sm:text-lg">Total Landed Price</span>
                        <span className="text-right text-xl font-bold text-primary sm:text-2xl">{formatCurrency(breakdown.total, 'NZD').split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 leading-relaxed">
                      <strong>Note:</strong> This is an estimate only. Final costs may vary based on vehicle specifications, 
                      additional compliance requirements, and market conditions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 sm:mt-16 md:grid-cols-3 md:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all">
            <div className="text-primary text-3xl mb-3">🇯🇵</div>
            <h4 className="font-bold text-foreground mb-2">Source from Japan</h4>
            <p className="text-sm text-muted-foreground">Access premium vehicles from trusted Japanese auctions and dealers</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all">
            <div className="text-primary text-3xl mb-3">📋</div>
            <h4 className="font-bold text-foreground mb-2">Full Compliance</h4>
            <p className="text-sm text-muted-foreground">All import duties, GST, and NZ compliance requirements included</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all">
            <div className="text-primary text-3xl mb-3">✅</div>
            <h4 className="font-bold text-foreground mb-2">Transparent Pricing</h4>
            <p className="text-sm text-muted-foreground">No hidden fees - what you see is what you pay</p>
          </div>
        </div>
      </div>
    </section>
  );
}
