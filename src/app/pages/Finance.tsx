import { useState } from 'react';
import { CheckCircle, Clock, Shield, ArrowRight, Upload, DollarSign, ExternalLink } from 'lucide-react';
import mtfAlbanyLogo from '../../data/pic/partner-mtf-albany.png';
import { useLanguage } from '../components/SiteTranslator';

const mtfAlbanyApplyUrl = 'https://apply.mtf.co.nz/?originatorid=2309&utm_source=Innogroup&utm_medium=introducer%20website&utm_campaign=Innogroup';

export function Finance() {
  const [currentStep, setCurrentStep] = useState(1);
  const { text } = useLanguage();
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    phone: '',
    email: '',
    // Step 2
    residencyStatus: '',
    livingArrangement: '',
    dependants: '',
    // Step 3
    employmentType: '',
    employer: '',
    income: '',
    // Calculator
    vehiclePrice: 30000,
    deposit: 5000,
    term: 48,
  });

  // Calculator
  const calculateWeeklyPayment = () => {
    const principal = formData.vehiclePrice - formData.deposit;
    const monthlyRate = 0.0799 / 12; // 7.99% annual rate
    const months = formData.term;
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return (monthlyPayment * 12 / 52).toFixed(2);
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Application submitted! We\'ll contact you within 24 hours.');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-black pt-20 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:py-20 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fadeIn">
          <h1 className="mb-6 text-4xl font-light tracking-tight text-white sm:text-5xl md:mb-8 md:text-7xl lg:text-8xl">
            {text({ en: 'Get Approved.', zh: '先了解预算。' })}<br />
            <span className="text-primary">{text({ en: 'Drive Sooner.', zh: '再更快上路。' })}</span>
          </h1>
          <p className="mb-3 text-lg font-light text-gray-400 sm:text-xl md:mb-4 md:text-2xl">
            {text({ en: 'Simple finance tailored to your situation.', zh: '根据你的情况了解车辆贷款方向。' })}
          </p>
          <p className="text-lg text-gray-500">
            {text({ en: 'No pressure. No obligation.', zh: '无压力，无强制义务。' })}
          </p>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="animate-fadeIn border-y border-white/10 px-4 py-12 sm:py-16" style={{ animationDelay: '0.2s' }}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-500">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-semibold mb-2">{text({ en: 'Fast Approval', zh: '快速审批' })}</h3>
            <p className="text-sm text-gray-400">{text({ en: 'Same-day possible', zh: '有机会当天获得反馈' })}</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-500">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-semibold mb-2">{text({ en: 'Competitive Rates', zh: '有竞争力利率' })}</h3>
            <p className="text-sm text-gray-400">{text({ en: 'Best NZ rates', zh: '匹配合适贷款渠道' })}</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-500">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-semibold mb-2">{text({ en: 'Trusted Partners', zh: '可信合作方' })}</h3>
            <p className="text-sm text-gray-400">{text({ en: 'Verified lenders', zh: '合作贷款机构支持' })}</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-500">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-semibold mb-2">{text({ en: 'No Obligation', zh: '无强制义务' })}</h3>
            <p className="text-sm text-gray-400">{text({ en: 'Free to apply', zh: '了解方案不等于必须购买' })}</p>
          </div>
        </div>
      </section>

      {/* Finance Partner */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl md:grid-cols-[0.95fr_1.05fr]">
            <a
              href={mtfAlbanyApplyUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Apply for finance with MTF Albany"
              className="flex min-h-64 items-center justify-center bg-white p-8 transition-opacity duration-300 hover:opacity-95 sm:p-10"
            >
              <img
                src={mtfAlbanyLogo}
                alt="MTF Albany"
                className="h-auto w-full max-w-md object-contain"
              />
            </a>
            <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                {text({ en: 'Finance Partner', zh: '贷款合作伙伴' })}
              </p>
              <h2 className="mb-5 text-3xl font-light leading-tight text-white sm:text-4xl md:text-5xl">
                {text({ en: 'Talk to your local money experts at MTF Albany', zh: '对接 MTF Albany 本地贷款团队' })}
              </h2>
              <p className="mb-8 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg">
                {text({
                  en: 'Apply directly with our finance partner and get support from a local team that understands vehicle lending.',
                  zh: '你可以直接通过我们的贷款合作伙伴申请，并获得熟悉车辆贷款的本地团队支持。',
                })}
              </p>
              <a
                href={mtfAlbanyApplyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-3 rounded-xl bg-primary px-6 py-4 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-primary/90"
              >
                {text({ en: 'Apply with MTF Albany', zh: '通过 MTF Albany 申请' })}
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 sm:py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-12 text-center text-3xl font-light text-white animate-fadeIn sm:mb-16 md:mb-20 md:text-5xl">
            {text({ en: 'How It', zh: '流程' })} <span className="text-primary">{text({ en: 'Works', zh: '怎么走' })}</span>
          </h2>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              { num: '1', title: text({ en: 'Submit Details', zh: '提交信息' }), desc: text({ en: 'Fill out our simple form', zh: '填写基本资料和预算' }) },
              { num: '2', title: text({ en: 'We Match You', zh: '匹配方案' }), desc: text({ en: 'Connect with best lenders', zh: '协助对接合适渠道' }) },
              { num: '3', title: text({ en: 'Get Approved', zh: '获得反馈' }), desc: text({ en: 'Fast decision process', zh: '确认可行贷款方向' }) },
              { num: '4', title: text({ en: 'Drive Your Car', zh: '安排提车' }), desc: text({ en: 'Hit the road sooner', zh: '预算清晰后再选车' }) },
            ].map((step, idx) => (
              <div key={idx} className="text-center group animate-scaleIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full border-2 border-primary/30 bg-primary/5 flex items-center justify-center text-3xl font-light text-primary group-hover:bg-primary/10 group-hover:border-primary/50 transition-all duration-500">
                    {step.num}
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Finance Calculator */}
      <section className="bg-gradient-to-b from-transparent via-primary/5 to-transparent px-4 py-16 sm:py-20 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-6 text-3xl font-light text-white sm:text-4xl md:text-5xl">
              {text({ en: 'Estimate Your', zh: '估算你的' })} <span className="text-primary">{text({ en: 'Repayments', zh: '每周还款' })}</span>
            </h2>
            <p className="text-gray-400">{text({ en: 'Get an idea before you apply', zh: '申请前先有一个大概概念' })}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8 md:p-12">
            <div className="space-y-6 sm:space-y-8">
              {/* Vehicle Price */}
              <div>
                <label className="block text-white mb-3 text-lg">{text({ en: 'Vehicle Price', zh: '车辆价格' })}</label>
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="1000"
                  value={formData.vehiclePrice}
                  onChange={(e) => setFormData({ ...formData, vehiclePrice: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
                />
                <div className="mt-2 text-right text-2xl font-light text-primary sm:text-3xl">
                  ${formData.vehiclePrice.toLocaleString()}
                </div>
              </div>

              {/* Deposit */}
              <div>
                <label className="block text-white mb-3 text-lg">{text({ en: 'Deposit', zh: '首付' })}</label>
                <input
                  type="range"
                  min="0"
                  max={formData.vehiclePrice / 2}
                  step="500"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
                />
                <div className="mt-2 text-right text-2xl font-light text-primary sm:text-3xl">
                  ${formData.deposit.toLocaleString()}
                </div>
              </div>

              {/* Term */}
              <div>
                <label className="block text-white mb-3 text-lg">{text({ en: 'Term (months)', zh: '贷款周期（月）' })}</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[24, 36, 48, 60].map((term) => (
                    <button
                      key={term}
                      onClick={() => setFormData({ ...formData, term })}
                      className={`py-3 rounded-xl font-semibold transition-all duration-300 ${
                        formData.term === term
                          ? 'bg-primary text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/20 to-yellow-500/20 p-5 text-center sm:p-8">
                <p className="text-gray-300 mb-2">{text({ en: 'Estimated Weekly Payment', zh: '预计每周还款' })}</p>
                <div className="mb-2 text-4xl font-light text-white sm:text-5xl md:text-6xl">
                  ${calculateWeeklyPayment()}
                </div>
                <p className="text-sm text-gray-400">{text({ en: 'Based on 7.99% p.a. rate*', zh: '按 7.99% p.a. 示例利率估算*' })}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Step Application Form */}
      <section className="px-4 py-16 sm:py-20 md:py-24" id="apply">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-6 text-3xl font-light text-white sm:text-4xl md:text-5xl">
              {text({ en: 'Start Your', zh: '开始你的' })} <span className="text-primary">{text({ en: 'Application', zh: '申请' })}</span>
            </h2>
            <p className="text-gray-400">{text({ en: 'Takes less than 5 minutes', zh: '通常 5 分钟内可完成' })}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-10 sm:mb-12">
            <div className="mb-4 flex justify-between gap-2 sm:gap-0">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex min-w-0 flex-1 items-center justify-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold transition-all duration-500 sm:h-10 sm:w-10 ${
                      step <= currentStep
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`mx-2 h-1 w-full max-w-12 transition-all duration-500 sm:max-w-16 md:max-w-24 ${
                        step < currentStep ? 'bg-primary' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400">{text({ en: `Step ${currentStep} of 4`, zh: `第 ${currentStep} 步，共 4 步` })}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8 md:p-12">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-2xl font-semibold text-white mb-6">{text({ en: 'Personal Details', zh: '个人信息' })}</h3>
                
                <div>
                  <label className="block text-white mb-2">{text({ en: 'Full Name', zh: '姓名' })}</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">{text({ en: 'Phone', zh: '电话' })}</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                    placeholder="021 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">{text({ en: 'Email', zh: '邮箱' })}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Living Situation */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-2xl font-semibold text-white mb-6">{text({ en: 'Living Situation', zh: '居住情况' })}</h3>
                
                <div>
                  <label className="block text-white mb-2">{text({ en: 'Residency Status', zh: '身份状态' })}</label>
                  <select
                    required
                    value={formData.residencyStatus}
                    onChange={(e) => setFormData({ ...formData, residencyStatus: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                  >
                    <option value="" className="bg-black">Select...</option>
                    <option value="citizen" className="bg-black">NZ Citizen</option>
                    <option value="resident" className="bg-black">Permanent Resident</option>
                    <option value="work-visa" className="bg-black">Work Visa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">{text({ en: 'Living Arrangement', zh: '居住安排' })}</label>
                  <select
                    required
                    value={formData.livingArrangement}
                    onChange={(e) => setFormData({ ...formData, livingArrangement: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                  >
                    <option value="" className="bg-black">Select...</option>
                    <option value="own" className="bg-black">Own Home</option>
                    <option value="mortgage" className="bg-black">Mortgage</option>
                    <option value="rent" className="bg-black">Renting</option>
                    <option value="family" className="bg-black">Living with Family</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">{text({ en: 'Number of Dependants', zh: '抚养人数' })}</label>
                  <select
                    required
                    value={formData.dependants}
                    onChange={(e) => setFormData({ ...formData, dependants: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                  >
                    <option value="" className="bg-black">Select...</option>
                    <option value="0" className="bg-black">None</option>
                    <option value="1" className="bg-black">1</option>
                    <option value="2" className="bg-black">2</option>
                    <option value="3+" className="bg-black">3+</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Employment & Income */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-2xl font-semibold text-white mb-6">{text({ en: 'Employment & Income', zh: '工作与收入' })}</h3>
                
                <div>
                  <label className="block text-white mb-2">{text({ en: 'Employment Type', zh: '工作类型' })}</label>
                  <select
                    required
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                  >
                    <option value="" className="bg-black">Select...</option>
                    <option value="full-time" className="bg-black">Full-Time</option>
                    <option value="part-time" className="bg-black">Part-Time</option>
                    <option value="self-employed" className="bg-black">Self-Employed</option>
                    <option value="contractor" className="bg-black">Contractor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white mb-2">{text({ en: 'Current Employer', zh: '当前雇主' })}</label>
                  <input
                    type="text"
                    required
                    value={formData.employer}
                    onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">{text({ en: 'Annual Income (before tax)', zh: '税前年收入' })}</label>
                  <input
                    type="text"
                    required
                    value={formData.income}
                    onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/15 transition-all duration-300"
                    placeholder="$50,000"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Final */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-2xl font-semibold text-white mb-6">{text({ en: 'Almost Done', zh: '即将完成' })}</h3>
                
                <div>
                  <label className="block text-white mb-2">{text({ en: 'Driver Licence (optional)', zh: '驾照（可稍后提供）' })}</label>
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-all duration-300 cursor-pointer bg-white/5">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">{text({ en: 'Click to upload or drag and drop', zh: '点击上传或拖拽文件' })}</p>
                    <p className="text-sm text-gray-500">{text({ en: 'JPG, PNG or PDF (max 5MB)', zh: '支持 JPG、PNG 或 PDF（最大 5MB）' })}</p>
                    <input type="file" className="hidden" accept="image/*,.pdf" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{text({ en: 'You can also provide this later', zh: '也可以之后再提供' })}</p>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-2">{text({ en: 'What happens next?', zh: '接下来会发生什么？' })}</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>{text({ en: "We'll review your application within 24 hours.", zh: '我们会在 24 小时内查看你的申请。' })}</li>
                    <li>{text({ en: "We'll match you with the most suitable lending options.", zh: '我们会协助匹配合适的贷款方案。' })}</li>
                    <li>{text({ en: "We'll contact you to confirm the next steps.", zh: '我们会联系你确认下一步。' })}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-4 px-6 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  {text({ en: 'Back', zh: '返回' })}
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-4 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {text({ en: 'Continue', zh: '继续' })}
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {text({ en: 'Submit Application', zh: '提交申请' })}
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              {text({ en: 'No hidden costs. No obligation.', zh: '无隐藏费用。无强制义务。' })}
            </p>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mb-6 text-4xl font-light text-white md:text-6xl">
            {text({ en: 'Ready to Get', zh: '准备好' })} <span className="text-primary">{text({ en: 'Started?', zh: '开始了吗？' })}</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            {text({ en: 'Join hundreds of satisfied customers who financed with Inno Group', zh: '让我们帮你先把预算和贷款方向弄清楚' })}
          </p>
          <a
            href="#apply"
            className="inline-flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all duration-500 hover:scale-105 shadow-2xl shadow-primary/20"
          >
            {text({ en: 'Apply Now', zh: '现在申请' })}
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-gray-500 mt-6">
            {text({ en: 'No hidden costs. No obligation.', zh: '无隐藏费用。无强制义务。' })}
          </p>
        </div>
      </section>

      <style>{`
        input[type="range"].slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #d4af37;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }

        input[type="range"].slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #d4af37;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
