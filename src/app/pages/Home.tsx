import { Hero } from '../components/Hero';
import { TrustSection } from '../components/TrustSection';
import { PricingBreakdown } from '../components/PricingBreakdown';
import { PriceCalculator } from '../components/PriceCalculator';
import { ImportVsLocal } from '../components/ImportVsLocal';
import { RecentDeals } from '../components/RecentDeals';
import { ImportProcessSection } from '../components/ImportProcessSection';
import { SocialProof } from '../components/SocialProof';
import { QuoteFormSection } from '../components/QuoteFormSection';
import { SITE_FEATURES } from '../../config/siteFeatures';

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
      {SITE_FEATURES.stories ? <RecentDeals /> : null}
      <ImportProcessSection />
      <SocialProof />
      <div id="quote">
        <QuoteFormSection />
      </div>
    </>
  );
}
