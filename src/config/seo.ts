export const SEO_CONFIG = {
  siteName: 'Inno Group Ltd',
  siteUrl: 'https://www.innogroup.co.nz',
  locale: 'en_NZ',
  zhLocale: 'zh_NZ',
  defaultTitle: 'Import Car Auckland NZ | Vehicle Sourcing | Inno Group',
  defaultDescription:
    'Inno Group helps New Zealand customers, dealers and partners source vehicles from Japan, China, Macau and selected overseas markets with local support.',
  defaultImage: '/og-image.png',
  phone: '+642885307225',
  email: 'innogroup.shawn@gmail.com',
  priceRange: '$$',
  openingHours: ['Mo-Fr 10:00-17:00'],
  areaServed: ['Auckland', 'Albany', 'North Shore', 'Wairau Valley', 'New Zealand'],
  address: {
    streetAddress: 'Unit 1A, 331 Rosedale Road',
    addressLocality: 'Albany',
    addressRegion: 'Auckland',
    postalCode: '0632',
    addressCountry: 'NZ',
  },
} as const;

export const SEO_ROUTE_PAIRS = {
  '/': '/zh',
  '/services': '/zh/services',
  '/finance': '/zh/finance',
  '/about': '/zh/about',
  '/contact': '/zh/contact',
} as const;

export const SEO_ROUTES = {
  '/': {
    title: 'Global Vehicle Sourcing NZ | Inno Group Ltd',
    description:
      'Inno Group connects New Zealand customers, dealers and partners with trusted vehicle sources from Japan, China, Macau and selected overseas markets.',
    keywords:
      'vehicle sourcing NZ, import car Auckland, China car import NZ, Japanese import cars NZ, car sourcing Auckland, Inno Group Ltd',
  },
  '/vehicles/china': {
    title: 'Cars from China NZ | Factory-Backed Vehicle Sourcing',
    description:
      'Explore selected Chinese vehicles, including MPVs, SUVs, EVs, hybrids and commercial models sourced through trusted manufacturer and supplier relationships.',
    keywords:
      'Cars from China NZ, China car import NZ, Chinese EV import NZ, Chinese MPV NZ, new energy vehicle NZ, BAW M8 NZ, WOX AIR NZ, WOX Nebula NZ, WOX Shera NZ, WOX Zeny NZ',
  },
  '/vehicles/china/baw-m8': {
    title: 'BAW M8 EV / REEV MPV Import NZ | 7/9-Seater Electric MPV',
    description:
      'Configure the BAW M8 EV / REEV MPV for New Zealand direct import enquiry. A practical 7/9-seater new-energy people mover for family, shuttle, tourism and business transport.',
    keywords:
      'BAW M8 NZ, BAW M8 EV New Zealand, electric MPV NZ, 9 seater EV NZ, 7 seater MPV NZ, China car import NZ, new energy MPV NZ',
  },
  '/vehicles/china/wox-air': {
    title: 'WOX AIR Import NZ | Electric Sedan from China',
    description:
      'Explore WOX AIR electric sedan versions, battery options, range, charging and specification details for New Zealand sourcing enquiries.',
    keywords:
      'WOX AIR NZ, WOX AIR import, Chinese electric sedan NZ, EV import NZ, China EV sourcing',
  },
  '/vehicles/china/wox-nebula': {
    title: 'WOX Nebula Import NZ | Electric SUV from China',
    description:
      'Explore WOX Nebula E501 SUV model information, battery, range, performance and specification details for New Zealand sourcing enquiries.',
    keywords:
      'WOX Nebula NZ, WOX Nebula import, Chinese EV SUV NZ, China vehicle sourcing, EV import New Zealand',
  },
  '/vehicles/china/wox-shera': {
    title: 'WOX Shera Taxi Edition Import NZ | RHD Electric Taxi',
    description:
      'Explore the WOX Shera Taxi Edition, a right-hand-drive compact electric sedan for fleet and taxi sourcing enquiries.',
    keywords:
      'WOX Shera NZ, WOX Shera Taxi Edition, RHD electric taxi, Chinese taxi EV NZ, China fleet EV sourcing',
  },
  '/vehicles/china/wox-zeny': {
    title: 'WOX Zeny Import NZ | Solar Assisted Electric City Car',
    description:
      'Explore the WOX Zeny solar-assisted electric city car with compact dimensions, customizable panels and flexible short-distance EV usability.',
    keywords:
      'WOX Zeny NZ, solar electric car, solar assisted EV, compact city EV NZ, China mini EV import',
  },
  '/services': {
    title: 'Vehicle Import Service Auckland | Inno Group Ltd',
    description:
      'Vehicle sourcing and ownership support in Auckland, including Japan sourcing guidance, landed cost estimates, compliance advice, repair referrals, parts and partner support.',
    keywords:
      'car import service Auckland, vehicle sourcing NZ, Japan car import service Auckland, imported car compliance NZ, car ownership support Auckland',
  },
  '/ownership': {
    title: 'Imported Car Ownership Support Auckland | Inno Group Ltd',
    description:
      'After-sales ownership support for imported cars in Auckland, including trusted partner referrals, repairs, parts support, tyres, detailing and practical help after purchase.',
    keywords:
      'imported car ownership support Auckland, imported car repairs NZ, Japanese car parts Auckland, vehicle after-sales support NZ',
  },
  '/finance': {
    title: 'Vehicle Finance Auckland | Used Car & Import Car Loans',
    description:
      'Estimate weekly repayments and start a no-pressure vehicle finance enquiry for used cars, local stock and imported vehicles in Auckland, New Zealand.',
    keywords:
      'vehicle finance Auckland, used car finance NZ, import car finance NZ, car loan Auckland, weekly car repayments',
  },
  '/about': {
    title: 'About Inno Group Ltd | Auckland Vehicle Sourcing',
    description:
      'Learn about Inno Group Ltd, an Auckland vehicle sourcing company helping New Zealand buyers and partners access trusted overseas vehicle channels.',
    keywords:
      'Inno Group Ltd, Auckland car dealer, vehicle sourcing Auckland, Albany car dealer, Japan vehicle sourcing Auckland, China vehicle sourcing NZ',
  },
  '/contact': {
    title: 'Vehicle Sourcing Quote Auckland | Contact Inno Group Ltd',
    description:
      'Contact Inno Group Ltd in Albany, Auckland for vehicle sourcing, import car quotes, China vehicle enquiries, finance enquiries and tailored recommendations.',
    keywords:
      'vehicle sourcing quote Auckland, import car quote Auckland, China car quote NZ, contact car dealer Auckland, Inno Group contact',
  },
  '/zh': {
    title: '奥克兰车辆进口与买车服务 | Inno Group Ltd',
    description:
      'Inno Group Ltd 提供奥克兰买车咨询、日本进口车、中国车源、车辆贷款、落地价估算和售后伙伴支持。',
    keywords:
      '奥克兰买车, 新西兰买车, 日本进口车, 中国车源, 进口二手车, 奥克兰车商, 新西兰进口车',
    lang: 'zh-NZ',
  },
  '/zh/services': {
    title: '车辆进口服务与落地价说明 | Inno Group Ltd',
    description:
      '了解日本进口车选车、拍卖、运输、新西兰合规、进口车落地价估算和售后伙伴支持。',
    keywords:
      '日本进口车流程, 进口车落地价, 新西兰进口车合规, 奥克兰进口车服务, 日本拍卖车',
    lang: 'zh-NZ',
  },
  '/zh/finance': {
    title: '新西兰买车贷款与预算规划 | Inno Group Ltd',
    description:
      '了解新西兰买车贷款、预算规划、首付、还款周期和二手车或进口车购买前的费用判断。',
    keywords: '新西兰买车贷款, 奥克兰车贷, 二手车贷款, 日本进口车贷款, 买车预算',
    lang: 'zh-NZ',
  },
  '/zh/about': {
    title: '关于 Inno Group | 奥克兰车辆进口服务',
    description:
      'Inno Group Ltd 位于奥克兰 Albany，帮助新西兰客户了解日本进口车、中国车源、本地二手车和买车后的实际支持。',
    keywords: 'Inno Group, 奥克兰车商, Albany 二手车, 日本进口车服务, 新西兰华人买车',
    lang: 'zh-NZ',
  },
  '/zh/contact': {
    title: '中文买车咨询 | 联系 Inno Group Ltd',
    description:
      '联系 Inno Group Ltd 获取中文买车建议、日本进口车报价、中国车源咨询、奥克兰二手车咨询和 WhatsApp 支持。',
    keywords: '中文买车咨询, 奥克兰买车, 日本进口车报价, 奥克兰二手车咨询, 新西兰华人买车',
    lang: 'zh-NZ',
  },
} as const;
