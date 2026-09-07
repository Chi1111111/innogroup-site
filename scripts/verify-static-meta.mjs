import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const seoData = JSON.parse(await readFile(join(projectRoot, 'src', 'config', 'seoData.json'), 'utf8'));

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

for (const [route, meta] of Object.entries(seoData.routes)) {
  const file = route === '/'
    ? join(projectRoot, 'dist', 'index.html')
    : join(projectRoot, 'dist', route.slice(1), 'index.html');
  const html = await readFile(file, 'utf8');

  assert.ok(
    html.includes(`<title>${escapeAttribute(meta.title)}</title>`),
    `${route} has stale static title metadata`
  );
  assert.ok(
    html.includes(`<meta name="description" content="${escapeAttribute(meta.description)}" />`),
    `${route} has stale static description metadata`
  );
}

console.log(`Verified shared SEO metadata for ${Object.keys(seoData.routes).length} base routes.`);
