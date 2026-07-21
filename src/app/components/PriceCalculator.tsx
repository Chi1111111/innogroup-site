import { useEffect, useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Info } from 'lucide-react';

const FALLBACK_NZD_TO_JPY_RATE = 86.5;
const RATE_ADJUSTMENT = 5;
const NZD_TO_JPY_RATE_URL = 'https://api.frankfurter.dev/v2/rates?base=NZD&quotes=JPY';

export function PriceCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_NZD_TO_JPY_RATE.toString());
  const [rateDate, setRateDate] = useState('');
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading');
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

  useEffect(() => {
    let isMounted = true;

    async function loadExchangeRate() {
      try {
        const response = await fetch(NZD_TO_JPY_RATE_URL);

        if (!response.ok) {
          throw new Error('Exchange rate request failed');
        }

        const data: Array<{ date?: string; rate?: number }> = await response.json();
        const marketRate = data[0]?.rate;

        if (typeof marketRate !== 'number' || marketRate <= RATE_ADJUSTMENT) {
          throw new Error('Exchange rate response was invalid');
        }

        const calculatorRate = marketRate - RATE_ADJUSTMENT;

        if (isMounted) {
          setExchangeRate(calculatorRate.toFixed(2));
          setRateDate(data[0]?.date ?? '');
          setRateStatus('live');
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setExchangeRate(FALLBACK_NZD_TO_JPY_RATE.toString());
          setRateStatus('fallback');
        }
      }
    }

    loadExchangeRate();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <section className="border-y border-black/8 bg-white/45 px-4 py-16 sm:py-20">
      <div className="section-shell">
        <div className="mb-10 grid gap-5 border-b border-black/8 pb-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="section-kicker">
              <Calculator className="h-4 w-4" />
              03 · Import Cost Calculator
            </div>
            <h2 className="mt-5">Estimate the landed price.</h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground lg:justify-self-end lg:text-right">
            Quick estimate for imported vehicle landed costs, including common shipping, compliance and service fees.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Calculator Input Section */}
          <div className="relative">
            <div className="section-card relative h-full p-5 sm:p-7 md:p-9">
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
                    Vehicle Price (JPY)
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">¥</span>
                    <input
                      type="number"
                      value={vehiclePrice}
                      onChange={(e) => setVehiclePrice(e.target.value)}
                      placeholder="3000000"
                      className="w-full rounded-xl border border-black/12 bg-[#fbf8f2] py-3.5 pl-11 pr-4 text-base font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:py-4 sm:pl-12 sm:pr-6 sm:text-lg"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Enter the source-market price in Japanese yen
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
                      placeholder="91.50"
                      readOnly
                      className="w-full rounded-xl border border-black/12 bg-[#fbf8f2] py-3.5 pl-11 pr-4 text-base font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:py-4 sm:pl-12 sm:pr-6 sm:text-lg"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {rateStatus === 'loading'
                      ? 'Updating today’s reference rate...'
                      : rateStatus === 'fallback'
                        ? `Reference rate: 1 NZD = ${exchangeRate} JPY`
                        : `Today's reference rate${rateDate ? ` (${rateDate})` : ''}: 1 NZD = ${exchangeRate} JPY`}
                  </p>
                </div>

                {/* Calculate Button */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:pt-4">
                  <button
                    onClick={calculatePrice}
                    className="button-primary group relative flex-1 overflow-hidden text-base sm:text-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Calculate
                    </span>
                  </button>
                  
                  {landedPrice !== null && (
                    <button
                      onClick={resetCalculator}
                      className="button-secondary px-6 text-base sm:text-lg"
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
              <div className="section-card flex h-full min-h-[440px] items-center justify-center p-6 sm:p-8 md:p-10">
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
                <div className="section-card animate-fadeIn p-5 sm:p-7 md:p-9">
                <div className="space-y-5 sm:space-y-6">
                  {/* Main Result */}
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-1">
                    <div className="rounded-lg bg-white/80 p-5 text-center sm:p-6">
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
                    
                    <div className="space-y-3 rounded-xl border border-black/10 bg-white/60 p-4 backdrop-blur-sm sm:p-5">
                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">Vehicle Price (JPY)</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(parseFloat(vehiclePrice), 'JPY')}</span>
                      </div>
                      
                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">Base Fees</span>
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

                      <div className="-mx-4 -mb-4 flex items-start justify-between gap-4 rounded-b-xl bg-primary/8 px-4 pb-4 pt-3 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5">
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
      </div>
    </section>
  );
}
