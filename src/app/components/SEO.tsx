import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SEO_CONFIG, SEO_ROUTE_PAIRS, SEO_ROUTES } from '../../config/seo';

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
  const englishPath = pathname;
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
  const routeKey = routeKeys.find((key) => key === pathname) ??
    (pathname.startsWith('/weekly-report/') ? '/weekly-report' : '/');
  return SEO_ROUTES[routeKey];
}

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const names: Record<string, string> = {
    vehicles: 'Vehicles',
    'weekly-report': 'Japan Market Weekly',
    'find-my-car': 'Find My Car',
    china: 'Cars from China',
    services: 'Services',
    finance: 'Finance',
    about: 'About',
    contact: 'Contact',
    'baw-m8': 'BAW M8 EV / REEV MPV',
    'wox-air': 'WOX AIR',
    'wox-nebula': 'WOX Nebula',
    'wox-shera': 'WOX Shera Taxi Edition',
    'wox-zeny': 'WOX Zeny',
  };

  const homeName = 'Home';
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: homeName,
      item: SEO_CONFIG.siteUrl,
    },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
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
    const lang = 'en-NZ';
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
    setMeta('og:locale', SEO_CONFIG.locale, 'property');
    setMeta('og:title', meta.title, 'property');
    setMeta('og:description', meta.description, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:image', imageUrl, 'property');
    setMeta('og:image:alt', 'Inno Group import cars Auckland', 'property');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);
    setMeta('twitter:image', imageUrl);
    setMeta('twitter:image:alt', 'Inno Group import cars Auckland');

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
        'Import cars',
        'Japan car auctions',
        'Used cars Auckland',
        'Vehicle finance Auckland',
        'Imported vehicle compliance New Zealand',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Vehicle services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Japanese vehicle sourcing',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Import landed cost and compliance guidance',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Used and import car finance enquiries',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'After-sales partner support',
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
        target: `${SEO_CONFIG.siteUrl}/vehicles/china?search={search_term_string}`,
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
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can Inno Group help me buy a used car in Auckland?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Inno Group can help Auckland and New Zealand buyers compare local used cars with suitable import options based on budget, model, mileage, and use case.',
          },
        },
        {
          '@type': 'Question',
          name: 'What costs are included in an import landed price?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A landed price can include the source vehicle price, service fees, exchange rate, GST, shipping, customs, compliance, registration, and condition-related costs.',
          },
        },
      ],
    });
    removeJsonLd('inno-vehicle-list-schema');
  }, [location.pathname]);

  return null;
}
