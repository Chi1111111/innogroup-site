export const SEO_CONFIG = {
  siteName: 'Inno Group Ltd',
  siteUrl: 'https://www.innogroup.co.nz',
  locale: 'en_NZ',
  zhLocale: 'zh_NZ',
  defaultTitle: 'Japanese Import Cars NZ | Used Cars Auckland | Inno Group Ltd',
  defaultDescription:
    'Buy the right used car or Japanese import in Auckland with Inno Group Ltd. Japan direct sourcing, landed price estimates, finance guidance, compliance, and after-sales support.',
  defaultImage: '/og-image.png',
  phone: '+642885307225',
  email: 'innogroup.shawn@gmail.com',
  priceRange: '$$',
  openingHours: ['Mo-Fr 10:00-17:00'],
  areaServed: ['Auckland', 'Albany', 'North Shore', 'New Zealand'],
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
  '/vehicles': '/zh/vehicles',
  '/services': '/zh/services',
  '/finance': '/zh/finance',
  '/about': '/zh/about',
  '/contact': '/zh/contact',
} as const;

export const SEO_ROUTES = {
  '/': {
    title: 'Japanese Import Cars NZ | Used Cars Auckland | Inno Group Ltd',
    description:
      'Buy the right used car or Japanese import in Auckland with Inno Group Ltd. Japan direct sourcing, landed price estimates, finance guidance, compliance, and after-sales support.',
    keywords:
      'Japanese import cars NZ, used cars Auckland, import cars New Zealand, buy a car Auckland, Japan car auctions NZ, Inno Group',
  },
  '/vehicles': {
    title: 'Japanese Import Cars & Used Cars Auckland | Vehicles We Can Source',
    description:
      'Browse example Japanese import cars and used vehicles we can source for Auckland and New Zealand buyers. Request recommendations by budget, model, year, mileage, and use case.',
    keywords:
      'Japanese import cars Auckland, used cars Auckland, import vehicles NZ, Japan pre-order cars, Toyota Alphard NZ, Porsche Taycan import',
  },
  '/services': {
    title: 'Japan Car Import Services Auckland | Ownership Support',
    description:
      'Japan car import and ownership support in Auckland, including landed cost guidance, compliance advice, repair referrals, parts support, bodywork, paint, and partner help.',
    keywords:
      'Japan car import service Auckland, imported car compliance NZ, car ownership support Auckland, Japanese car parts NZ',
  },
  '/ownership': {
    title: 'Ownership Support | Inno Group Ltd',
    description:
      'Practical ownership support after purchase, including partner referrals, repairs, parts support, and help keeping your vehicle on the road.',
    keywords: 'vehicle ownership support Auckland, imported car repairs NZ, Japanese car parts Auckland',
  },
  '/finance': {
    title: 'Vehicle Finance Auckland | Used Car & Import Car Finance',
    description:
      'Estimate weekly repayments and start a no-pressure vehicle finance enquiry for used cars, local stock, and Japanese import cars in Auckland, New Zealand.',
    keywords:
      'vehicle finance Auckland, used car finance NZ, import car finance, car loan Auckland, weekly car repayments',
  },
  '/about': {
    title: 'About Inno Group Ltd | Auckland Japanese Import Car Specialists',
    description:
      'Learn about Inno Group Ltd, an Auckland-based Japanese import car and used vehicle sourcing partner helping New Zealand drivers buy with clearer information.',
    keywords:
      'Inno Group Ltd, Auckland car dealer, Japanese import specialist Auckland, Albany car dealer',
  },
  '/contact': {
    title: 'Contact Inno Group Ltd | Used Car & Japanese Import Quote Auckland',
    description:
      'Contact Inno Group Ltd in Albany, Auckland for used car advice, Japanese import quotes, local stock enquiries, WhatsApp support, and tailored sourcing recommendations.',
    keywords:
      'contact car dealer Auckland, Japanese import quote NZ, used car quote Auckland, Inno Group contact',
  },
  '/zh': {
    title: '奥克兰二手车与日本进口车 | 新西兰买车服务 | Inno Group Ltd',
    description:
      'Inno Group Ltd 提供奥克兰二手车、日本进口车、新西兰买车咨询、进口车落地价估算、车源代找、车辆贷款和售后伙伴支持。',
    keywords:
      '奥克兰二手车, 新西兰买车, 日本进口车, 进口二手车, 奥克兰买车, 日本拍卖车, 新西兰进口车',
    lang: 'zh-NZ',
  },
  '/zh/vehicles': {
    title: '日本进口车与奥克兰二手车推荐 | Inno Group Ltd',
    description:
      '根据预算、用途、年份、公里数和配置，帮你筛选适合新西兰使用的日本进口车、本地二手车和预订车源。',
    keywords:
      '日本进口车推荐, 奥克兰二手车, 新西兰二手车, 日本预订车源, 买车推荐奥克兰',
    lang: 'zh-NZ',
  },
  '/zh/services': {
    title: '日本进口车流程与落地价说明 | Inno Group Ltd',
    description:
      '了解日本进口车选车、拍卖、运输、新西兰合规、进口车落地价估算和售后伙伴支持。',
    keywords:
      '日本进口车流程, 进口车落地价, 新西兰进口车合规, 奥克兰进口车服务, 日本拍卖车',
    lang: 'zh-NZ',
  },
  '/zh/finance': {
    title: '新西兰买车贷款与预算规划 | Inno Group Ltd',
    description:
      '了解新西兰买车贷款、预算规划、首付、还款周期和二手车或日本进口车购买前的费用判断。',
    keywords: '新西兰买车贷款, 奥克兰车贷, 二手车贷款, 日本进口车贷款, 买车预算',
    lang: 'zh-NZ',
  },
  '/zh/about': {
    title: '关于 Inno Group | 奥克兰日本进口车服务',
    description:
      'Inno Group Ltd 位于奥克兰 Albany，帮助新西兰客户了解日本进口车、本地二手车和买车后的实际支持。',
    keywords: 'Inno Group, 奥克兰车商, Albany 二手车, 日本进口车服务, 新西兰华人买车',
    lang: 'zh-NZ',
  },
  '/zh/contact': {
    title: '中文买车咨询 | 联系 Inno Group Ltd',
    description:
      '联系 Inno Group Ltd 获取中文买车建议、日本进口车报价、奥克兰二手车咨询和 WhatsApp 支持。',
    keywords: '中文买车咨询, 奥克兰买车, 日本进口车报价, 奥克兰二手车咨询, 新西兰华人买车',
    lang: 'zh-NZ',
  },
} as const;
