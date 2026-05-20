import { Hero } from '../components/Hero';
import { TrustSection } from '../components/TrustSection';
import { PricingBreakdown } from '../components/PricingBreakdown';
import { PriceCalculator } from '../components/PriceCalculator';
import { ImportVsLocal } from '../components/ImportVsLocal';
import { ImportProcessSection } from '../components/ImportProcessSection';
import { SocialProof } from '../components/SocialProof';
import { QuoteFormSection } from '../components/QuoteFormSection';

export function Home() {
  return (
    <>
      <Hero />
      <TrustSection />
      <PricingBreakdown />
      <div id="calculator">
        <PriceCalculator />
      </div>
      <ImportVsLocal />
      <ImportProcessSection />
      <SocialProof />
      <div id="quote">
        <QuoteFormSection />
      </div>
    </>
  );
}
