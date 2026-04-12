import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SEO_CONFIG, SEO_ROUTES } from '../../config/seo';

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
  const routeKey = routeKeys.find((key) => key === pathname) ?? '/';
  return SEO_ROUTES[routeKey];
}

export function SEO() {
  const location = useLocation();

  useEffect(() => {
    const meta = getRouteMeta(location.pathname);
    const canonicalUrl = `${SEO_CONFIG.siteUrl}${location.pathname === '/' ? '' : location.pathname}`;
    const imageUrl = new URL(SEO_CONFIG.defaultImage, SEO_CONFIG.siteUrl).href;

    document.title = meta.title;
    setMeta('description', meta.description);
    setMeta('robots', 'index, follow');
    setMeta('theme-color', '#c7a24a');

    setLink('canonical', canonicalUrl);

    setMeta('og:site_name', SEO_CONFIG.siteName, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:locale', SEO_CONFIG.locale, 'property');
    setMeta('og:title', meta.title, 'property');
    setMeta('og:description', meta.description, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:image', imageUrl, 'property');

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);
    setMeta('twitter:image', imageUrl);

    setJsonLd('inno-local-business-schema', {
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      image: imageUrl,
      telephone: SEO_CONFIG.phone,
      email: SEO_CONFIG.email,
      address: {
        '@type': 'PostalAddress',
        ...SEO_CONFIG.address,
      },
      areaServed: ['Auckland', 'New Zealand'],
      makesOffer: [
        'Japan vehicle sourcing',
        'Vehicle import support',
        'Vehicle finance enquiries',
        'After-sales support',
      ],
    });

    setJsonLd('inno-website-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      inLanguage: 'en-NZ',
    });
  }, [location.pathname]);

  return null;
}
