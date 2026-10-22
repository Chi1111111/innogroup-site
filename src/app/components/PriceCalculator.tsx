import { useEffect, useState } from 'react';
import { Calculator, ChevronDown, TrendingUp, Info } from 'lucide-react';
import { useLanguage } from './SiteTranslator';
import '../../styles/price-calculator.css';

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

    if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) {
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
  };

  const resetCalculator = () => {
    setVehiclePrice('');
    setLandedPrice(null);
    setValidationError('');
  };

  const formatCurrency = (value: number, currency: 'JPY' | 'NZD') => {
    if (currency === 'JPY') {
      return `¥${value.toLocaleString('en-NZ', { maximumFractionDigits: 0 })}`;
    }
    return `$${value.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NZD`;
  };

  const costRows = [
    { label: text({ en: 'Vehicle Price (JPY)', zh: '日本车辆价格（JPY）' }), value: formatCurrency(breakdown.basePrice - 100000, 'JPY') },
    { label: text({ en: 'Japan-side base allowance', zh: '日本端基础费用预留' }), value: formatCurrency(100000, 'JPY') },
    { label: text({ en: 'Vehicle subtotal in NZD', zh: '车辆纽币换算小计' }), value: formatCurrency(breakdown.basePriceNZD, 'NZD') },
    { label: text({ en: '15% import cost allowance', zh: '15% 进口费用预留' }), value: formatCurrency(breakdown.import15Percent, 'NZD') },
    { label: text({ en: 'Processing allowance', zh: '办理费用预留' }), note: text({ en: 'Shipping + compliance + administration', zh: '运输 + 合规 + 行政办理' }), value: formatCurrency(breakdown.fixedFees, 'NZD') },
    { label: text({ en: 'Service allowance (5%)', zh: '服务费用预留（5%）' }), value: formatCurrency(breakdown.final5Percent, 'NZD') },
  ];

  return (
    <section className="price-calculator" aria-labelledby="calculator-title">
      <div className="section-shell">
        <div className="calculator-heading">
          <div>
            <div className="section-kicker"><Calculator size={15} aria-hidden="true" />{text({ en: 'Import Cost Calculator', zh: '进口落地价计算器' })}</div>
            <h2 id="calculator-title">{text({ en: 'Estimate the landed price.', zh: '快速估算新西兰落地价。' })}</h2>
          </div>
          <p>{text({
            en: 'Start with the Japan vehicle price. See an estimate with transport, local and service allowances.',
            zh: '输入日本车辆价格，查看包含运输、本地办理及服务费用预留的落地价估算。',
          })}</p>
        </div>

        <div className="calculator-panel">
          <form className="calculator-form" noValidate onSubmit={(event) => { event.preventDefault(); calculatePrice(); }}>
            <div className="calculator-fields">
              <div className="calculator-field">
                <label htmlFor="calculator-vehicle-price">{text({ en: 'Vehicle Price (JPY)', zh: '日本车辆价格（JPY）' })}</label>
                <div className="calculator-input">
                  <span aria-hidden="true">¥</span>
                  <input
                    id="calculator-vehicle-price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={vehiclePrice}
                    onChange={(event) => {
                      setVehiclePrice(event.target.value);
                      setLandedPrice(null);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="3000000"
                    aria-label={text({ en: 'Vehicle price in Japanese yen', zh: '日元车辆价格' })}
                    aria-invalid={Boolean(validationError)}
                    aria-describedby={validationError ? 'calculator-price-help calculator-error' : 'calculator-price-help'}
                  />
                </div>
                <p id="calculator-price-help">{text({ en: 'Enter the source-market price in Japanese yen.', zh: '请输入日本车源页面显示的日元价格。' })}</p>
              </div>

              <div className="calculator-field">
                <label htmlFor="calculator-exchange-rate">{text({ en: 'Exchange Rate (NZD to JPY)', zh: '参考汇率（NZD 兑 JPY）' })}</label>
                <div className="calculator-input">
                  <TrendingUp size={18} aria-hidden="true" />
                  <input
                    id="calculator-exchange-rate"
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    readOnly
                    aria-label={text({ en: 'Reference exchange rate from New Zealand dollars to Japanese yen', zh: '纽币兑日元参考汇率' })}
                    aria-describedby="calculator-rate-help"
                  />
                </div>
                <p id="calculator-rate-help" aria-live="polite">
                  {rateStatus === 'loading'
                    ? text({ en: 'Updating today’s reference rate…', zh: '正在更新今日参考汇率…' })
                    : rateStatus === 'fallback'
                      ? text({ en: 'Reference rate: 1 NZD = ' + exchangeRate + ' JPY', zh: '备用参考汇率：1 NZD = ' + exchangeRate + ' JPY' })
                      : text({ en: 'Reference rate' + (rateDate ? ' (' + rateDate + ')' : '') + ': 1 NZD = ' + exchangeRate + ' JPY', zh: '参考汇率' + (rateDate ? '（' + rateDate + '）' : '') + '：1 NZD = ' + exchangeRate + ' JPY' })}
                </p>
              </div>

              <div className="calculator-actions">
                <button type="submit" className="button-primary"><Calculator size={18} aria-hidden="true" />{text({ en: 'Calculate', zh: '开始计算' })}</button>
                {landedPrice !== null ? <button type="button" onClick={resetCalculator} className="button-secondary">{text({ en: 'Reset', zh: '重新输入' })}</button> : null}
              </div>
            </div>
            {validationError ? <p id="calculator-error" role="alert" className="calculator-error">{validationError}</p> : null}
          </form>

          {landedPrice !== null ? (
            <div className="calculator-results">
              <div className="calculator-total" role="status" aria-live="polite" aria-atomic="true">
                <span className="calculator-total-icon"><Calculator size={23} aria-hidden="true" /></span>
                <h3>{text({ en: 'Estimated Landed Price', zh: '预计新西兰落地价' })}</h3>
                <p className="calculator-amount">{formatCurrency(landedPrice, 'NZD').split(' ')[0]}</p>
                <p>{text({ en: 'New Zealand dollars · NZD', zh: '纽币 · NZD' })}</p>
              </div>
              <details className="calculator-breakdown" open>
                <summary>{text({ en: 'Cost Breakdown', zh: '费用明细' })}<ChevronDown size={18} aria-hidden="true" /></summary>
                <dl>
                  {costRows.map((row) => <div key={row.label}><dt>{row.label}{row.note ? <small>{row.note}</small> : null}</dt><dd>{row.value}</dd></div>)}
                  <div className="calculator-breakdown-total"><dt>{text({ en: 'Estimated landed total', zh: '预计落地总价' })}</dt><dd>{formatCurrency(landedPrice, 'NZD')}</dd></div>
                </dl>
              </details>
            </div>
          ) : null}

          <p className="calculator-notice"><Info size={16} aria-hidden="true" /><span><strong>{text({ en: 'Estimate only:', zh: '仅供估算：' })}</strong>{' '}{text({
            en: 'This is not a quote. Final costs depend on the vehicle, exchange rate, shipping, compliance requirements and market conditions.',
            zh: '该结果不构成正式报价。最终费用取决于具体车辆、汇率、运输、合规要求及市场情况。',
          })}</span></p>
        </div>
      </div>
    </section>
  );
}
