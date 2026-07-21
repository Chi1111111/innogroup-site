import { ArrowRight, Calculator, HandCoins } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../components/SiteTranslator';

export function Finance() {
  const { text } = useLanguage();
  const [vehiclePrice, setVehiclePrice] = useState(30000);
  const [deposit, setDeposit] = useState(5000);
  const [term, setTerm] = useState(48);
  const principal = Math.max(0, vehiclePrice - deposit);
  const monthlyRate = 0.0799 / 12;
  const monthlyPayment = principal === 0
    ? 0
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1);
  const weeklyPayment = monthlyPayment * 12 / 52;

  return (
    <div className="pt-20">
      <section className="bg-[#101113] px-4 py-20 text-white sm:py-28">
        <div className="section-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Vehicle Finance</p>
            <h1 className="mt-6 text-white">
              {text({ en: 'Understand the weekly cost before you apply.', zh: '申请之前，先了解大概每周需要还多少。' })}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              {text({
                en: 'Estimate a possible repayment, then contact Inno Group to discuss your vehicle, budget and next steps.',
                zh: '先估算可能的还款金额，再联系 Inno Group 沟通车型、预算和下一步。',
              })}
            </p>
          </div>

          <Link
            to="/contact?type=finance#quote"
            className="group rounded-2xl border border-white/12 bg-white/[0.06] p-7 backdrop-blur-sm hover:border-primary/45 hover:bg-white/[0.09] sm:p-9"
          >
            <HandCoins className="h-8 w-8 text-primary" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {text({ en: 'Finance enquiry', zh: '贷款咨询' })}
            </p>
            <h2 className="mt-3 text-3xl text-white">
              {text({ en: 'Talk to Inno first.', zh: '先联系我们。' })}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/60">
              {text({
                en: 'Send us your contact details and approximate vehicle budget. We will help you understand the next step.',
                zh: '提供联系方式和大概车辆预算，我们会协助你了解下一步。',
              })}
            </p>
            <span className="mt-7 inline-flex items-center gap-2 font-bold text-white">
              {text({ en: 'Contact us', zh: '联系我们' })}
              <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="section-kicker">
              <Calculator className="h-4 w-4" />
              {text({ en: 'Repayment estimator', zh: '还款估算器' })}
            </p>
            <h2 className="mt-5">{text({ en: 'Get a rough weekly figure.', zh: '先得到一个大概的每周金额。' })}</h2>
            <p className="mt-5 leading-8">
              {text({
                en: 'This example uses a 7.99% p.a. illustrative rate. Actual rate, fees, terms and approval depend on lender assessment.',
                zh: '此示例按 7.99% 年利率估算。实际利率、费用、期限与审批结果取决于贷款方评估。',
              })}
            </p>
          </div>

          <div className="section-card p-7 sm:p-10">
            <div className="space-y-7">
              <label className="block">
                <span className="flex justify-between font-bold">
                  <span>{text({ en: 'Vehicle price', zh: '车辆价格' })}</span>
                  <span>${vehiclePrice.toLocaleString()}</span>
                </span>
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="1000"
                  value={vehiclePrice}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setVehiclePrice(next);
                    setDeposit((current) => Math.min(current, next / 2));
                  }}
                  className="mt-4 w-full accent-[#c7a24a]"
                />
              </label>

              <label className="block">
                <span className="flex justify-between font-bold">
                  <span>{text({ en: 'Deposit', zh: '首付' })}</span>
                  <span>${deposit.toLocaleString()}</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max={vehiclePrice / 2}
                  step="500"
                  value={deposit}
                  onChange={(event) => setDeposit(Number(event.target.value))}
                  className="mt-4 w-full accent-[#c7a24a]"
                />
              </label>

              <div>
                <p className="font-bold text-foreground">{text({ en: 'Term', zh: '贷款周期' })}</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[24, 36, 48, 60].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTerm(value)}
                      className={`rounded-xl border px-3 py-3 text-sm ${
                        term === value ? 'border-primary bg-primary text-[#101113]' : 'border-black/10 bg-white'
                      }`}
                    >
                      {value}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[#111214] p-6 text-center text-white">
                <p className="text-sm text-white/55">{text({ en: 'Illustrative weekly payment', zh: '示例每周还款' })}</p>
                <p className="mt-2 text-4xl font-bold text-white">${weeklyPayment.toFixed(2)}</p>
                <p className="mt-3 text-xs text-white/45">{text({ en: 'Example only — not an offer of finance.', zh: '仅供示例参考，不构成贷款要约。' })}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/8 bg-white/55 px-4 py-16 sm:py-24">
        <div className="section-shell">
          <div className="section-card grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {text({ en: 'Next step', zh: '下一步' })}
              </p>
              <h2 className="mt-4">{text({ en: 'Ready to discuss finance?', zh: '准备了解贷款方案？' })}</h2>
              <p className="mt-4 max-w-2xl">
                {text({
                  en: 'Contact Inno Group with your vehicle and budget details. We will help you begin the enquiry.',
                  zh: '把车型和预算信息告诉 Inno Group，我们会协助你开始咨询。',
                })}
              </p>
            </div>
            <Link to="/contact?type=finance#quote" className="button-primary group">
              {text({ en: 'Contact us', zh: '联系我们' })}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
