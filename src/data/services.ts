import { Clock, Package, Shield, Wrench, type LucideIcon } from 'lucide-react';
import { partnerJhMotorsImage, partnerVipWheelTyreImage } from './pic';

export interface Service {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}

export const services: Service[] = [
  {
    icon: Wrench,
    eyebrow: 'Body & Paint',
    title: 'Panel Beating and Respray Support',
    description:
      'For dents, bumper scuffs, accident damage, and cosmetic repairs that need a clean finish.',
    bullets: [
      'Scratch, dent, and bumper repair coordination',
      'Color matching and repaint support',
      'Photo-based first assessment before booking',
    ],
  },
  {
    icon: Shield,
    eyebrow: 'Mechanical Care',
    title: 'Repairs, Diagnostics, and Workshop Referrals',
    description:
      'When something feels off, we help route you to the right workshop instead of leaving you to figure it out alone.',
    bullets: [
      'Brake, suspension, cooling, and engine-related repairs',
      'Warning-light and drivability diagnostics',
      'Practical repair options for daily-use vehicles',
    ],
  },
  {
    icon: Package,
    eyebrow: 'Parts Sourcing',
    title: 'OEM, Aftermarket, and Hard-to-Find Parts',
    description:
      'Useful for Japanese models that need the right replacement parts, accessories, or trim pieces.',
    bullets: [
      'Genuine, OEM, and aftermarket parts options',
      'Japanese model parts sourcing assistance',
      'Fitment coordination with our service partners',
    ],
  },
  {
    icon: Clock,
    eyebrow: 'Owner Support',
    title: 'Routine Servicing and Maintenance Planning',
    description:
      'Help with ongoing ownership needs so the car stays tidy, reliable, and ready for the road.',
    bullets: [
      'Regular servicing and maintenance referrals',
      'Pre-WOF and seasonal check preparation',
      'Practical support after purchase and handover',
    ],
  },
];

export interface PartnerPlaceholder {
  id: string;
  name: string;
  address: string;
  website?: string;
  email?: string;
  phone?: string;
  hours?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoWordmark?: {
    line1: string;
    line2?: string;
  };
  logoPanel?: 'dark' | 'light';
  logoFit?: 'contain' | 'cover';
}

export const partnerPlaceholders: PartnerPlaceholder[] = [
  {
    id: 'partner-01',
    name: 'V.I.P Wheel & Tyre',
    address: '241 Glenfield Rd, Hillcrest (next to the Z petrol station)',
    website: 'https://www.vipwheel.co.nz/',
    email: 'viptyreshop@gmail.com',
    phone: '09 212 9889',
    hours: 'Mon - Fri: 8:30am - 5:00pm',
    logoSrc: partnerVipWheelTyreImage,
    logoAlt: 'V.I.P Wheel & Tyre',
    logoPanel: 'dark',
    logoFit: 'contain',
  },
  {
    id: 'partner-02',
    name: 'JH Motors',
    address: '80 Diana Drive, Wairau Valley, Auckland 0627, New Zealand',
    website: 'https://jhmotors.co.nz/vehicle-inspections/',
    email: 'jhmotors80@gmail.com',
    phone: '(09) 440 9985',
    hours: 'Mon to Sat 9am - 5:30pm',
    logoSrc: partnerJhMotorsImage,
    logoAlt: 'JH Motors',
    logoPanel: 'light',
    logoFit: 'contain',
  },
  {
    id: 'partner-03',
    name: 'North Harbour Compliance',
    address: '2D Ashfield Road, Wairau Valley, Auckland 0627',
    phone: '09 444 0014',
    logoWordmark: {
      line1: 'North Harbour',
      line2: 'Compliance',
    },
    logoPanel: 'dark',
  },
  {
    id: 'partner-04',
    name: 'GYP Auto Detailing',
    address: 'Target Road, Wairau Valley, Auckland 0627',
    phone: '021 389 818',
    logoWordmark: {
      line1: 'GYP Auto',
      line2: 'Detailing',
    },
    logoPanel: 'dark',
  },
];
