import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SEO_CONFIG, SEO_ROUTE_PAIRS, SEO_ROUTES } from '../../config/seo';
import { vehicles } from '../../data/vehicles';

const routeKeys = Object.keys(SEO_ROUTES) as Array<keyof typeof SEO_ROUTES>;

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.content = content;
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
}

function setAlternateLinks(pathname: string) {
  document.head
    .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][data-inno-alternate="true"]')
    .forEach((element) => element.remove());

  const pairs = SEO_ROUTE_PAIRS as Record<string, string>;
  const englishPath = pathname.startsWith('/zh')
    ? Object.entries(pairs).find(([, zhPath]) => zhPath === pathname)?.[0]
    : pathname;
  const chinesePath = englishPath ? pairs[englishPath] : undefined;

  if (!englishPath || !chinesePath) return;

  [
    ['en-NZ', englishPath],
    ['zh-NZ', chinesePath],
    ['x-default', englishPath],
  ].forEach(([hrefLang, path]) => {
    const element = document.createElement('link');
    element.rel = 'alternate';
    element.hrefLang = hrefLang;
    element.href = `${SEO_CONFIG.siteUrl}${path === '/' ? '' : path}`;
    element.dataset.innoAlternate = 'true';
    document.head.appendChild(element);
  });
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  let element = document.getElementById(id) as HTMLScriptElement | null;

  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

function getRouteMeta(pathname: string) {
  const routeKey = routeKeys.find((key) => key === pathname) ?? '/';
  return SEO_ROUTES[routeKey];
}

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const names: Record<string, string> = {
    zh: '中文首页',
    vehicles: pathname.startsWith('/zh') ? '车辆咨询' : 'Vehicles',
    services: pathname.startsWith('/zh') ? '服务与售后' : 'Services',
    finance: pathname.startsWith('/zh') ? '车辆贷款' : 'Finance',
    about: pathname.startsWith('/zh') ? '关于我们' : 'About',
    contact: pathname.startsWith('/zh') ? '联系咨询' : 'Contact',
  };

  const homeName = pathname.startsWith('/zh') ? '中文首页' : 'Home';
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: homeName,
      item: `${SEO_CONFIG.siteUrl}${pathname.startsWith('/zh') ? '/zh' : ''}`,
    },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    if (currentPath === '/zh') return;

    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: names[segment] ?? segment,
      item: `${SEO_CONFIG.siteUrl}${currentPath}`,
    });
  });

  return items;
}

export function SEO() {
  const location = useLocation();

  useEffect(() => {
    const meta = getRouteMeta(location.pathname);
    const canonicalUrl = `${SEO_CONFIG.siteUrl}${location.pathname === '/' ? '' : location.pathname}`;
    const imageUrl = new URL(SEO_CONFIG.defaultImage, SEO_CONFIG.siteUrl).href;
    const lang = 'lang' in meta ? meta.lang : 'en-NZ';
    const isChinese = lang.startsWith('zh');

    document.documentElement.lang = lang;
    document.title = meta.title;
    setMeta('description', meta.description);
    if ('keywords' in meta) {
      setMeta('keywords', meta.keywords);
    }
    setMeta('robots', 'index, follow');
    setMeta('theme-color', '#c7a24a');

    setLink('canonical', canonicalUrl);
    setAlternateLinks(location.pathname);

    setMeta('og:site_name', SEO_CONFIG.siteName, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:locale', isChinese ? SEO_CONFIG.zhLocale : SEO_CONFIG.locale, 'property');
    setMeta('og:locale:alternate', isChinese ? SEO_CONFIG.locale : SEO_CONFIG.zhLocale, 'property');
    setMeta('og:title', meta.title, 'property');
    setMeta('og:description', meta.description, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:image', imageUrl, 'property');
    setMeta('og:image:alt', 'Inno Group Japanese import cars Auckland', 'property');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);
    setMeta('twitter:image', imageUrl);
    setMeta('twitter:image:alt', 'Inno Group Japanese import cars Auckland');

    setJsonLd('inno-local-business-schema', {
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      image: imageUrl,
      telephone: SEO_CONFIG.phone,
      email: SEO_CONFIG.email,
      priceRange: SEO_CONFIG.priceRange,
      openingHours: SEO_CONFIG.openingHours,
      description: SEO_CONFIG.defaultDescription,
      address: {
        '@type': 'PostalAddress',
        ...SEO_CONFIG.address,
      },
      areaServed: SEO_CONFIG.areaServed,
      knowsAbout: [
        'Japanese import cars',
        'Japan car auctions',
        'Used cars Auckland',
        'Vehicle finance Auckland',
        'Imported vehicle compliance New Zealand',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: isChinese ? '车辆服务' : 'Vehicle services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isChinese ? '日本进口车车源代找' : 'Japanese vehicle sourcing',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isChinese ? '进口车落地价与合规咨询' : 'Import landed cost and compliance guidance',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isChinese ? '二手车与进口车贷款咨询' : 'Used and import car finance enquiries',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: isChinese ? '购车后售后伙伴支持' : 'After-sales partner support',
            },
          },
        ],
      },
    });

    setJsonLd('inno-website-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      inLanguage: lang,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SEO_CONFIG.siteUrl}/vehicles?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });

    setJsonLd('inno-breadcrumb-schema', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: getBreadcrumbItems(location.pathname),
    });

    setJsonLd('inno-faq-schema', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: isChinese
        ? [
            {
              '@type': 'Question',
              name: 'Inno Group 可以帮我在奥克兰买二手车吗？',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '可以。我们可以根据预算、用途、车型和配置，帮你判断适合本地二手车还是日本进口车，并提供中文买车咨询。',
              },
            },
            {
              '@type': 'Question',
              name: '日本进口车落地价包括哪些费用？',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '通常会包括日本车价、服务费、汇率、GST、运输、清关、合规、注册和其他根据车况产生的费用。',
              },
            },
          ]
        : [
            {
              '@type': 'Question',
              name: 'Can Inno Group help me buy a used car in Auckland?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Inno Group can help Auckland and New Zealand buyers compare local used cars with Japanese import options based on budget, model, mileage, and use case.',
              },
            },
            {
              '@type': 'Question',
              name: 'What costs are included in a Japanese import landed price?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'A landed price can include the Japan vehicle price, service fees, exchange rate, GST, shipping, customs, compliance, registration, and condition-related costs.',
              },
            },
          ],
    });

    if (location.pathname === '/vehicles' || location.pathname === '/zh/vehicles') {
      setJsonLd('inno-vehicle-list-schema', {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: isChinese ? '日本进口预订车辆示例' : 'Japanese import vehicle examples',
        description: meta.description,
        itemListElement: vehicles.map((vehicle, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Vehicle',
            name: vehicle.name,
            image: vehicle.image.startsWith('http')
              ? vehicle.image
              : new URL(vehicle.image, SEO_CONFIG.siteUrl).href,
            modelDate: vehicle.year,
            mileageFromOdometer: vehicle.mileage,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'NZD',
              price: vehicle.priceRange.replace(/[^0-9.]/g, ''),
              availability: 'https://schema.org/PreOrder',
              seller: {
                '@type': 'AutoDealer',
                name: SEO_CONFIG.siteName,
              },
            },
          },
        })),
      });
    } else {
      removeJsonLd('inno-vehicle-list-schema');
    }
  }, [location.pathname]);

  return null;
}
