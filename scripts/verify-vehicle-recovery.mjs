import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Local server required');
await fs.mkdir('tmp', { recursive: true });
await fs.writeFile('tmp/vehicle-recovery.html', '<div id="root"></div><script type="module" src="/tmp/vehicle-recovery.tsx"></script>');
await fs.writeFile('tmp/vehicle-recovery.tsx', `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router';
import {SiteTranslatorProvider} from '../src/app/components/SiteTranslator';
import {JapanMarketVehicleDetail} from '../src/app/pages/JapanMarketVehicleDetail';
function App(){const [id,setId]=useState('JPJC-A');return <><button id="a" onClick={()=>setId('JPJC-A')}>A</button><button id="b" onClick={()=>setId('JPJC-B')}>B</button><JapanMarketVehicleDetail vehicleId={id}/></>}
createRoot(document.getElementById('root')!).render(<MemoryRouter><SiteTranslatorProvider><App/></SiteTranslatorProvider></MemoryRouter>);
`);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.addInitScript(() => localStorage.setItem('inno-language', 'zh'));
const vehicle = id => ({ id: `JPJC-${id}`, make: 'Toyota', model: `Synthetic ${id}`, variant: '',
  year: 2020, mileage: 1000, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'Sedan',
  fobPriceNzd: 10000, sourcePriceType: 'FOB', priceBasis: 'FOB', priceCurrency: 'NZD',
  engine: '', driveType: '', colour: '', interiorGrade: null, chassisCode: '',
  japanPrice: null, imageUrls: [], location: 'Japan', status: 'Available', lastSeenAt: '', updatedAt: '' });
let requests = 0;
await page.route('**/*', route => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/functions/v1/japan-photo-review')) {
    requests++;
    if (requests === 2) return route.fulfill({ status: 503, body: 'temporary failure' });
    const id = route.request().postDataJSON().id.replace('JPJC-', '');
    return route.fulfill({ json: { vehicles: [vehicle(id)], pricing: {}, refreshedAt: '' } });
  }
  if (url.origin !== origin) return route.abort();
  return route.continue();
});
try {
  await page.goto(`${origin}/tmp/vehicle-recovery.html`);
  await page.getByRole('heading', { name: /Synthetic A/ }).waitFor();
  await page.locator('#b').click();
  await page.getByRole('heading', { name: '暂时无法查看该车辆' }).waitFor();
  assert.equal(await page.getByRole('heading', { name: /Synthetic A/ }).count(), 0);
  await page.locator('#a').click();
  await page.getByRole('heading', { name: /Synthetic A/ }).waitFor();
  await page.locator('#b').click();
  await page.getByRole('heading', { name: /Synthetic B/ }).waitFor();
  assert.equal(requests, 4);
  console.log('PASS failed vehicle switch clears previous vehicle; revisiting retries and recovers without reload.');
} finally { await browser.close(); }
