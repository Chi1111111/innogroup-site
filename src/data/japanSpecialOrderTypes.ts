export interface JapanSpecialOrderVehicle {
  slug: string;
  title: string;
  zhTitle: string;
  image: string;
  images?: string[];
  price: string;
  year: string;
  mileage: string;
  location: string;
  status: string;
  summary: string;
  zhSummary: string;
  japanPrice?: string;
  landedEstimate?: string;
  nzMarketRange?: string;
  opportunityScore?: number;
  recommendation?: string;
  zhRecommendation?: string;
  risk?: string;
  zhRisk?: string;
  recommendedFor?: string;
  zhRecommendedFor?: string;
  updatedAt?: string;
  category?: 'price-opportunity' | 'japan-rare' | 'special-model';
  availability?: 'available' | 'sold' | 'paused';
}
