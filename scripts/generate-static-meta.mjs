import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(projectRoot, 'dist');
const siteUrl = 'https://www.innogroup.co.nz';
const defaultImage = `${siteUrl}/og-social-2026.png`;

const routes = {
  '/': ['Import Cars NZ | Vehicle Sourcing | Inno Group Ltd', 'Inno Group helps New Zealand customers and dealers source vehicles through suitable overseas channels, including Japan and China.'],
  '/weekly-report': ['Japan Market Weekly | Vehicle Opportunities for New Zealand', 'Read Inno Group’s weekly Japan market observations and selected vehicle opportunities for New Zealand buyers.'],
  '/selected-vehicles': ['Selected Vehicles NZ | Inno Group Weekly Finds', 'Browse selected Japan-market vehicle opportunities reviewed by Inno Group for New Zealand buyers.'],
  '/vehicles/find-my-car': ['Find My Car NZ | Custom Vehicle Sourcing', 'Tell Inno Group the model, budget and specification you need. We search suitable overseas channels and explain landed cost and delivery.'],
  '/vehicles/china': ['Cars from China NZ | Factory-Backed Vehicle Sourcing', 'Explore selected Chinese EVs, MPVs, SUVs and commercial models available for New Zealand sourcing enquiries.'],
  '/vehicles/china/baw-m8': ['BAW M8 EV / REEV MPV Import NZ | 7/9-Seater Electric MPV', 'Explore the BAW M8 new-energy MPV and ask about New Zealand availability, specifications and landed pricing.', '/images/baw-m8/baw-m8-hero-left-75.jpg'],
  '/vehicles/china/wox-air': ['WOX AIR Import NZ | Electric Sedan from China', 'Explore WOX AIR versions, battery options, range and specification details for New Zealand sourcing enquiries.', '/images/wox-air/air-front-car.jpg'],
  '/vehicles/china/wox-nebula': ['WOX Nebula Import NZ | Electric SUV from China', 'Explore WOX Nebula SUV information, battery, range and specification details for New Zealand sourcing enquiries.', '/images/wox-nebula/nebula-front-car.jpg'],
  '/vehicles/china/wox-shera': ['WOX Shera Taxi Edition Import NZ | RHD Electric Taxi', 'Explore the WOX Shera Taxi Edition for fleet and taxi sourcing enquiries in New Zealand.', '/images/wox-shera/shera-front.jpg'],
  '/vehicles/china/wox-zeny': ['WOX Zeny Import NZ | Solar Assisted Electric City Car', 'Explore the WOX Zeny compact solar-assisted electric city car for New Zealand sourcing enquiries.', '/images/wox-zeny/zeny-front.jpg'],
  '/services': ['Vehicle Import Service Auckland | Inno Group Ltd', 'Vehicle sourcing and ownership support in Auckland, including landed cost, compliance, repairs and parts guidance.'],
  '/finance': ['Vehicle Finance Auckland | Used Car & Import Car Loans', 'Estimate repayments and start a vehicle finance enquiry for local and imported vehicles in Auckland.'],
  '/about': ['About Inno Group Ltd | Auckland Vehicle Sourcing', 'Learn about Inno Group Ltd, an Auckland vehicle sourcing company helping buyers access trusted overseas channels.'],
  '/contact': ['Vehicle Sourcing Quote Auckland | Contact Inno Group Ltd', 'Contact Inno Group in Albany for vehicle sourcing, import quotes, finance enquiries and tailored recommendations.'],
  '/privacy': ['Privacy Statement | Inno Group Ltd', 'How Inno Group Ltd collects, uses, stores and protects information submitted through this website.'],
};

const expansionSource = await readFile(join(projectRoot, 'src', 'data', 'woxExpansionVehicles.ts'), 'utf8');
const expansionVehicles = [...expansionSource.matchAll(/slug:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?image:\s*'([^']+)'/g)]
  .map(([, slug, name, image]) => ({ slug, name, image }));
for (const { slug, name, image } of expansionVehicles) {
  routes[`/vehicles/china/${slug}`] = [`${name} Import NZ | Inno Group`, `Explore ${name} and ask Inno Group about New Zealand availability, specification and indicative landed pricing.`, image];
}

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function replaceMeta(html, selector, value) {
  const escaped = escapeAttribute(value);
  const name = selector.startsWith('property') ? selector.match(/property="([^"]+)"/)?.[1] : selector.match(/name="([^"]+)"/)?.[1];
  const attribute = selector.startsWith('property') ? 'property' : 'name';
  const pattern = new RegExp(`<meta[^>]*${attribute}="${name}"[^>]*>`, 'i');
  return html.replace(pattern, `<meta ${attribute}="${name}" content="${escaped}" />`);
}

function absoluteUrl(path) {
  return path.startsWith('http') ? path : `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function breadcrumbSchema(route, title) {
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` }];
  if (route.startsWith('/vehicles/china/')) {
    items.push({ '@type': 'ListItem', position: 2, name: 'Cars from China', item: `${siteUrl}/vehicles/china` });
  } else if (route.startsWith('/weekly-report/')) {
    items.push({ '@type': 'ListItem', position: 2, name: 'Japan Market Weekly', item: `${siteUrl}/weekly-report` });
  }
  items.push({ '@type': 'ListItem', position: items.length + 1, name: title.split('|')[0].trim(), item: `${siteUrl}${route}` });
  return { '@type': 'BreadcrumbList', itemListElement: items };
}

function localBusinessSchema() {
  return {
    '@type': 'AutoDealer',
    name: 'Inno Group Ltd',
    url: `${siteUrl}/`,
    image: defaultImage,
    logo: `${siteUrl}/og-image.png`,
    telephone: '+64272858065',
    email: 'innogroup.shawn@gmail.com',
    priceRange: '$$',
    openingHours: ['Mo-Fr 10:00-17:00'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Unit 1A, 331 Rosedale Road',
      addressLocality: 'Albany',
      addressRegion: 'Auckland',
      postalCode: '0632',
      addressCountry: 'NZ',
    },
    areaServed: ['Auckland', 'North Shore', 'New Zealand'],
  };
}

function injectStructuredData(html, route, title, description, image) {
  const graph = [];
  if (route === '/' || route === '/about' || route === '/contact') graph.push(localBusinessSchema());
  if (route === '/') graph.push({ '@type': 'WebSite', name: 'Inno Group Ltd', url: `${siteUrl}/`, inLanguage: 'en-NZ' });
  if (route !== '/') graph.push(breadcrumbSchema(route, title));
  if (route.startsWith('/vehicles/china/') && image) {
    graph.push({
      '@type': 'Vehicle',
      name: title.split('|')[0].replace('Import NZ', '').trim(),
      brand: { '@type': 'Brand', name: route.includes('/baw-') ? 'BAW' : 'WOX' },
      description,
      image: absoluteUrl(image),
      url: `${siteUrl}${route}`,
    });
  }
  if (!graph.length) return html;
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
  return html.replace('</head>', `    <script type="application/ld+json">${json}</script>\n  </head>`);
}

// These generated JP auction snapshots are developer source data, not website assets.
await rm(join(distRoot, 'data', 'jpauc-paged'), { recursive: true, force: true });

const template = await readFile(join(distRoot, 'index.html'), 'utf8');
for (const [route, [title, description, image = defaultImage]] of Object.entries(routes)) {
  const canonical = `${siteUrl}${route === '/' ? '/' : route}`;
  const imageUrl = absoluteUrl(image);
  const imageAlt = route.startsWith('/vehicles/china/')
    ? `${title.split('|')[0].replace('Import NZ', '').trim()} vehicle information`
    : 'Inno Group vehicle sourcing across Japan and China';
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttribute(title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${canonical}" />`);
  html = replaceMeta(html, 'name="description"', description);
  html = replaceMeta(html, 'property="og:title"', title);
  html = replaceMeta(html, 'property="og:description"', description);
  html = replaceMeta(html, 'property="og:url"', canonical);
  html = replaceMeta(html, 'property="og:image"', imageUrl);
  html = replaceMeta(html, 'property="og:image:alt"', imageAlt);
  html = replaceMeta(html, 'name="twitter:title"', title);
  html = replaceMeta(html, 'name="twitter:description"', description);
  html = replaceMeta(html, 'name="twitter:image"', imageUrl);
  html = replaceMeta(html, 'name="twitter:image:alt"', imageAlt);
  if (imageUrl !== defaultImage) {
    html = html.replace(/\s*<meta property="og:image:(?:width|height)"[^>]*>/gi, '');
  }
  html = injectStructuredData(html, route, title, description, image);
  if (route === '/') {
    await writeFile(join(distRoot, 'index.html'), html);
  } else {
    const output = join(distRoot, route.slice(1), 'index.html');
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, html);
  }
}

let weeklyDetailHtml = template
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Japan Market Weekly Vehicle | Inno Group</title>')
  .replace(/\s*<link rel="canonical"[^>]*>/i, '');
weeklyDetailHtml = replaceMeta(weeklyDetailHtml, 'name="description"', 'Selected Japan-market vehicle information and sourcing guidance for New Zealand buyers from Inno Group.');
weeklyDetailHtml = replaceMeta(weeklyDetailHtml, 'property="og:title"', 'Japan Market Weekly Vehicle | Inno Group');
weeklyDetailHtml = replaceMeta(weeklyDetailHtml, 'property="og:description"', 'Selected Japan-market vehicle information and sourcing guidance for New Zealand buyers from Inno Group.');
weeklyDetailHtml = replaceMeta(weeklyDetailHtml, 'name="twitter:title"', 'Japan Market Weekly Vehicle | Inno Group');
weeklyDetailHtml = replaceMeta(weeklyDetailHtml, 'name="twitter:description"', 'Selected Japan-market vehicle information and sourcing guidance for New Zealand buyers from Inno Group.');
await writeFile(join(distRoot, 'weekly-report', 'detail.html'), weeklyDetailHtml);

const workflowHtml = template
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Inno Group Secure Workflow</title>')
  .replace(/\s*<link rel="canonical"[^>]*>/i, '')
  .replace(/<meta[^>]*name="robots"[^>]*>/i, '<meta name="robots" content="noindex, nofollow, noarchive" />');
await writeFile(join(distRoot, 'workflow.html'), workflowHtml);

console.log(`Generated route-specific HTML metadata for ${Object.keys(routes).length} public routes.`);
