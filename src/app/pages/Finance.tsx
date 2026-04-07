import { useState } from 'react';
import { CheckCircle, Clock, Shield, ArrowRight, Upload, DollarSign } from 'lucide-react';

export function Finance() {
  const [currentStep, setCurrentStep] = useState(1);
  
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
            Get Approved.<br />
            <span className="text-primary">Drive Sooner.</span>
          </h1>
          <p className="mb-3 text-lg font-light text-gray-400 sm:text-xl md:mb-4 md:text-2xl">
            Simple finance tailored to your situation.
          </p>
          <p className="text-lg text-gray-500">
            No pressure. No obligation.
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
            <h3 className="text-white font-semibold mb-2">Fast Approval</h3>
            <p className="text-sm text-gray-400">Same-day possible</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-500">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-semibold mb-2">Competitive Rates</h3>
            <p className="text-sm text-gray-400">Best NZ rates</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-500">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-semibold mb-2">Trusted Partners</h3>
            <p className="text-sm text-gray-400">Verified lenders</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-all duration-500">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-white font-semibold mb-2">No Obligation</h3>
            <p className="text-sm text-gray-400">Free to apply</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 sm:py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-12 text-center text-3xl font-light text-white animate-fadeIn sm:mb-16 md:mb-20 md:text-5xl">
            How It <span className="text-primary">Works</span>
          </h2>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              { num: '1', title: 'Submit Details', desc: 'Fill out our simple form' },
              { num: '2', title: 'We Match You', desc: 'Connect with best lenders' },
              { num: '3', title: 'Get Approved', desc: 'Fast decision process' },
              { num: '4', title: 'Drive Your Car', desc: 'Hit the road sooner' },
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
              Estimate Your <span className="text-primary">Repayments</span>
            </h2>
            <p className="text-gray-400">Get an idea before you apply</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8 md:p-12">
            <div className="space-y-6 sm:space-y-8">
              {/* Vehicle Price */}
              <div>
                <label className="block text-white mb-3 text-lg">Vehicle Price</label>
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
                <label className="block text-white mb-3 text-lg">Deposit</label>
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
                <label className="block text-white mb-3 text-lg">Term (months)</label>
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
                <p className="text-gray-300 mb-2">Estimated Weekly Payment</p>
                <div className="mb-2 text-4xl font-light text-white sm:text-5xl md:text-6xl">
                  ${calculateWeeklyPayment()}
                </div>
                <p className="text-sm text-gray-400">Based on 7.99% p.a. rate*</p>
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
              Start Your <span className="text-primary">Application</span>
            </h2>
            <p className="text-gray-400">Takes less than 5 minutes</p>
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
            <p className="text-center text-gray-400">Step {currentStep} of 4</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8 md:p-12">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-2xl font-semibold text-white mb-6">Personal Details</h3>
                
                <div>
                  <label className="block text-white mb-2">Full Name</label>
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
                  <label className="block text-white mb-2">Phone</label>
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
                  <label className="block text-white mb-2">Email</label>
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
                <h3 className="text-2xl font-semibold text-white mb-6">Living Situation</h3>
                
                <div>
                  <label className="block text-white mb-2">Residency Status</label>
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
                  <label className="block text-white mb-2">Living Arrangement</label>
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
                  <label className="block text-white mb-2">Number of Dependants</label>
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
                <h3 className="text-2xl font-semibold text-white mb-6">Employment & Income</h3>
                
                <div>
                  <label className="block text-white mb-2">Employment Type</label>
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
                  <label className="block text-white mb-2">Current Employer</label>
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
                  <label className="block text-white mb-2">Annual Income (before tax)</label>
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
                <h3 className="text-2xl font-semibold text-white mb-6">Almost Done</h3>
                
                <div>
                  <label className="block text-white mb-2">Driver Licence (optional)</label>
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-all duration-300 cursor-pointer bg-white/5">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">JPG, PNG or PDF (max 5MB)</p>
                    <input type="file" className="hidden" accept="image/*,.pdf" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">You can also provide this later</p>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-2">What happens next?</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>We&apos;ll review your application within 24 hours.</li>
                    <li>We&apos;ll match you with the most suitable lending options.</li>
                    <li>We&apos;ll contact you to confirm the next steps.</li>
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
                  Back
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-4 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 py-4 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Submit Application
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              No hidden costs. No obligation.
            </p>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mb-6 text-4xl font-light text-white md:text-6xl">
            Ready to Get <span className="text-primary">Started?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join hundreds of satisfied customers who financed with Inno Group
          </p>
          <a
            href="#apply"
            className="inline-flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all duration-500 hover:scale-105 shadow-2xl shadow-primary/20"
          >
            Apply Now
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-gray-500 mt-6">
            No hidden costs. No obligation.
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
