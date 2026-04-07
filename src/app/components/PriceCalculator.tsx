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
    <section className="py-24 px-4 bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full mb-2">
            <Calculator className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">Import Cost Calculator</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-foreground mb-4">
            Calculate Your
            <span className="block mt-2 text-primary">Landing Price</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Get an instant estimate of your total landed cost when importing from Japan.<br className="hidden md:block" />
            Includes all fees, duties, and our service charges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Calculator Input Section */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-300 to-primary rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-10 border-2 border-primary/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Price Calculator</h3>
              </div>

              <div className="space-y-6">
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
                      className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all text-lg font-medium shadow-sm hover:shadow-md"
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
                      className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all text-lg font-medium shadow-sm hover:shadow-md"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Current market rate: 1 NZD = {exchangeRate} JPY
                  </p>
                </div>

                {/* Calculate Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={calculatePrice}
                    className="flex-1 group relative bg-gradient-to-r from-primary via-yellow-400 to-primary text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-primary/50 transition-all hover:scale-[1.02] overflow-hidden"
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
                      className="px-6 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-primary/50 transition-all"
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
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-xl p-8 md:p-10 border-2 border-gray-100 h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="inline-flex bg-primary/10 p-6 rounded-full">
                    <DollarSign className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Enter vehicle price and exchange rate<br />to see your landing cost
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-primary/5 via-white to-primary/5 rounded-3xl shadow-2xl p-8 md:p-10 border-2 border-primary/20 animate-fadeIn">
                <div className="space-y-6">
                  {/* Main Result */}
                  <div className="bg-gradient-to-r from-primary via-yellow-400 to-primary p-1 rounded-2xl">
                    <div className="bg-white rounded-2xl p-6 text-center">
                      <p className="text-muted-foreground mb-2 font-semibold">Estimated Landed Price</p>
                      <p className="text-5xl font-bold text-primary mb-2">
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
                    
                    <div className="space-y-3 bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-primary/10">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-muted-foreground">Vehicle Price (Japan)</span>
                        <span className="font-semibold text-foreground">{formatCurrency(parseFloat(vehiclePrice), 'JPY')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-muted-foreground">Base Fees (Japan)</span>
                        <span className="font-semibold text-foreground">{formatCurrency(100000, 'JPY')}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-muted-foreground">Subtotal in NZD</span>
                        <span className="font-semibold text-foreground">{formatCurrency(breakdown.basePriceNZD, 'NZD')}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-muted-foreground">Import Duty (15%)</span>
                        <span className="font-semibold text-foreground">{formatCurrency(breakdown.import15Percent, 'NZD')}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-muted-foreground">
                          Processing Fees
                          <span className="block text-xs">Shipping + Compliance + Admin</span>
                        </span>
                        <span className="font-semibold text-foreground">{formatCurrency(breakdown.fixedFees, 'NZD')}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-muted-foreground">Service Fee (5%)</span>
                        <span className="font-semibold text-foreground">{formatCurrency(breakdown.final5Percent, 'NZD')}</span>
                      </div>

                      <div className="flex justify-between items-center pt-3 bg-primary/5 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                        <span className="font-bold text-foreground text-lg">Total Landed Price</span>
                        <span className="font-bold text-primary text-2xl">{formatCurrency(breakdown.total, 'NZD').split(' ')[0]}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
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