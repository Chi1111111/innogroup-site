import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SEO_CONFIG, SEO_ROUTES } from '../../config/seo';
import { getWoxExpansionVehicle } from '../../data/woxExpansionVehicles';

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

function removeMeta(name: string, attribute: 'name' | 'property' = 'name') {
  document.head.querySelector(`meta[${attribute}="${name}"]`)?.remove();
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
  const expansionVehicle = pathname.startsWith('/vehicles/china/')
    ? getWoxExpansionVehicle(pathname.split('/').filter(Boolean).at(-1))
    : undefined;
  if (expansionVehicle) {
    return {
      title: `${expansionVehicle.name} Import NZ | Inno Group`,
      description: `${expansionVehicle.summary.en} Ask Inno Group about New Zealand availability, specification and landed pricing.`,
      keywords: `${expansionVehicle.name} NZ, ${expansionVehicle.name} import, Cars from China NZ`,
      image: expansionVehicle.image,
      vehicle: expansionVehicle,
      isKnown: true,
    };
  }
  const routeKey = routeKeys.find((key) => key === pathname) ??
    (pathname.startsWith('/weekly-report/') ? '/weekly-report' : undefined);
  const fallback = SEO_ROUTES['/'];
  return { ...(routeKey ? SEO_ROUTES[routeKey] : fallback), isKnown: Boolean(routeKey) || pathname === '/' };
}

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean).filter((segment) => segment !== 'vehicles');
  const names: Record<string, string> = {
    vehicles: 'Vehicles',
    'weekly-report': 'Japan Market Weekly',
    'find-my-car': 'Find My Car',
    china: 'Cars from China',
    services: 'Services',
    finance: 'Finance',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy',
    'selected-vehicles': 'Selected Vehicles',
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
  segments.forEach((segment) => {
    currentPath = segment === 'china'
      ? '/vehicles/china'
      : segment === 'find-my-car'
        ? '/vehicles/find-my-car'
        : currentPath === '/vehicles/china'
          ? `${currentPath}/${segment}`
          : `${currentPath}/${segment}`;
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: names[segment] ?? segment.replaceAll('-', ' '),
      item: `${SEO_CONFIG.siteUrl}${currentPath}`,
    });
  });

  return items;
}

export function SEO() {
  const location = useLocation();

  useEffect(() => {
    const meta = getRouteMeta(location.pathname);
    const canonicalUrl = `${SEO_CONFIG.siteUrl}${location.pathname === '/' ? '/' : location.pathname}`;
    const imageUrl = new URL('image' in meta ? meta.image : SEO_CONFIG.defaultImage, SEO_CONFIG.siteUrl).href;
    const lang = 'en-NZ';
    const isWorkflowRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/sign/') || location.pathname.startsWith('/contract/');
    const shouldIndex = meta.isKnown && !isWorkflowRoute && location.pathname !== '/404';
    document.title = meta.title;
    setMeta('description', meta.description);
    removeMeta('keywords');
    setMeta('robots', shouldIndex ? 'index, follow' : 'noindex, nofollow');
    setMeta('theme-color', '#c7a24a');

    setLink('canonical', canonicalUrl);
    setMeta('og:site_name', SEO_CONFIG.siteName, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:locale', SEO_CONFIG.locale, 'property');
    setMeta('og:title', meta.title, 'property');
    setMeta('og:description', meta.description, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:image', imageUrl, 'property');
    const imageAlt = 'vehicle' in meta && meta.vehicle ? `${meta.vehicle.name} vehicle information` : 'Inno Group vehicle sourcing across Japan and China';
    setMeta('og:image:alt', imageAlt, 'property');
    if (imageUrl.endsWith('/og-social-2026.png')) {
      setMeta('og:image:width', '1729', 'property');
      setMeta('og:image:height', '910', 'property');
    } else {
      removeMeta('og:image:width', 'property');
      removeMeta('og:image:height', 'property');
    }

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);
    setMeta('twitter:image', imageUrl);
    setMeta('twitter:image:alt', imageAlt);

    if (location.pathname === '/' || location.pathname === '/about' || location.pathname === '/contact') {
      setJsonLd('inno-local-business-schema', {
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      image: new URL(SEO_CONFIG.defaultImage, SEO_CONFIG.siteUrl).href,
      logo: `${SEO_CONFIG.siteUrl}/og-image.png`,
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
    } else {
      removeJsonLd('inno-local-business-schema');
    }

    if (location.pathname === '/') {
      setJsonLd('inno-website-schema', {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.siteUrl,
        inLanguage: lang,
      });
    } else {
      removeJsonLd('inno-website-schema');
    }

    if (location.pathname === '/') {
      removeJsonLd('inno-breadcrumb-schema');
    } else {
      setJsonLd('inno-breadcrumb-schema', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: getBreadcrumbItems(location.pathname),
      });
    }

    removeJsonLd('inno-faq-schema');
    if ('vehicle' in meta && meta.vehicle) {
      setJsonLd('inno-vehicle-schema', {
        '@context': 'https://schema.org',
        '@type': 'Vehicle',
        name: meta.vehicle.name,
        brand: { '@type': 'Brand', name: meta.vehicle.brand },
        description: meta.vehicle.overview.en,
        image: imageUrl,
        url: canonicalUrl,
        vehicleConfiguration: meta.vehicle.subtitle.en,
      });
    } else {
      removeJsonLd('inno-vehicle-schema');
    }
    removeJsonLd('inno-vehicle-list-schema');
  }, [location.pathname]);

  return null;
}
