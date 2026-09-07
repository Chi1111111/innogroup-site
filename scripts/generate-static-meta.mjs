import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(projectRoot, 'dist');
const seoData = JSON.parse(await readFile(join(projectRoot, 'src', 'config', 'seoData.json'), 'utf8'));
const seoConfig = seoData.config;
const siteUrl = seoConfig.siteUrl;
const defaultImage = `${siteUrl}${seoConfig.defaultImage}`;
const routes = Object.fromEntries(
  Object.entries(seoData.routes).map(([route, meta]) => [
    route,
    [meta.title, meta.description, meta.image],
  ])
);

Object.assign(routes, {
  '/japan-market/toyota': ['Toyota for Import from Japan | Inno Group NZ', 'Browse Toyota vehicles available from Japan and view estimated landed pricing for New Zealand.'],
  '/japan-market/toyota/crown': ['Toyota Crown for Import from Japan | Inno Group NZ', 'Browse Toyota Crown vehicles available from Japan and view estimated landed pricing for New Zealand.'],
  '/japan-market/toyota/alphard': ['Toyota Alphard for Import from Japan | Inno Group NZ', 'Browse Toyota Alphard vehicles available from Japan and view estimated landed pricing for New Zealand.'],
  '/japan-market/lexus': ['Lexus for Import from Japan | Inno Group NZ', 'Browse Lexus vehicles available from Japan and view estimated landed pricing for New Zealand.'],
  '/japan-market/nissan': ['Nissan for Import from Japan | Inno Group NZ', 'Browse Nissan vehicles available from Japan and view estimated landed pricing for New Zealand.'],
  '/japan-market/honda': ['Honda for Import from Japan | Inno Group NZ', 'Browse Honda vehicles available from Japan and view estimated landed pricing for New Zealand.'],
  '/japan-market/mazda': ['Mazda for Import from Japan | Inno Group NZ', 'Browse Mazda vehicles available from Japan and view estimated landed pricing for New Zealand.'],
  '/japan-market/subaru': ['Subaru for Import from Japan | Inno Group NZ', 'Browse Subaru vehicles available from Japan and view estimated landed pricing for New Zealand.'],
});

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
    name: seoConfig.siteName,
    url: `${siteUrl}/`,
    image: defaultImage,
    logo: `${siteUrl}/og-image.png`,
    telephone: seoConfig.phone,
    email: seoConfig.email,
    priceRange: seoConfig.priceRange,
    openingHours: seoConfig.openingHours,
    address: {
      '@type': 'PostalAddress',
      ...seoConfig.address,
    },
    areaServed: seoConfig.areaServed,
  };
}

function injectStructuredData(html, route, title, description, image) {
  const graph = [];
  if (route === '/' || route === '/about' || route === '/contact') graph.push(localBusinessSchema());
  if (route === '/') graph.push({ '@type': 'WebSite', name: seoConfig.siteName, url: `${siteUrl}/`, inLanguage: 'en-NZ' });
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
