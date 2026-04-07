import {
  bmw5SeriesImage,
  caseHondaOdysseyImage,
  caseMazdaCx5Image,
  caseSubaruOutbackImage,
  lexusRx450hImage,
  toyotaHarrierImage,
} from './pic';

export const caseStudiesContent = {
  badge: 'Detailed Success Stories',
  title: 'Real Stories from Happy Clients',
  subtitle: 'Discover how our clients got their dream cars through our transparent import process',
  ctaTitle: 'Ready to Write Your Own Success Story?',
  ctaSubtitle: 'Tell us what you want and we will help source the right vehicle from Japan',
  ctaPrimaryButton: 'Start Your Search',
  ctaSecondaryButton: 'Get Your Quote',
};

export interface CaseStudy {
  model: string;
  year: string;
  mileage: string;
  specs: string[];
  timeline: string;
  condition: string;
  customerName: string;
  location: string;
  testimonial: string;
  rating: number;
  image: string;
}

export const detailedCases: CaseStudy[] = [
  {
    model: 'BMW 5 Series 530i M Sport',
    year: '2020',
    mileage: '45,000 km',
    specs: [
      '2.0L Turbo Engine',
      'M Sport Package',
      'Full Leather Interior',
      'Panoramic Sunroof',
      'Harman Kardon Sound',
      'Adaptive Cruise Control',
    ],
    timeline: '8 weeks from auction to delivery',
    condition: '4.5/5 Auction Grade',
    customerName: 'Michael Chen',
    location: 'Auckland',
    testimonial:
      "I was skeptical about importing at first, but INNO GROUP made the entire process seamless. They sent me detailed photos and inspection reports, kept me updated every step of the way, and the car arrived in perfect condition. Highly recommend their service!",
    rating: 5,
    image: bmw5SeriesImage,
  },
  {
    model: 'Toyota Harrier Premium',
    year: '2021',
    mileage: '28,000 km',
    specs: [
      '2.0L Hybrid Engine',
      'Premium Trim',
      'Leather Seats',
      '360-degree Camera',
      'Power Tailgate',
      'LED Headlights',
    ],
    timeline: '7 weeks from auction to delivery',
    condition: '4.5/5 Auction Grade',
    customerName: 'Sarah Williams',
    location: 'Wellington',
    testimonial:
      "As a first-time buyer, I was nervous about the import process. The team at INNO GROUP walked me through every detail and answered all my questions. The Harrier is absolutely stunning and drives like a dream. Best decision ever!",
    rating: 5,
    image: toyotaHarrierImage,
  },
  {
    model: 'Lexus RX450h F Sport',
    year: '2019',
    mileage: '52,000 km',
    specs: [
      '3.5L V6 Hybrid',
      'F Sport Package',
      'Mark Levinson Sound',
      'Triple-Beam LED',
      'Premium Leather',
      'Heads-Up Display',
    ],
    timeline: '9 weeks from auction to delivery',
    condition: '4.5/5 Auction Grade',
    customerName: 'David Park',
    location: 'Auckland',
    testimonial:
      "I've bought three vehicles from INNO GROUP now. Their service is consistently excellent, and the quality of cars they source is top-notch. This RX450h is in better condition than most certified pre-owned vehicles I've seen at NZ dealerships.",
    rating: 5,
    image: lexusRx450hImage,
  },
  {
    model: 'Mazda CX-5 XD L Package',
    year: '2021',
    mileage: '35,000 km',
    specs: [
      '2.2L Diesel Turbo',
      'XD L Package',
      'BOSE Audio',
      'Power Liftgate',
      'Leather Interior',
      'i-Activsense Safety',
    ],
    timeline: '7 weeks from auction to delivery',
    condition: '4.5/5 Auction Grade',
    customerName: 'Emma Thompson',
    location: 'Christchurch',
    testimonial:
      "INNO GROUP found me the exact spec I wanted. The whole process was transparent, and I felt confident every step of the way. My CX-5 is perfect for our family adventures!",
    rating: 5,
    image: caseMazdaCx5Image,
  },
  {
    model: 'Honda Odyssey Absolute',
    year: '2020',
    mileage: '40,000 km',
    specs: [
      '2.4L i-VTEC',
      'Absolute Package',
      '8-Seater',
      'Power Sliding Doors',
      'Rear Entertainment',
      'Honda Sensing',
    ],
    timeline: '8 weeks from auction to delivery',
    condition: '4.0/5 Auction Grade',
    customerName: 'James Kim',
    location: 'Auckland',
    testimonial:
      "We needed a family vehicle with space for everyone, and the Odyssey was perfect. INNO GROUP helped us get a vehicle in excellent condition. The kids love the rear entertainment system!",
    rating: 5,
    image: caseHondaOdysseyImage,
  },
  {
    model: 'Subaru Outback Touring',
    year: '2021',
    mileage: '30,000 km',
    specs: [
      '2.5L Boxer Engine',
      'Touring Package',
      'EyeSight Technology',
      'Leather Trim',
      'Power Tailgate',
      'Roof Rails',
    ],
    timeline: '7 weeks from auction to delivery',
    condition: '4.5/5 Auction Grade',
    customerName: 'Rachel Lee',
    location: 'Hamilton',
    testimonial:
      "The Outback was exactly what I needed for outdoor adventures. INNO GROUP's team was professional, communicative, and delivered exactly what they promised. Highly recommend!",
    rating: 5,
    image: caseSubaruOutbackImage,
  },
];
