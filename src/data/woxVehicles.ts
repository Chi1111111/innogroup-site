export type WoxVehicle = {
  slug: 'wox-air' | 'wox-nebula' | 'wox-shera' | 'wox-zeny';
  modelCode: string;
  name: string;
  subtitle: string;
  summary: string;
  priceFrom: string;
  href: string;
  heroImage: string;
  tags: string[];
  quickSpecs: Array<[string, string]>;
  gallery: Array<{ title: string; image: string }>;
  versions: Array<{
    id: string;
    name: string;
    price: string;
    image: string;
    bestFor: string;
    stats: Array<[string, string]>;
    notes: string[];
    detailSpecs: Array<{ label: string; value: string }>;
  }>;
  specs: Array<{ label: string; value: string }>;
  highlights: Array<{ title: string; description: string }>;
  confirmationItems: string[];
  quoteNote: string;
};

export const woxVehicles = [
  {
    slug: 'wox-air',
    modelCode: 'WOX AIR',
    name: 'WOX AIR Electric Sedan',
    subtitle: '5-seat electric sedan with 355-430 km WLTP range',
    summary:
      'A sleek 5-door electric sedan with LFP battery options, fast charging and refined everyday usability.',
    priceFrom: 'NZ$48,500',
    href: '/vehicles/china/wox-air',
    heroImage: '/images/wox-air/air-front-car.jpg',
    tags: ['5-seat sedan', '51 / 64 kWh LFP', '355-430 km WLTP'],
    quickSpecs: [
      ['Body', '5-door sedan'],
      ['Range', '355-430 km WLTP'],
      ['Battery', '51 / 64 kWh LFP'],
      ['Drive', 'RWD'],
    ],
    gallery: [
      { title: 'Front angle', image: '/images/wox-air/air-front-car.jpg' },
      { title: 'Cabin', image: '/images/wox-air/air-interior-car.jpg' },
      { title: 'Rear angle', image: '/images/wox-air/air-rear-car.jpg' },
    ],
    versions: [
      {
        id: 'standard-51',
        name: 'WOX AIR Standard 51 kWh',
        price: 'NZ$48,500',
        image: '/images/wox-air/air-front-car.jpg',
        bestFor: 'Urban and daily commuting use.',
        stats: [
          ['Range', '355 km WLTP'],
          ['Battery', '51 kWh LFP'],
          ['Power', '150 kW'],
          ['Fast charge', '30 min 30-80%'],
        ],
        notes: ['250 Nm torque', '170 km/h maximum speed', '70 kW max DC charging', '11 kW AC onboard charger'],
        detailSpecs: [
          { label: 'Battery capacity', value: '51 kWh' },
          { label: 'WLTP range', value: '355 km combined' },
          { label: 'Maximum power', value: '150 kW' },
          { label: 'Maximum torque', value: '250 Nm' },
          { label: 'Maximum speed', value: '170 km/h' },
          { label: '0-100 km/h', value: '< 7.9 s' },
          { label: 'Battery type', value: 'LFP' },
          { label: 'Drive type', value: 'RWD' },
          { label: 'Max DC charging power', value: '70 kW' },
          { label: 'Fast charging 30-80%', value: '30 min' },
          { label: 'AC charging 10-100%', value: '5.3 h' },
          { label: 'On-board charger', value: '11 kW AC' },
        ],
      },
      {
        id: 'long-range-64',
        name: 'WOX AIR Long Range 64 kWh',
        price: 'NZ$53,500',
        image: '/images/wox-air/air-rear-car.jpg',
        bestFor: 'Buyers wanting longer-distance electric sedan usability.',
        stats: [
          ['Range', '430 km WLTP'],
          ['Battery', '64 kWh LFP'],
          ['Power', '160 kW'],
          ['Fast charge', '21 min 30-80%'],
        ],
        notes: ['250 Nm torque', '170 km/h maximum speed', '90 kW max DC charging', '11 kW AC onboard charger'],
        detailSpecs: [
          { label: 'Battery capacity', value: '64 kWh' },
          { label: 'WLTP range', value: '430 km combined' },
          { label: 'Maximum power', value: '160 kW' },
          { label: 'Maximum torque', value: '250 Nm' },
          { label: 'Maximum speed', value: '170 km/h' },
          { label: '0-100 km/h', value: '< 7.9 s' },
          { label: 'Battery type', value: 'LFP' },
          { label: 'Drive type', value: 'RWD' },
          { label: 'Max DC charging power', value: '90 kW' },
          { label: 'Fast charging 30-80%', value: '21 min' },
          { label: 'AC charging 10-100%', value: '5.3 h' },
          { label: 'On-board charger', value: '11 kW AC' },
        ],
      },
    ],
    specs: [
      { label: 'Body type', value: '5-door 5-seater sedan' },
      { label: 'Dimensions', value: '4550 x 1860 x 1515 mm' },
      { label: 'Wheelbase', value: '2800 mm' },
      { label: 'Trunk capacity', value: '420 L, 1338 L with rear seats folded' },
      { label: 'Tyres', value: '215/60 R17 or 235/45 R19' },
      { label: 'Suspension', value: 'MacPherson front, five-link rear' },
      { label: 'Drive modes', value: 'Eco / Comfort / Sport' },
      { label: '0-100 km/h', value: '< 7.9 s' },
      { label: 'Drag coefficient', value: '0.23 Cd' },
      { label: 'V2L', value: 'Yes, max DC discharge power 3.3 kW' },
    ],
    highlights: [
      {
        title: 'Two LFP Battery Options',
        description: '51 kWh and 64 kWh battery options support daily use and longer-distance driving.',
      },
      {
        title: 'Fast Charging',
        description: '30-80% DC fast charging listed from 30 minutes on 51 kWh and 21 minutes on 64 kWh.',
      },
      {
        title: 'Refined Sedan Design',
        description: 'Clean exterior styling, low drag coefficient and modern interior display layout.',
      },
      {
        title: 'Smart and Connected',
        description: 'Catalogue highlights intelligent systems, connected experience and driver-focused controls.',
      },
    ],
    confirmationItems: [
      'Right-hand-drive availability',
      'NZ compliance pathway',
      'Final specification and English system support',
      'Warranty terms, parts supply and service pathway',
    ],
    quoteNote:
      'Source catalogue specifications are market-dependent. Final landed pricing, configuration, RHD availability and compliance must be confirmed before order.',
  },
  {
    slug: 'wox-nebula',
    modelCode: 'WOX NEBULA E501',
    name: 'WOX Nebula E501 Electric SUV',
    subtitle: '5-seat electric SUV with 500+ km range',
    summary:
      'A 5-door electric SUV with 63.8 kWh LFP battery, 150 kW front motor and smart connected cabin.',
    priceFrom: 'NZ$55,500',
    href: '/vehicles/china/wox-nebula',
    heroImage: '/images/wox-nebula/nebula-front-car.jpg',
    tags: ['5-seat SUV', '63.8 kWh LFP', '500+ km range'],
    quickSpecs: [
      ['Body', '5-door SUV'],
      ['Range', '500+ km CLTC / NEDC'],
      ['Battery', '63.8 kWh LFP'],
      ['Drive', 'FWD'],
    ],
    gallery: [
      { title: 'Front view', image: '/images/wox-nebula/nebula-front-car.jpg' },
      { title: 'Rear angle', image: '/images/wox-nebula/nebula-rear-car.jpg' },
      { title: 'RHD cabin', image: '/images/wox-nebula/nebula-interior-car.jpg' },
    ],
    versions: [
      {
        id: 'comfort',
        name: 'WOX Nebula Comfort',
        price: 'NZ$55,500',
        image: '/images/wox-nebula/nebula-front-car.jpg',
        bestFor: 'Private buyers and partners seeking a strong-value electric SUV package.',
        stats: [
          ['Range', '500+ km'],
          ['Battery', '63.8 kWh LFP'],
          ['Power', '150 kW'],
          ['Torque', '320 Nm'],
        ],
        notes: ['FWD single motor', '0-100 km/h in 7.7 s', 'Fast charge 30-80% in 0.6 hours', 'Liquid-cooled battery'],
        detailSpecs: [
          { label: 'Motor type', value: 'Permanent magnet synchronous motor' },
          { label: 'Drive type', value: 'FWD' },
          { label: 'Total motor power', value: '150 kW' },
          { label: 'Maximum torque', value: '320 Nm' },
          { label: 'E-motor output', value: '204 Ps' },
          { label: 'Driving motors', value: 'Single motor' },
          { label: 'Transmission type', value: 'Single gear transmission' },
          { label: 'Battery capacity', value: '63.8 kWh' },
          { label: 'Battery energy density', value: '135 Wh/kg' },
          { label: 'CLTC / NEDC range', value: '500+ km' },
          { label: 'Max DC fast charge', value: '70 kW' },
          { label: 'Fast charge 30-80%', value: '0.6 h' },
          { label: 'Slow charge 0-100%', value: '8.5 h' },
          { label: 'Battery cooling', value: 'Liquid cooling' },
        ],
      },
      {
        id: 'luxury',
        name: 'WOX Nebula Luxury',
        price: 'NZ$60,500',
        image: '/images/wox-nebula/nebula-rear-car.jpg',
        bestFor: 'Buyers wanting the higher-positioned Nebula package, subject to final spec confirmation.',
        stats: [
          ['Range', '500+ km'],
          ['Battery', '63.8 kWh LFP'],
          ['Power', '150 kW'],
          ['Torque', '320 Nm'],
        ],
        notes: [
          'Higher-positioned Nebula enquiry option',
          'FWD single motor',
          '0-100 km/h in 7.7 s',
          'Fast charge 30-80% in 0.6 hours',
          'Final Comfort / Luxury equipment differences to be confirmed before order',
        ],
        detailSpecs: [
          { label: 'Motor type', value: 'Permanent magnet synchronous motor' },
          { label: 'Drive type', value: 'FWD' },
          { label: 'Total motor power', value: '150 kW' },
          { label: 'Maximum torque', value: '320 Nm' },
          { label: 'E-motor output', value: '204 Ps' },
          { label: 'Driving motors', value: 'Single motor' },
          { label: 'Transmission type', value: 'Single gear transmission' },
          { label: 'Battery capacity', value: '63.8 kWh' },
          { label: 'Battery energy density', value: '135 Wh/kg' },
          { label: 'CLTC / NEDC range', value: '500+ km' },
          { label: 'Max DC fast charge', value: '70 kW' },
          { label: 'Fast charge 30-80%', value: '0.6 h' },
          { label: 'Slow charge 0-100%', value: '8.5 h' },
          { label: 'Battery cooling', value: 'Liquid cooling' },
        ],
      },
    ],
    specs: [
      { label: 'Body type', value: '5-door SUV, 5 seats' },
      { label: 'Dimensions', value: '4640 x 1870 x 1655 mm' },
      { label: 'Wheelbase', value: '2760 mm' },
      { label: 'Front / rear track', value: '1585 mm / 1595 mm' },
      { label: 'Ground clearance', value: '160 mm' },
      { label: 'Curb weight / GVW', value: '1880 kg / 2255 kg' },
      { label: 'Trunk volume', value: '450 L' },
      { label: 'Motor', value: 'Permanent magnet synchronous motor, 150 kW, 320 Nm' },
      { label: 'Battery', value: '63.8 kWh LiFePO4 (LFP), 135 Wh/kg' },
      { label: 'Charging', value: '70 kW max DC, 0.6 h fast charge 30-80%, 8.5 h slow charge' },
      { label: 'Performance', value: '160 km/h maximum speed, 7.7 s 0-100 km/h' },
      { label: 'Braking', value: '<= 38 m 0-100 km/h braking distance' },
    ],
    highlights: [
      {
        title: '500+ km Electric SUV',
        description: 'Catalogue lists 500+ km CLTC and NEDC range from a 63.8 kWh LFP battery.',
      },
      {
        title: 'Smart Cabin',
        description: 'Large connected cabin display, digital driver experience and modern interior treatment.',
      },
      {
        title: 'Confident Driving',
        description: '150 kW front motor, 320 Nm torque and 7.7 s 0-100 km/h acceleration listed.',
      },
      {
        title: 'Driver Assistance Focus',
        description: 'Catalogue positions Nebula around intelligent driving support and connected safety features.',
      },
    ],
    confirmationItems: [
      'Right-hand-drive availability',
      'NZ compliance pathway',
      'Charging compatibility',
      'Warranty terms, parts supply and service pathway',
    ],
    quoteNote:
      'Source catalogue specifications are market-dependent. Final landed pricing, configuration, RHD availability and compliance must be confirmed before order.',
  },
  {
    slug: 'wox-shera',
    modelCode: 'WOX SHERA TAXI EDITION',
    name: 'WOX Shera Taxi Edition',
    subtitle: 'Right-hand-drive 4-seat electric taxi sedan',
    summary:
      'A compact right-hand-drive electric sedan configured for taxi and fleet use, with simple running gear, practical cabin features and 300 km CLTC range.',
    priceFrom: 'POA',
    href: '/vehicles/china/wox-shera',
    heroImage: '/images/wox-shera/shera-front.jpg',
    tags: ['RHD taxi edition', '31.55 kWh LFP', '300 km CLTC'],
    quickSpecs: [
      ['Body', '5-door sedan'],
      ['Range', '300 km CLTC'],
      ['Battery', '31.55 kWh LFP'],
      ['Drive', 'RWD'],
    ],
    gallery: [
      { title: 'Front angle', image: '/images/wox-shera/shera-front.jpg' },
      { title: 'Rear angle', image: '/images/wox-shera/shera-rear.jpg' },
      { title: 'RHD cabin', image: '/images/wox-shera/shera-interior.jpg' },
    ],
    versions: [
      {
        id: 'taxi-edition-rhd',
        name: 'WOX Shera Taxi Edition RHD',
        price: 'POA',
        image: '/images/wox-shera/shera-front.jpg',
        bestFor: 'Taxi operators, fleets and city transport partners seeking a compact EV.',
        stats: [
          ['Range', '300 km CLTC'],
          ['Battery', '31.55 kWh'],
          ['Power', '45 kW peak'],
          ['Drive', 'RHD / RWD'],
        ],
        notes: [
          'Right-hand-drive taxi edition',
          'Permanent magnet synchronous motor',
          'Common port, GB/T 7-pin charging port',
          'Designed around simple fleet operation',
        ],
        detailSpecs: [
          { label: 'Battery capacity', value: '31.55 kWh' },
          { label: 'Battery type', value: 'LFP' },
          { label: 'CLTC range', value: '300 km' },
          { label: 'Motor type', value: 'Permanent magnet synchronous motor' },
          { label: 'Motor power', value: '22 / 45 kW' },
          { label: 'Peak power', value: '45 kW' },
          { label: 'Maximum speed', value: '100 km/h' },
          { label: 'Drive type', value: 'RWD' },
          { label: 'Maximum gradeability', value: '>= 20%' },
          { label: 'Voltage', value: '326 V' },
          { label: 'Charging method', value: 'AC slow, DC slow / fast combo' },
          { label: 'Charging port', value: 'Common port, GB/T 7-pin' },
        ],
      },
    ],
    specs: [
      { label: 'Class', value: 'Compact car' },
      { label: 'Body structure', value: '5-door 4-seat sedan' },
      { label: 'Dimensions', value: '4055 x 1630 x 1510 mm' },
      { label: 'Wheelbase', value: '2408 mm' },
      { label: 'Curb weight', value: '950 kg' },
      { label: 'Ground clearance', value: '170 mm full load' },
      { label: 'Turning diameter', value: '9.2 m' },
      { label: 'Trunk capacity', value: '255 L' },
      { label: 'Driving position', value: 'Right-hand drive' },
      { label: 'Suspension', value: 'MacPherson front, torsion beam rear' },
      { label: 'Tyres', value: '165/65 R14' },
      { label: 'Cabin equipment', value: '6 in instrument cluster, 9 in touchscreen, reverse camera' },
    ],
    highlights: [
      {
        title: 'Taxi and Fleet Focus',
        description: 'The Shera catalogue positions this model for taxi operators and high-usage city service.',
      },
      {
        title: 'Right-Hand Drive',
        description: 'The supplied technical page lists right-hand-drive layout, matching RHD market requirements.',
      },
      {
        title: 'Simple EV Package',
        description: '31.55 kWh LFP battery, RWD and compact dimensions support practical city operation.',
      },
      {
        title: 'Operational Cabin',
        description: '9-inch touchscreen, reverse camera, air conditioning and practical seating are listed for fleet use.',
      },
    ],
    confirmationItems: [
      'NZ taxi and fleet compliance pathway',
      'Charging connector compatibility',
      'Parts and service support',
      'Fleet warranty terms and delivery timing',
    ],
    quoteNote:
      'Shera source material is a taxi edition catalogue for an overseas project. Final NZ suitability, compliance, warranty and charging compatibility must be confirmed before order.',
  },
  {
    slug: 'wox-zeny',
    modelCode: 'WOX ZENY',
    name: 'WOX Zeny Solar Electric City Car',
    subtitle: 'Compact solar-assisted electric city car',
    summary:
      'A compact 4-seat solar-assisted electric city car with a 10.2 kWh LFP battery, fold-flat practicality and customizable exterior panels.',
    priceFrom: 'POA',
    href: '/vehicles/china/wox-zeny',
    heroImage: '/images/wox-zeny/zeny-front.jpg',
    tags: ['Solar assisted', '10.2 kWh LFP', '151 km battery range'],
    quickSpecs: [
      ['Body', '4-seat city car'],
      ['Range', '151 km + solar assist'],
      ['Battery', '10.2 kWh LFP'],
      ['Drive', 'RWD'],
    ],
    gallery: [
      { title: 'Front angle', image: '/images/wox-zeny/zeny-front.jpg' },
      { title: 'Front view', image: '/images/wox-zeny/zeny-front-direct.jpg' },
      { title: 'Rear view', image: '/images/wox-zeny/zeny-rear.jpg' },
      { title: 'Side profile', image: '/images/wox-zeny/zeny-side.jpg' },
      { title: 'Solar panel system', image: '/images/wox-zeny/zeny-solar.jpg' },
      { title: 'Cabin', image: '/images/wox-zeny/zeny-cabin.jpg' },
      { title: 'Seats', image: '/images/wox-zeny/zeny-seats.jpg' },
      { title: 'Cargo space', image: '/images/wox-zeny/zeny-cargo.jpg' },
      { title: 'Climate controls', image: '/images/wox-zeny/zeny-controls.jpg' },
      { title: 'Colour option - White', image: '/images/wox-zeny/zeny-color-white.jpg' },
      { title: 'Colour option - Pink', image: '/images/wox-zeny/zeny-color-pink.jpg' },
      { title: 'Colour option - Black', image: '/images/wox-zeny/zeny-color-black.jpg' },
    ],
    versions: [
      {
        id: 'solar-electric',
        name: 'WOX Zeny Solar Electric',
        price: 'POA',
        image: '/images/wox-zeny/zeny-front.jpg',
        bestFor: 'Short-distance city use, lifestyle mobility and solar-assisted demonstration projects.',
        stats: [
          ['Battery range', '151 km NEDC'],
          ['Solar assist', '55+ km/day'],
          ['Battery', '10.2 kWh LFP'],
          ['Power', '15 kW'],
        ],
        notes: [
          'Solar + electric hybrid drive positioning',
          'Fixed / deployed solar panel area listed as 1.6 / 3.2 m2',
          'Shown colour options include white, pink and black',
          'Rear seats fold flat for flexible cargo use',
          'Customizable exterior design panels',
        ],
        detailSpecs: [
          { label: 'Battery capacity', value: '10.2 kWh' },
          { label: 'Battery type', value: 'Lithium iron phosphate (LFP)' },
          { label: 'NEDC range', value: '151 km battery, plus 55+ km/day solar assist' },
          { label: 'Combined range claim', value: 'Up to 200+ km' },
          { label: 'Maximum power', value: '15 kW' },
          { label: 'Maximum torque', value: '85 Nm' },
          { label: 'Top speed', value: '80 km/h' },
          { label: 'Drive type', value: 'RWD' },
          { label: 'Solar panel size', value: '1.6 m2 fixed / 3.2 m2 deployed' },
          { label: 'Drive modes', value: 'Normal / Super Eco' },
          { label: 'Driving assistance', value: 'Rear radar and rearview camera' },
          { label: 'Personalization', value: 'Fully customizable design panel' },
        ],
      },
    ],
    specs: [
      { label: 'Body type', value: '4-seat compact city car' },
      { label: 'Dimensions', value: '3150 x 1491 x 1700 mm' },
      { label: 'Wheelbase', value: '2070 mm' },
      { label: 'Front / rear track', value: '1287 mm / 1290 mm' },
      { label: 'Ground clearance', value: '190 mm' },
      { label: 'Minimum turning radius', value: '4.75 m' },
      { label: 'Tyres', value: '165/70 R13C' },
      { label: 'Luggage space', value: '70-800 L' },
      { label: 'Rim material', value: 'Aluminum' },
      { label: 'Range note', value: 'Actual daily solar range may vary by weather, season and location' },
    ],
    highlights: [
      {
        title: 'Solar Assisted Mobility',
        description: 'Catalogue lists 151 km battery range with 55+ km/day solar assistance under suitable conditions.',
      },
      {
        title: 'Compact Outside',
        description: 'Short wheelbase, 4.75 m turning radius and tall packaging support easy parking and city use.',
      },
      {
        title: 'Flexible Cargo',
        description: 'Rear seats fold flat, expanding listed luggage space from 70 L up to 800 L.',
      },
      {
        title: 'Customizable Design',
        description: 'The Zeny catalogue highlights fully customizable exterior design panels.',
      },
    ],
    confirmationItems: [
      'Road compliance category and registration pathway',
      'Solar system practicality in NZ conditions',
      'Charging and connector compatibility',
      'Warranty, parts supply and service support',
    ],
    quoteNote:
      'Zeny solar range claims depend heavily on weather, season and geographic location. Final NZ compliance, registration category and specification must be confirmed before order.',
  },
] as const satisfies readonly WoxVehicle[];

export function getWoxVehicle(slug: WoxVehicle['slug']) {
  return woxVehicles.find((vehicle) => vehicle.slug === slug) ?? woxVehicles[0];
}
