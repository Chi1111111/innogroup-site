export const bawM8SpecSheet = {
  title: 'BAW M8 EV Specification - LHD General Version 202511',
  href: '/specs/baw-m8-ev-specification-lhd-general-version-202511.xlsx',
} as const;

export const bawM8Images = {
  hero: '/images/baw-m8/baw-m8-hero-left-75.jpg',
  overhead: '/images/baw-m8/baw-m8-overhead-grey.jpg',
  right45: '/images/baw-m8/baw-m8-right-45-grey.jpg',
  frontLeft: '/images/baw-m8/baw-m8-front-left-60.jpg',
  interior: '/images/baw-m8/baw-m8-main-interior.jpg',
  nightInterior: '/images/baw-m8/baw-m8-night-interior.jpg',
  grille: '/images/baw-m8/baw-m8-front-grille.jpg',
  tailLight: '/images/baw-m8/baw-m8-tail-light.jpg',
  detail: '/images/baw-m8/baw-m8-detail.jpg',
  layout7: '/images/baw-m8/baw-m8-cabin-layout-1.jpg',
  layout7Comfort: '/images/baw-m8/baw-m8-cabin-layout-2.jpg',
  layout9: '/images/baw-m8/baw-m8-cabin-layout-9-seat.jpg',
  layoutCabin: '/images/baw-m8/baw-m8-cabin-layout-3.jpg',
  motor: '/images/baw-m8/baw-m8-motor.jpg',
  thermal: '/images/baw-m8/baw-m8-thermal-management.jpg',
  frame: '/images/baw-m8/baw-m8-frame.jpg',
  reevChassis: '/images/baw-m8/baw-m8-reev-chassis.jpg',
} as const;

export const bawM8Colours = [
  { name: 'White', image: '/images/baw-m8/baw-m8-color-white.jpg' },
  { name: 'Grey', image: '/images/baw-m8/baw-m8-color-grey.jpg' },
  { name: 'Black', image: '/images/baw-m8/baw-m8-color-black.jpg' },
  { name: 'Black / White', image: '/images/baw-m8/baw-m8-color-black-white.jpg' },
  { name: 'Cyan', image: '/images/baw-m8/baw-m8-color-cyan.jpg' },
  { name: 'Silver / Cyan', image: '/images/baw-m8/baw-m8-color-silver-cyan.jpg' },
  { name: 'Silver / Green', image: '/images/baw-m8/baw-m8-color-silver-green.jpg' },
] as const;

export const bawM8TechnicalSpecs = [
  { label: 'Source specification', value: 'M8 EV 505km Left-hand Drive - General Version' },
  { label: 'Body format', value: 'Full-size MPV' },
  { label: 'Dimensions', value: '5317 x 1870 x 1955 mm' },
  { label: 'Wheelbase', value: '3200 mm' },
  { label: 'Seating', value: '7 seats 2+2+3 / 9-seat light passenger 2+2+2+3' },
  { label: 'Battery', value: '81 kWh lithium iron phosphate, EVE supplier' },
  { label: 'Pure electric range', value: '505 km CLTC' },
  { label: 'Charging method', value: 'European Standard, AC slow charging and DC fast charging listed' },
  { label: 'Motor', value: '70 kW rated power, 310 Nm torque' },
  { label: 'Maximum speed', value: '150 km/h' },
  { label: 'Suspension', value: 'Macpherson front, multi-link independent rear' },
  { label: 'Tyres', value: '225/55 R18' },
] as const;

export const bawM8Versions = [
  {
    id: 'premium-7',
    version: 'M8 EV Premium 7-Seater',
    seating: '7 seats, 2+2+3',
    code: 'ME125-45',
    powertrain: 'EV',
    indicativePrice: 'NZ$62,999',
    bestFor: 'Large families and private use.',
    keyFeatures:
      '81 kWh LFP battery, 505 km CLTC range, leather seats, manual sliding doors, 14.6-inch centre screen, 8-speaker audio.',
    stats: [
      ['Range', '505 km CLTC'],
      ['Battery', '81 kWh LFP'],
      ['Doors', 'Manual sliding'],
      ['Audio', '8 speakers'],
    ],
    equipment: [
      'Leather seats',
      'Manual front seats',
      'Manual sliding doors',
      '14.6-inch full HD centre screen',
      '10.25-inch full LCD instrument cluster',
      'Rear camera',
      'Rear air conditioning',
      'Wireless charging',
    ],
    status: 'Available for direct import quote, subject to final supplier confirmation.',
  },
  {
    id: 'premium-9',
    version: 'M8 EV Premium 9-Seater',
    seating: '9-seat light passenger, 2+2+2+3',
    code: 'ME125-46',
    powertrain: 'EV',
    indicativePrice: 'NZ$64,999',
    bestFor: 'Shuttle, tourism and commercial passenger transport.',
    keyFeatures:
      '9-seat light passenger layout, rear air conditioning, 14.6-inch centre screen, multiple USB ports, 505 km CLTC EV specification.',
    stats: [
      ['Range', '505 km CLTC'],
      ['Battery', '81 kWh LFP'],
      ['Seats', '9-seat layout'],
      ['Use case', 'Shuttle / tourism'],
    ],
    equipment: [
      '9-seat light passenger layout',
      'Third-row independent light commercial vehicle seats',
      'Rear light commercial vehicle seats',
      '14.6-inch full HD centre screen',
      '10.25-inch full LCD instrument cluster',
      'Rear camera',
      'Rear air conditioning',
      'Multiple USB-C and USB-A ports',
    ],
    status: 'Suitable for business enquiry, subject to compliance and final configuration checks.',
  },
  {
    id: 'flagship-7',
    version: 'M8 EV Flagship 7-Seater',
    seating: '7 seats, 2+2+3',
    code: 'ME125-47',
    powertrain: 'EV',
    indicativePrice: 'NZ$66,999',
    bestFor: 'Buyers wanting higher comfort and technology features.',
    keyFeatures:
      'Electric sliding doors, powered and ventilated front seats, powered second-row seats, 11-speaker premium audio, 360-degree surround view and driver assistance features.',
    stats: [
      ['Range', '505 km CLTC'],
      ['Battery', '81 kWh LFP'],
      ['Doors', 'Electric sliding'],
      ['Camera', '360-degree view'],
    ],
    equipment: [
      'Dual-side electric sliding doors',
      'Electric front seats',
      'Front seat ventilation and heating',
      'Second-row power adjustment',
      'Second-row ventilation, heating, massage and leg rest',
      '11-speaker premium audio with 600W amplifier',
      '360-degree surround view',
      'Adaptive cruise and driver assistance features listed in source file',
    ],
    status: 'Higher-spec enquiry option, subject to final availability and landed quote.',
  },
] as const;

export const bawM8Highlights = [
  {
    title: '7/9-Seater Layout',
    description: 'Spacious seating options for family, business and shuttle use.',
  },
  {
    title: 'New-Energy Powertrain',
    description: 'EV specification confirmed from the supplied file; REEV options depend on final market availability.',
  },
  {
    title: 'Full-Size MPV Space',
    description: '5317 mm length and 3200 mm wheelbase support multi-passenger comfort and practical luggage needs.',
  },
  {
    title: 'Direct Import Support',
    description: 'From sourcing and export to shipping, compliance guidance and delivery in New Zealand.',
  },
  {
    title: 'Business Ready',
    description: 'Suitable for airport transfer, hotel shuttle, tourism and fleet enquiries.',
  },
  {
    title: 'Indicative Low-$60k Landed Cost',
    description:
      'Final price depends on specification, exchange rate, shipping, GST, compliance and registration.',
  },
] as const;
