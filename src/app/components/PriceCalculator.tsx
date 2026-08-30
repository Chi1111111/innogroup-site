import { useEffect, useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Info } from 'lucide-react';
import { useLanguage } from './SiteTranslator';

const FALLBACK_NZD_TO_JPY_RATE = 86.5;
const RATE_ADJUSTMENT = 5;
const NZD_TO_JPY_RATE_URL = 'https://api.frankfurter.dev/v2/rates?base=NZD&quotes=JPY';

export function PriceCalculator() {
  const { text } = useLanguage();
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_NZD_TO_JPY_RATE.toString());
  const [rateDate, setRateDate] = useState('');
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading');
  const [landedPrice, setLandedPrice] = useState<number | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validationError, setValidationError] = useState('');

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
      setValidationError(text({
        en: 'Enter a valid positive vehicle price to calculate an estimate.',
        zh: '请输入有效且大于零的车辆价格。',
      }));
      return;
    }

    setValidationError('');

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
    setValidationError('');
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
              03 · {text({ en: 'Import Cost Calculator', zh: '进口落地价计算器' })}
            </div>
            <h2 className="mt-5">{text({ en: 'Estimate the landed price.', zh: '快速估算新西兰落地价。' })}</h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground lg:justify-self-end lg:text-right">
            {text({
              en: 'A quick guide to common import, shipping, compliance and service costs before requesting a confirmed quote.',
              zh: '在索取正式报价前，先快速了解常见进口、运输、合规与服务费用。',
            })}
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
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">{text({ en: 'Price Calculator', zh: '价格计算器' })}</h3>
              </div>

              <div className="space-y-5 sm:space-y-6">
                {/* Vehicle Price Input */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-foreground font-bold">
                    <span className="text-primary">●</span>
                    {text({ en: 'Vehicle Price (JPY)', zh: '日本车辆价格（JPY）' })}
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">¥</span>
                    <input
                      type="number"
                      value={vehiclePrice}
                      onChange={(e) => {
                        setVehiclePrice(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      placeholder="3000000"
                      aria-label={text({ en: 'Vehicle price in Japanese yen', zh: '日元车辆价格' })}
                      className="w-full rounded-xl border border-black/12 bg-[#fbf8f2] py-3.5 pl-11 pr-4 text-base font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:py-4 sm:pl-12 sm:pr-6 sm:text-lg"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {text({ en: 'Enter the source-market price in Japanese yen', zh: '请输入日本车源页面显示的日元价格' })}
                  </p>
                </div>

                {/* Exchange Rate Input */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-foreground font-bold">
                    <span className="text-primary">●</span>
                    {text({ en: 'Exchange Rate (NZD to JPY)', zh: '参考汇率（NZD 兑 JPY）' })}
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      value={exchangeRate}
                      placeholder="91.50"
                      readOnly
                      aria-label={text({ en: 'Reference exchange rate from New Zealand dollars to Japanese yen', zh: '纽币兑日元参考汇率' })}
                      className="w-full rounded-xl border border-black/12 bg-[#fbf8f2] py-3.5 pl-11 pr-4 text-base font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:py-4 sm:pl-12 sm:pr-6 sm:text-lg"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {rateStatus === 'loading'
                      ? text({ en: 'Updating today’s reference rate…', zh: '正在更新今日参考汇率…' })
                      : rateStatus === 'fallback'
                        ? text({ en: `Reference rate: 1 NZD = ${exchangeRate} JPY`, zh: `备用参考汇率：1 NZD = ${exchangeRate} JPY` })
                        : text({ en: `Today's reference rate${rateDate ? ` (${rateDate})` : ''}: 1 NZD = ${exchangeRate} JPY`, zh: `今日参考汇率${rateDate ? `（${rateDate}）` : ''}：1 NZD = ${exchangeRate} JPY` })}
                  </p>
                </div>

                {validationError ? (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {validationError}
                  </p>
                ) : null}

                {/* Calculate Button */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:pt-4">
                  <button
                    type="button"
                    onClick={calculatePrice}
                    className="button-primary group relative flex-1 overflow-hidden text-base sm:text-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      <Calculator className="w-5 h-5" />
                      {text({ en: 'Calculate', zh: '开始计算' })}
                    </span>
                  </button>
                  
                  {landedPrice !== null && (
                    <button
                      type="button"
                      onClick={resetCalculator}
                      className="button-secondary px-6 text-base sm:text-lg"
                    >
                      {text({ en: 'Reset', zh: '重新输入' })}
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
                    {text({ en: 'Enter the vehicle price to see an estimated landed cost.', zh: '输入车辆价格后，即可查看预计落地费用。' })}
                  </p>
                </div>
              </div>
            ) : (
                <div className="section-card animate-fadeIn p-5 sm:p-7 md:p-9">
                <div className="space-y-5 sm:space-y-6">
                  {/* Main Result */}
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-1">
                    <div className="rounded-lg bg-white/80 p-5 text-center sm:p-6">
                      <p className="text-muted-foreground mb-2 font-semibold">{text({ en: 'Estimated Landed Price', zh: '预计新西兰落地价' })}</p>
                      <p className="mb-2 text-4xl font-bold text-primary sm:text-5xl">
                        {formatCurrency(breakdown.total, 'NZD').split(' ')[0]}
                      </p>
                      <p className="text-sm text-muted-foreground">{text({ en: 'New Zealand dollars', zh: '纽币（NZD）' })}</p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                      <span className="text-primary">●</span>
                      {text({ en: 'Cost Breakdown', zh: '费用明细' })}
                    </h4>
                    
                    <div className="space-y-3 rounded-xl border border-black/10 bg-white/60 p-4 backdrop-blur-sm sm:p-5">
                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">{text({ en: 'Vehicle Price (JPY)', zh: '日本车辆价格（JPY）' })}</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(parseFloat(vehiclePrice), 'JPY')}</span>
                      </div>
                      
                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">{text({ en: 'Japan-side base allowance', zh: '日本端基础费用预留' })}</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(100000, 'JPY')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">{text({ en: 'Vehicle subtotal in NZD', zh: '车辆纽币换算小计' })}</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.basePriceNZD, 'NZD')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">{text({ en: '15% import cost allowance', zh: '15% 进口费用预留' })}</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.import15Percent, 'NZD')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">
                          {text({ en: 'Processing allowance', zh: '办理费用预留' })}
                          <span className="block text-xs">{text({ en: 'Shipping + compliance + administration', zh: '运输 + 合规 + 行政办理' })}</span>
                        </span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.fixedFees, 'NZD')}</span>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3">
                        <span className="text-sm text-muted-foreground sm:text-base">{text({ en: 'Service allowance (5%)', zh: '服务费用预留（5%）' })}</span>
                        <span className="text-right font-semibold text-foreground">{formatCurrency(breakdown.final5Percent, 'NZD')}</span>
                      </div>

                      <div className="-mx-4 -mb-4 flex items-start justify-between gap-4 rounded-b-xl bg-primary/8 px-4 pb-4 pt-3 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5">
                        <span className="text-base font-bold text-foreground sm:text-lg">{text({ en: 'Estimated landed total', zh: '预计落地总价' })}</span>
                        <span className="text-right text-xl font-bold text-primary sm:text-2xl">{formatCurrency(breakdown.total, 'NZD').split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 leading-relaxed">
                      <strong>{text({ en: 'Estimate only:', zh: '仅供估算：' })}</strong>{' '}
                      {text({
                        en: 'This is not a quote. Final costs depend on the vehicle, exchange rate, shipping, compliance requirements and market conditions.',
                        zh: '该结果不构成正式报价。最终费用取决于具体车辆、汇率、运输、合规要求及市场情况。',
                      })}
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
