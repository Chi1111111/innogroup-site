import { MapPin, CheckCircle, Search, type LucideIcon } from 'lucide-react';
import { aboutAuctionYardImage } from './pic';

/**
 * About section statistics.
 */
export interface StatItem {
  icon: LucideIcon;
  value: string;
  label: string;
}

export const stats: StatItem[] = [
  {
    icon: MapPin,
    value: '500+',
    label: 'Cars Imported from Japan',
  },
  {
    icon: CheckCircle,
    value: '100%',
    label: 'NZ Compliance Guaranteed',
  },
  {
    icon: Search,
    value: 'Tailored',
    label: 'Vehicle Selection Support',
  },
];

/**
 * Company intro copy.
 */
export const aboutContent = {
  title: 'Why Choose INNO GROUP?',
  subtitle: 'Your trusted partner in tailored automotive sourcing',
  description: `Founded in Auckland, INNO GROUP has built a reputation as New Zealand's automotive import specialist. We source high-quality vehicles directly from Japanese auctions and certified dealers, ensuring every car meets stringent safety and quality standards.

Our transparent process helps buyers choose the model, grade, and specification that actually suits their needs. Whether you're looking for a fuel-efficient sedan, a spacious SUV, or a luxury sports car, we make the import process simple and stress-free.`,
  imageUrl: aboutAuctionYardImage,
  imageAlt: 'Japan Automotive Business',
};
